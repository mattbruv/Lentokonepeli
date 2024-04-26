use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::entities::{plane::PlaneType, types::Team, EntityId};

/*
    Represents any type of input to affect the game world during a tick
*/
#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum GameInput {
    AddPlayer { name: String },
    RemovePlayer { name: String },
    PlayerChooseTeam(TeamSelection),
    PlayerChooseRunway(RunwaySelection),
}

pub fn game_input_from_string(input: String) -> Vec<GameInput> {
    serde_json::from_str(&input).unwrap()
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct RunwaySelection {
    pub player_name: String,
    pub runway_id: EntityId,
    pub plane_type: PlaneType,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct TeamSelection {
    pub player_name: String,
    pub team: Option<Team>, // None team selection means random
}
