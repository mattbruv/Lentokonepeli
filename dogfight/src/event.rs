use serde::Serialize;
use ts_rs::TS;

use crate::network::EntityChange;

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
