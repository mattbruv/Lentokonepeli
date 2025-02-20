use rand::random;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    entities::{
        plane::{Plane, PlaneType},
        player::{ControllingEntity, Player, PlayerState},
        types::{EntityType, Team},
        EntityId,
    },
    network::encoding::NetworkedBytes,
    output::ServerOutput,
    world::World,
};

/*
    Represents any type of input to affect the game world during a tick
*/
#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ServerInput {
    player_name: String,
    command: PlayerCommand,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum PlayerCommand {
    AddPlayer,
    RemovePlayer,
    PlayerChooseTeam(TeamSelection),
    PlayerChooseRunway(RunwaySelection),
    PlayerKeyboard(PlayerKeyboard),
}

pub fn game_input_from_string(input: String) -> Vec<ServerInput> {
    serde_json::from_str(&input).unwrap()
}

pub fn is_valid_command(command: &str) -> bool {
    serde_json::from_str::<PlayerCommand>(&command).is_ok()
}

#[derive(Serialize, Deserialize, Debug, TS, Clone, Copy)]
#[ts(export)]
pub struct PlayerKeyboard {
    pub left: bool,
    pub right: bool,
    pub down: bool,
    pub up: bool,
    pub shift: bool,
    pub space: bool,
    pub enter: bool,
    pub ctrl: bool,
}

impl PlayerKeyboard {
    pub fn new() -> Self {
        Self {
            left: false,
            right: false,
            down: false,
            up: false,
            shift: false,
            space: false,
            enter: false,
            ctrl: false,
        }
    }
}

impl NetworkedBytes for PlayerKeyboard {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];

        let mut byte: u8 = 0;

        if self.left {
            byte |= 1 << 0;
        }
        if self.right {
            byte |= 1 << 1;
        }
        if self.down {
            byte |= 1 << 2;
        }
        if self.up {
            byte |= 1 << 3;
        }
        if self.shift {
            byte |= 1 << 4;
        }
        if self.space {
            byte |= 1 << 5;
        }
        if self.enter {
            byte |= 1 << 6;
        }
        if self.ctrl {
            byte |= 1 << 7;
        }

        bytes.push(byte);

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let (slice, byte) = u8::from_bytes(bytes);

        let keyboard: PlayerKeyboard = PlayerKeyboard {
            left: byte & (1 << 0) != 0,
            right: byte & (1 << 1) != 0,
            down: byte & (1 << 2) != 0,
            up: byte & (1 << 3) != 0,
            shift: byte & (1 << 4) != 0,
            space: byte & (1 << 5) != 0,
            enter: byte & (1 << 6) != 0,
            ctrl: byte & (1 << 7) != 0,
        };

        (slice, keyboard)
    }
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct RunwaySelection {
    pub runway_id: EntityId,
    pub plane_type: PlaneType,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct TeamSelection {
    pub team: Option<Team>, // None team selection means random
}

impl World {
    pub(crate) fn handle_input(&mut self, input_events: Vec<ServerInput>) -> Vec<ServerOutput> {
        let mut game_output = vec![];

        for input in input_events {
            let name = input.player_name;
            match input.command {
                PlayerCommand::AddPlayer => {
                    // Add the player if not already exists
                    if let None = self.get_player_id_from_name(&name) {
                        if let Some((_, p)) = self.players.insert(Player::new(name)) {
                            game_output.push(ServerOutput::PlayerJoin(p.get_name()));
                        }
                    }
                }
                PlayerCommand::RemovePlayer => {
                    let player_id = self.get_player_id_from_name(&name);

                    if let Some(id) = player_id {
                        self.players.remove(id);
                        game_output.push(ServerOutput::PlayerLeave(name));
                    }
                }
                PlayerCommand::PlayerChooseTeam(selection) => {
                    let pid = self.get_player_id_from_name(&name);

                    if let Some(id) = pid {
                        if let Some(player) = self.players.get_mut(id) {
                            let the_team = selection.team.unwrap_or_else(|| {
                                if random() {
                                    Team::Centrals
                                } else {
                                    Team::Allies
                                }
                            });

                            // only join the team if the player already isn't on the team
                            if let None = player.get_team() {
                                player.set_team(Some(the_team));
                                game_output.push(ServerOutput::PlayerJoinTeam {
                                    name: player.get_name(),
                                    team: the_team,
                                })
                            }
                        }
                    }
                }
                PlayerCommand::PlayerChooseRunway(selection) => {
                    if let Some(runway) = self.runways.get(selection.runway_id) {
                        let plane = Plane::new(selection.plane_type, selection.runway_id, runway);

                        if let Some((plane_id, _)) = self.planes.insert(plane) {
                            if let Some((_, player)) = self.get_player_from_name(&name) {
                                player.set_keys(PlayerKeyboard::new());
                                player.set_state(PlayerState::Playing);
                                player.set_controlling(Some(ControllingEntity::new(
                                    plane_id,
                                    EntityType::Plane,
                                )))
                            }
                        }
                    }
                }
                PlayerCommand::PlayerKeyboard(keys) => {
                    if let Some((_, p)) = self.get_player_from_name(&name) {
                        p.set_keys(keys);
                    }
                }
            };
        }

        game_output
    }
}
