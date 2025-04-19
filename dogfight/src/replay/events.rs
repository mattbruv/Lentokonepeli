use serde::Serialize;
use ts_rs::TS;

use crate::{
    entities::{container::PlayerId, player::PlayerGuid, types::Team},
    game_event::{ChatMessage, KillMethod},
    input::PlayerCommand,
    network::encoding::NetworkedBytes,
    output::ServerOutput,
    world::World,
};

use super::file::{ReplayFile, ReplaySummary};

#[derive(Debug, Serialize, TS)]
#[ts(export)]
pub struct ReplayEvent {
    pub tick: u32,
    pub player: PlayerGuid,
    pub event: ReplayEventType,
}

// A subset of ServerOutput with only things we care about for replays
#[derive(Debug, Serialize, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum ReplayEventType {
    //PlayerJoin(String),
    //PlayerLeave(String),
    //PlayerJoinTeam { id: PlayerId, team: Team },
    //ChatMessage(ChatMessage),
    Suicide,
    Killed(PlayerGuid),
    KilledBy(PlayerGuid),

    AbandonedPlane,
    Downed(PlayerGuid),
    DownedBy(PlayerGuid),
}

#[derive(Serialize, Debug, Clone, TS)]
#[ts(export)]
pub struct ReplayKillEvent {
    pub killer: PlayerGuid,
    pub victim: Option<PlayerGuid>,
    pub method: KillMethod,
}

pub(crate) fn output_to_events(world: &World, tick: u32, event: ServerOutput) -> Vec<ReplayEvent> {
    let mut output: Vec<ReplayEvent> = vec![];

    match event {
        //ServerOutput::PlayerJoin(p) => Some(ReplayEventType::PlayerJoin(p)),
        //ServerOutput::PlayerLeave(p) => Some(ReplayEventType::PlayerLeave(p)),
        /*
        ServerOutput::PlayerJoinTeam { id, team } => {
            Some(ReplayEventType::PlayerJoinTeam { id, team })
        }
        */
        ServerOutput::KillEvent(kill_event) => {
            // Mapping this to a different type with guids is easier
            // than refactoring the entire engine to support guids in KillEvent
            // trust me...
            let killer = world
                .players
                .get(kill_event.killer)
                .unwrap()
                .get_guid()
                .clone();
            let victim = kill_event
                .victim
                .and_then(|x| world.players.get(x))
                .and_then(|x| Some(x.get_guid().clone()));

            match kill_event.method {
                KillMethod::Plane => match victim {
                    Some(v) => {
                        output.push(ReplayEvent {
                            tick,
                            player: killer.clone(),
                            event: ReplayEventType::Downed(v.clone()),
                        });
                        output.push(ReplayEvent {
                            tick,
                            player: v,
                            event: ReplayEventType::DownedBy(killer),
                        });
                    }
                    None => output.push(ReplayEvent {
                        tick,
                        player: killer,
                        event: ReplayEventType::AbandonedPlane,
                    }),
                },
                KillMethod::Man => match victim {
                    Some(v) => {
                        output.push(ReplayEvent {
                            tick,
                            player: killer.clone(),
                            event: ReplayEventType::Killed(v.clone()),
                        });
                        output.push(ReplayEvent {
                            tick,
                            player: v,
                            event: ReplayEventType::KilledBy(killer),
                        });
                    }
                    None => output.push(ReplayEvent {
                        tick,
                        player: killer,
                        event: ReplayEventType::Suicide,
                    }),
                },
            };
        }
        //ServerOutput::ChatMessage(chat_message) => Some(ReplayEventType::ChatMessage(chat_message)),
        _ => {} // We don't care about the following when summarizing a game
                //ServerOutput::YourPlayerGuid(_) => None,
                //ServerOutput::EntityChanges(_) => None,
    };

    output
}

pub fn get_replay_summary(bytes: Vec<u8>) -> String {
    match ReplayFile::from_bytes(&bytes) {
        Some((_, replay_file)) => {
            let events = summarize_replay(replay_file);
            serde_json::to_string::<ReplaySummary>(&events).unwrap()
        }
        None => "".to_string(),
    }
}

fn summarize_replay(replay_file: ReplayFile) -> ReplaySummary {
    let mut world = World::new();
    world.load_level(&replay_file.level_data);

    // simulates the entire game and returns all events
    let events = world.simulate_until(&replay_file, None, true);

    ReplaySummary {
        build_version: replay_file.build_version.clone(),
        build_commit: replay_file.build_commit.clone(),
        level_name: replay_file.level_name.clone(),
        total_ticks: replay_file.ticks.iter().map(|x| *x.0).max().unwrap(),
        players: replay_file
            .player_guids
            .iter()
            .by_ref()
            .map(|(guid, hashmap_number)| {
                let name = replay_file
                    .ticks
                    .iter()
                    .flat_map(|x| x.1)
                    .find_map(|x| {
                        if let PlayerCommand::AddPlayer(add_player_data) = &x.command {
                            if x.player_guid_index == *hashmap_number {
                                return Some(add_player_data.name.clone());
                            }
                        }
                        None
                    })
                    .unwrap_or_else(|| "?".to_string());

                (guid.clone(), name)
            })
            .collect(),
        events: events,
    }
}
