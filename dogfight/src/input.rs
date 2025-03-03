use std::array::TryFromSliceError;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    entities::{
        plane::{Plane, PlaneType},
        player::{ControllingEntity, Player, PlayerState},
        types::{EntityType, Team},
        EntityId,
    },
    network::{encoding::NetworkedBytes, player_command_json_from_binary},
    output::ServerOutput,
    world::World,
};

/*
    Represents any type of input to affect the game world during a tick
*/
#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ServerInput {
    pub player_guid: String,
    pub command: PlayerCommand,
}

#[derive(Serialize, Deserialize, Debug, TS, Clone)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum PlayerCommand {
    AddPlayer(AddPlayerData),
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

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let (slice, byte) = u8::from_bytes(bytes)?;

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

        Some((slice, keyboard))
    }
}

#[derive(Serialize, Deserialize, Debug, TS, Clone)]
#[ts(export)]
pub struct RunwaySelection {
    pub runway_id: EntityId,
    pub plane_type: PlaneType,
}

#[derive(Serialize, Deserialize, Debug, TS, Clone)]
#[ts(export)]
pub struct TeamSelection {
    pub team: Option<Team>, // None team selection means random
}

#[derive(Serialize, Deserialize, Debug, TS, Clone)]
#[ts(export)]
pub struct AddPlayerData {
    pub guid: String,
    pub name: String,
    pub clan: Option<String>,
}

impl NetworkedBytes for AddPlayerData {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];
        bytes.extend(self.guid.to_bytes());
        bytes.extend(self.name.to_bytes());
        bytes.extend(self.clan.to_bytes());
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (bytes, guid) = String::from_bytes(bytes)?;
        let (bytes, name) = String::from_bytes(bytes)?;
        let (bytes, clan) = Option::<String>::from_bytes(bytes)?;

        Some((bytes, Self { guid, clan, name }))
    }
}

impl World {
    pub(crate) fn handle_input(&mut self, input_events: Vec<ServerInput>) -> Vec<ServerOutput> {
        let mut game_output = vec![];

        for input in input_events {
            let guid = input.player_guid;
            match input.command {
                PlayerCommand::AddPlayer(data) => {
                    // Add the player if not already exists
                    if let None = self.get_player_from_guid(&guid) {
                        if let Some((_, p)) =
                            self.players.insert(Player::new(guid, data.name, data.clan))
                        {
                            game_output.push(ServerOutput::PlayerJoin(p.get_name()));
                        }
                    }
                }
                PlayerCommand::RemovePlayer => {
                    if let Some((id, _)) = self.get_player_from_guid(&guid) {
                        if let Some(player) = self.players.remove(*id) {
                            game_output.push(ServerOutput::PlayerLeave(player.get_name()));
                        }
                    }
                }
                PlayerCommand::PlayerChooseTeam(selection) => {
                    let tick = self.get_tick();

                    if let Some((player_id, player)) = self.get_player_from_guid_mut(&guid) {
                        let the_team = selection.team.unwrap_or_else(|| {
                            // "Randomly" pick a team
                            if tick % 2 == 0 {
                                Team::Centrals
                            } else {
                                Team::Allies
                            }
                        });

                        // only join the team if the player already isn't on the team
                        if let None = player.get_team() {
                            player.set_team(Some(the_team));
                            game_output.push(ServerOutput::PlayerJoinTeam {
                                id: *player_id,
                                team: the_team,
                            })
                        }
                    }
                }
                PlayerCommand::PlayerChooseRunway(selection) => {
                    if let Some((pid, player)) = self.get_player_from_guid(&guid) {
                        if let Some(team) = player.get_team() {
                            if let Some(runway) = self.runways.get(selection.runway_id) {
                                let plane = Plane::new(
                                    *pid,
                                    *team,
                                    selection.plane_type,
                                    selection.runway_id,
                                    runway,
                                );

                                if let Some((plane_id, _)) = self.planes.insert(plane) {
                                    if let Some((_, player)) = self.get_player_from_guid_mut(&guid)
                                    {
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
                    }
                }
                PlayerCommand::PlayerKeyboard(keys) => {
                    if let Some((_, p)) = self.get_player_from_guid_mut(&guid) {
                        p.set_keys(keys);
                    }
                }
            };
        }

        game_output
    }
}
