use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::entities::types::Team;

/*
    Represents any type of input to affect the game world during a tick
*/
#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum GameInput {
    AddPlayer { name: String },
    RemovePlayer { name: String },
    PlayerChooseTeam { name: String, team: Team },
    PlayerChooseRunway { name: String, runway_id: u16 },
}

pub fn game_input_from_string(input: String) -> Vec<GameInput> {
    serde_json::from_str(&input).unwrap()
}
