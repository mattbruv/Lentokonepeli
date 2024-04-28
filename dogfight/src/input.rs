use serde::{de::value::BoolDeserializer, Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    entities::{plane::PlaneType, player::Player, types::Team, EntityId},
    network::encoding::NetworkedBytes,
    output::{self, GameOutput},
    world::World,
};

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
    PlayerKeyboard(PlayerKeyboard),
}

pub fn game_input_from_string(input: String) -> Vec<GameInput> {
    serde_json::from_str(&input).unwrap()
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct PlayerKeyboard {
    left: bool,
    right: bool,
    down: bool,
    up: bool,
    shift: bool,
    space: bool,
    enter: bool,
}

impl NetworkedBytes for PlayerKeyboard {
    fn to_bytes(&self) -> Vec<u8> {
        todo!()
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        todo!()
    }
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

impl World {
    pub(crate) fn handle_input(&mut self, input_events: Vec<GameInput>) -> Vec<GameOutput> {
        let mut game_output = vec![];

        for input_event in input_events {
            match input_event {
                GameInput::AddPlayer { name } => {
                    // Add the player if not already exists
                    if let None = self.get_player_id_from_name(&name) {
                        if let Some(p) = self.players.insert(Player::new(name)) {
                            game_output.push(GameOutput::PlayerJoin(p.get_name()));
                        }
                    }
                }
                GameInput::RemovePlayer { name } => {
                    let player_id = self.get_player_id_from_name(&name);

                    if let Some(id) = player_id {
                        self.players.remove(id);
                        game_output.push(GameOutput::PlayerLeave(name));
                    }
                }
                GameInput::PlayerChooseTeam(selection) => {
                    let pid = self.get_player_id_from_name(&selection.player_name);

                    if let Some(id) = pid {
                        if let Some(player) = self.players.get_mut(id) {
                            if let Some(team) = selection.team {
                                // only join the team if the player already isn't on the team
                                if let None = player.get_team() {
                                    player.set_team(selection.team);
                                    game_output.push(GameOutput::PlayerJoinTeam {
                                        name: player.get_name(),
                                        team: team,
                                    })
                                }
                            }
                        }
                    }
                }
                GameInput::PlayerChooseRunway(_) => {
                    //
                }
            };
        }

        game_output
    }
}
