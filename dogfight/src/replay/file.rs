use std::{collections::BTreeMap, env};

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    input::{PlayerCommand, ServerInput},
    network::encoding::NetworkedBytes,
    world::World,
};

use super::events::{output_to_event, ReplayEvent};

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ReplayTickCommand {
    pub player_guid_index: u16,
    pub command: PlayerCommand,
}

impl ReplayTickCommand {
    pub fn new(player_guid_index: u16, command: PlayerCommand) -> Self {
        Self {
            player_guid_index,
            command,
        }
    }
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ReplayTick {
    pub tick_number: u32,
    pub commands: Vec<ReplayTickCommand>,
}

impl ReplayTick {
    pub fn new(tick_number: u32, commands: Vec<ReplayTickCommand>) -> Self {
        return Self {
            tick_number,
            commands,
        };
    }
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ReplayFile {
    pub build_version: String,
    pub build_commit: String,

    pub level_name: String,
    pub level_data: String,

    pub player_guids: BTreeMap<String, u16>,

    pub ticks: Vec<ReplayTick>,
}

pub fn get_build_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub fn get_commit_version() -> &'static str {
    env!("COMMIT")
}

impl ReplayFile {
    pub fn new() -> Self {
        ReplayFile {
            build_version: get_build_version(),
            build_commit: get_commit_version().to_string(),
            level_data: "".to_string(),
            level_name: "".to_string(),
            player_guids: BTreeMap::new(),
            ticks: vec![],
        }
    }
}

impl World {
    pub(crate) fn add_replay_input(&mut self, tick_number: u32, input: &Vec<ServerInput>) -> () {
        if input.len() <= 0 {
            return;
        }

        let mut commands = vec![];

        for entry in input {
            let guid = &entry.player_guid;
            let next_index = self.replay_file.player_guids.len() as u16;

            let index = match self.replay_file.player_guids.get(guid) {
                Some(existing_id) => *existing_id,
                None => match self
                    .replay_file
                    .player_guids
                    .insert(guid.clone(), next_index)
                {
                    Some(_) => panic!("Item already existed!"),
                    None => next_index,
                },
            };

            commands.push(ReplayTickCommand::new(index, entry.command.clone()));
        }

        self.replay_file
            .ticks
            .push(ReplayTick::new(tick_number, commands));

        // log(format!("entries: {}", self.replay_file.ticks.len()));
    }

    pub fn get_replay_file_bytes(&self) -> Vec<u8> {
        self.replay_file.to_bytes()
    }

    pub fn simulate_until(&mut self, replay: &ReplayFile, tick: Option<u32>) -> Vec<ReplayEvent> {
        let mut events = vec![];

        let start_tick = self.get_tick();
        let max_tick = match tick {
            Some(end) => end,
            None => replay.ticks.iter().map(|t| t.tick_number).max().unwrap(),
        };

        for current_tick in start_tick..max_tick {
            let maybe_input = replay.ticks.iter().find(|x| x.tick_number == current_tick);
            let input: Vec<ServerInput> = match maybe_input {
                Some(tick_data) => tick_data
                    .commands
                    .iter()
                    .map(|c| {
                        let player_guid = replay
                            .player_guids
                            .iter()
                            .nth(c.player_guid_index as usize)
                            .unwrap()
                            .0
                            .clone();

                        ServerInput {
                            player_guid,
                            command: c.command.clone(),
                        }
                    })
                    .collect(),
                None => vec![],
            };

            self.tick(input);
            let output = self.flush_changed_state();
            let tick_events: Vec<ReplayEvent> = output
                .iter()
                .map(|x| output_to_event(current_tick, x.clone()))
                .filter_map(|x| x)
                .collect();

            events.extend(tick_events);
        }

        events
    }
}
