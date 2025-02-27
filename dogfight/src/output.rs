use std::array::TryFromSliceError;

use serde::Serialize;
use ts_rs::TS;

use crate::{
    entities::types::Team,
    network::{encoding::NetworkedBytes, entity_changes_to_binary, EntityChange},
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
    PlayerJoinTeam { name: String, team: Team },
}

impl NetworkedBytes for ServerOutput {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes: Vec<u8> = vec![];

        match &self {
            ServerOutput::EntityChanges(changes) => {
                bytes.push(0);
                let len = changes.len();
                assert!(len < 256, "Change count exceeds byte size");
                bytes.push(len as u8);
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
            ServerOutput::PlayerJoinTeam { name, team } => {
                bytes.push(3);
                bytes.extend(String::to_bytes(&name));
                bytes.extend(Team::to_bytes(team));
            }
        }

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let (mut slice, variant) = u8::from_bytes(bytes)?;

        match variant {
            0 => {
                // parse entity changes
                let (bytes, change_length) = u8::from_bytes(slice)?;
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
                let (bytes, name) = String::from_bytes(slice)?;
                slice = &bytes;
                let (bytes, team) = Team::from_bytes(slice)?;
                slice = &bytes;
                Some((
                    slice,
                    ServerOutput::PlayerJoinTeam {
                        name: name,
                        team: team,
                    },
                ))
            }
            _ => panic!("Unrecognized enum variant in Event: {}", variant),
        }
    }
}
