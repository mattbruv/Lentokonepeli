use serde::Serialize;
use ts_rs::TS;

use crate::network::{encoding::NetworkedBytes, entity_changes_to_binary, EntityChange};

/*
    Represents anything that the game world needs to send to the
    client after every game tick.
*/
#[derive(Serialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum GameOutput {
    EntityChanges(Vec<EntityChange>),
    PlayerJoin(String),
    PlayerLeave(String),
}

impl NetworkedBytes for GameOutput {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes: Vec<u8> = vec![];

        match &self {
            GameOutput::EntityChanges(changes) => {
                bytes.push(0);
                let len = changes.len();
                assert!(len < 256, "Change count exceeds byte size");
                bytes.push(len as u8);
                bytes.extend(entity_changes_to_binary(changes));
            }
            GameOutput::PlayerJoin(name) => {
                bytes.push(1);
                bytes.extend(String::to_bytes(name));
            }
            GameOutput::PlayerLeave(name) => {
                bytes.push(2);
                bytes.extend(String::to_bytes(name));
            }
        }

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let (mut slice, variant) = u8::from_bytes(bytes);

        match variant {
            0 => {
                // parse entity changes
                let (bytes, change_length) = u8::from_bytes(slice);
                slice = &bytes;
                let mut changes = vec![];

                for _ in 0..change_length {
                    let (bytes, update) = EntityChange::from_bytes(slice);
                    slice = &bytes;
                    changes.push(update);
                }

                (slice, GameOutput::EntityChanges(changes))
            }
            1 => {
                let (bytes, name) = String::from_bytes(slice);
                slice = &bytes;
                (slice, GameOutput::PlayerJoin(name))
            }
            2 => {
                let (bytes, name) = String::from_bytes(slice);
                slice = &bytes;
                (slice, GameOutput::PlayerLeave(name))
            }
            _ => panic!("Unrecognized enum variant in Event: {}", variant),
        }
    }
}
