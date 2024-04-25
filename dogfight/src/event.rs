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
        let mut bytes: Vec<u8> = vec![];

        match &self {
            GameEvent::EntityChanges(changes) => {
                bytes.push(0);
                let len = changes.len();
                assert!(len < 256, "Change count exceeds byte size");
                bytes.push(len as u8);
                bytes.extend(entity_changes_to_binary(changes));
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
                    println!("foo {:?}", update);
                    changes.push(update);
                }

                (slice, GameEvent::EntityChanges(changes))
            }
            _ => panic!("Unrecognized enum variant in Event: {}", variant),
        }
    }
}
