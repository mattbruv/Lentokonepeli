use image::load_from_memory_with_format;
use serde::Serialize;
use ts_rs::TS;

use crate::network::{encoding::NetworkedBytes, entity_changes_to_binary, EntityChange};

/*
    Represents anything that the game world needs to send to the
    client after every game tick.
*/
#[derive(Serialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type", content = "event")]
pub enum GameEvent {
    EntityChanges(Vec<EntityChange>),
}

impl NetworkedBytes for GameEvent {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];

        match &self {
            GameEvent::EntityChanges(changes) => {
                bytes.push(0);
                bytes.extend(entity_changes_to_binary(changes));
            }
        }

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let (mut bytes, variant) = u8::from_bytes(bytes);

        match variant {
            0 => 3,
            _ => panic!("Unrecognized enum variant in Event: {}", variant),
        };
    }
}
