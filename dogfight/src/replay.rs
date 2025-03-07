use std::{collections::BTreeMap, env};

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    input::{PlayerCommand, ServerInput},
    network::encoding::NetworkedBytes,
    world::World,
};

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ReplayTickCommand {
    player_guid_index: u16,
    command: PlayerCommand,
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
    tick_number: u32,
    commands: Vec<ReplayTickCommand>,
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

impl NetworkedBytes for ReplayFile {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];

        // look how pretty this is
        bytes.extend(self.player_guids.to_bytes());
        bytes.extend(self.ticks.to_bytes());
        bytes.extend(self.level_name.to_bytes());
        bytes.extend(self.level_data.to_bytes());
        bytes.extend(self.build_version.to_bytes());
        bytes.extend(self.build_commit.to_bytes());

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (bytes, player_guids) = BTreeMap::<String, u16>::from_bytes(bytes)?;
        let (bytes, ticks) = Vec::<ReplayTick>::from_bytes(bytes)?;
        let (bytes, level_name) = String::from_bytes(bytes)?;
        let (bytes, level_data) = String::from_bytes(bytes)?;
        let (bytes, build_version) = String::from_bytes(bytes)?;
        let (bytes, build_commit) = String::from_bytes(bytes)?;

        Some((
            bytes,
            Self {
                build_version,
                build_commit,
                level_name,
                level_data,
                player_guids,
                ticks,
            },
        ))
    }
}

impl NetworkedBytes for ReplayTick {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];
        bytes.extend(u32::to_bytes(&self.tick_number));
        bytes.extend(Vec::<ReplayTickCommand>::to_bytes(&self.commands));
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (mut bytes, tick_number) = u32::from_bytes(bytes)?;
        let (slice, commands) = Vec::<ReplayTickCommand>::from_bytes(bytes)?;
        bytes = slice;
        Some((
            bytes,
            Self {
                tick_number,
                commands,
            },
        ))
    }
}

impl NetworkedBytes for ReplayTickCommand {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];
        bytes.extend(self.player_guid_index.to_bytes());
        bytes.extend(self.command.to_bytes());
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (bytes, player_guid_index) = u16::from_bytes(bytes)?;
        let (bytes, command) = PlayerCommand::from_bytes(bytes)?;
        Some((
            bytes,
            Self {
                player_guid_index,
                command,
            },
        ))
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
}
