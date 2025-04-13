use serde::Serialize;
use ts_rs::TS;
use web_sys::js_sys::Math::max;

use crate::{
    debug::log,
    entities::{container::PlayerId, types::Team},
    game_event::{ChatMessage, KillEvent},
    network::encoding::NetworkedBytes,
    output::ServerOutput,
    world::World,
};

use super::file::ReplayFile;

#[derive(Debug, Serialize, TS)]
#[ts(export)]
struct ReplayEvent {
    pub tick: u32,
    pub event: ReplayEventType,
}

// A subset of ServerOutput with only things we care about for replays
#[derive(Debug, Serialize, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum ReplayEventType {
    PlayerJoin(String),
    PlayerLeave(String),
    PlayerJoinTeam { id: PlayerId, team: Team },
    KillEvent(KillEvent),
    ChatMessage(ChatMessage),
}

pub(crate) fn output_to_event(output: ServerOutput) -> Option<ReplayEventType> {
    match output {
        ServerOutput::PlayerJoin(p) => Some(ReplayEventType::PlayerJoin(p)),
        ServerOutput::PlayerLeave(p) => Some(ReplayEventType::PlayerLeave(p)),
        ServerOutput::PlayerJoinTeam { id, team } => {
            Some(ReplayEventType::PlayerJoinTeam { id, team })
        }
        ServerOutput::KillEvent(kill_event) => Some(ReplayEventType::KillEvent(kill_event)),
        ServerOutput::ChatMessage(chat_message) => Some(ReplayEventType::ChatMessage(chat_message)),

        // We don't care about the following when summarizing a game
        ServerOutput::YourPlayerGuid(_) => None,
        ServerOutput::EntityChanges(_) => None,
    }
}

pub fn get_replay_file_events(bytes: Vec<u8>) -> String {
    match ReplayFile::from_bytes(&bytes) {
        Some((_, replay_file)) => {
            let events = parse_events(replay_file);
            serde_json::to_string(&events).unwrap()
        }
        None => "".to_string(),
    }
}

fn parse_events(replay_file: ReplayFile) -> Vec<ReplayEvent> {
    let mut world = World::new();
    world.load_level(&replay_file.level_data);

    let mut events = vec![];

    // Simulate the full game and collect events
    let max_tick = replay_file
        .ticks
        .iter()
        .map(|x| x.tick_number)
        .max()
        .unwrap();

    log(format!("max tick: {}", max_tick));

    events
}
