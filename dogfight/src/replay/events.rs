use crate::{
    entities::{container::PlayerId, types::Team},
    game_event::{ChatMessage, KillEvent},
    output::ServerOutput,
};

// A subset of ServerOutput with only things we care about for replays
pub enum ReplayEvent {
    PlayerJoin(String),
    PlayerLeave(String),
    PlayerJoinTeam { id: PlayerId, team: Team },
    KillEvent(KillEvent),
    ChatMessage(ChatMessage),
}

pub(crate) fn output_to_event(output: ServerOutput) -> Option<ReplayEvent> {
    match output {
        ServerOutput::PlayerJoin(p) => Some(ReplayEvent::PlayerJoin(p)),
        ServerOutput::PlayerLeave(p) => Some(ReplayEvent::PlayerLeave(p)),
        ServerOutput::PlayerJoinTeam { id, team } => Some(ReplayEvent::PlayerJoinTeam { id, team }),
        ServerOutput::KillEvent(kill_event) => Some(ReplayEvent::KillEvent(kill_event)),
        ServerOutput::ChatMessage(chat_message) => Some(ReplayEvent::ChatMessage(chat_message)),
        ServerOutput::YourPlayerGuid(_) => None,
        ServerOutput::EntityChanges(_) => None,
    }
}
