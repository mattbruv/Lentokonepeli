use serde::Serialize;
use ts_rs::TS;

use crate::{
    entities::{container::PlayerId, player::PlayerGuid, types::Team},
    game_event::{ChatMessage, KillEvent},
    network::{
        encoding::{read_varint, write_varint, NetworkedBytes},
        entity_changes_to_binary, EntityChange,
    },
};

/*
    Represents anything that the game world needs to send to the
    client after every game tick.
*/
#[derive(Serialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum ServerOutput {
    EntityChanges(Vec<EntityChange>),
    PlayerJoin(String),
    PlayerLeave(String),
    PlayerJoinTeam { id: PlayerId, team: Team },
    KillEvent(KillEvent),
    YourPlayerGuid(String),
    ChatMessage(PlayerGuid, ChatMessage),
    RunwayDestroyed(Team),
    HeadquartersDestroyed(Team),
}

impl NetworkedBytes for ServerOutput {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes: Vec<u8> = vec![];

        match &self {
            ServerOutput::EntityChanges(changes) => {
                bytes.push(0);
                write_varint(changes.len() as u32, &mut bytes);
                bytes.extend(entity_changes_to_binary(changes));
            }
            ServerOutput::PlayerJoin(name) => {
                bytes.push(1);
                bytes.extend(String::to_bytes(name));
            }
            ServerOutput::PlayerLeave(name) => {
                bytes.push(2);
                bytes.extend(String::to_bytes(name));
            }
            ServerOutput::PlayerJoinTeam { id, team } => {
                bytes.push(3);
                bytes.extend(&id.to_bytes());
                bytes.extend(Team::to_bytes(team));
            }
            ServerOutput::KillEvent(event) => {
                bytes.push(4);
                bytes.extend(event.to_bytes());
            }
            ServerOutput::ChatMessage(guid, message) => {
                bytes.push(5);
                bytes.extend(guid.to_bytes());
                bytes.extend(message.to_bytes());
            }
            ServerOutput::RunwayDestroyed(team) => {
                bytes.push(6);
                bytes.extend(Team::to_bytes(team));
            }
            ServerOutput::HeadquartersDestroyed(team) => {
                bytes.push(7);
                bytes.extend(Team::to_bytes(team));
            }
            ServerOutput::YourPlayerGuid(_) => {
                panic!("This should be done client side...")
            }
        }

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let (mut slice, variant) = u8::from_bytes(bytes)?;

        match variant {
            0 => {
                // parse entity changes
                let (bytes, change_length) = read_varint(slice)?;
                slice = &bytes;
                let mut changes = vec![];

                for _ in 0..change_length {
                    let (bytes, update) = EntityChange::from_bytes(slice)?;
                    slice = &bytes;
                    changes.push(update);
                }

                Some((slice, ServerOutput::EntityChanges(changes)))
            }
            1 => {
                let (bytes, name) = String::from_bytes(slice)?;
                slice = &bytes;
                Some((slice, ServerOutput::PlayerJoin(name)))
            }
            2 => {
                let (bytes, name) = String::from_bytes(slice)?;
                slice = &bytes;
                Some((slice, ServerOutput::PlayerLeave(name)))
            }
            3 => {
                let (bytes, id) = PlayerId::from_bytes(slice)?;
                slice = &bytes;
                let (bytes, team) = Team::from_bytes(slice)?;
                slice = &bytes;
                Some((slice, ServerOutput::PlayerJoinTeam { id, team: team }))
            }
            4 => {
                let (bytes, kill_event) = KillEvent::from_bytes(slice)?;
                slice = &bytes;
                Some((slice, ServerOutput::KillEvent(kill_event)))
            }
            5 => {
                let (bytes, guid) = PlayerGuid::from_bytes(slice)?;
                let (bytes, chat_message) = ChatMessage::from_bytes(bytes)?;
                slice = &bytes;
                Some((slice, ServerOutput::ChatMessage(guid, chat_message)))
            }
            6 => {
                let (bytes, team) = Team::from_bytes(slice)?;
                Some((bytes, ServerOutput::RunwayDestroyed(team)))
            }
            7 => {
                let (bytes, team) = Team::from_bytes(slice)?;
                Some((bytes, ServerOutput::HeadquartersDestroyed(team)))
            }
            _ => panic!("Unrecognized enum variant in Event: {}", variant),
        }
    }
}
