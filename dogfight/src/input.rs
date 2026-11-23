use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    entities::{
        container::{PlayerId, RunwayId},
        plane::{Plane, PlaneType},
        player::{ControllingEntity, Player, PlayerGuid, PlayerState},
        runway::RunwayReservation,
        types::Team,
        world_info::{GameMode, WorldState},
    },
    game_event::ChatMessage,
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
    pub player_guid: PlayerGuid,
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
    SendMessage(String, bool),
    SetPing(u16),
    AddBot(AddPlayerData),
    EndRound,
}

pub fn game_input_from_string(input: String) -> Vec<ServerInput> {
    serde_json::from_str(&input).unwrap()
}

pub fn is_valid_command(command: &str) -> bool {
    serde_json::from_str::<PlayerCommand>(&command).is_ok()
}

#[derive(Serialize, Deserialize, Debug, TS, Clone, Copy, PartialEq, Eq)]
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
    pub runway_id: RunwayId,
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
    pub guid: PlayerGuid,
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
        let (bytes, guid) = PlayerGuid::from_bytes(bytes)?;
        let (bytes, name) = String::from_bytes(bytes)?;
        let (bytes, clan) = Option::<String>::from_bytes(bytes)?;

        Some((bytes, Self { guid, clan, name }))
    }
}

const ROUNDS_LATE_JOIN_PLAYERS: usize = 3;
pub const MAX_NAME_CHARS: usize = 20;
pub const MAX_CLAN_CHARS: usize = 5;
pub const MAX_MESSAGE_CHARS: usize = 200;
const DEFAULT_PLAYER_NAME: &str = "Player";

pub fn sanitize_text(text: &str, max_chars: usize) -> String {
    let cleaned: String = text.chars().filter(|c| !c.is_control()).collect();
    cleaned
        .trim()
        .chars()
        .take(max_chars)
        .collect::<String>()
        .trim_end()
        .to_string()
}

impl World {
    pub(crate) fn handle_input(&mut self, input_events: Vec<ServerInput>) -> Vec<ServerOutput> {
        let mut game_output = vec![];

        for input in input_events {
            let guid = input.player_guid;
            match input.command {
                PlayerCommand::AddPlayer(data) => {
                    game_output.extend(self.add_player(guid, data, false));
                }
                PlayerCommand::AddBot(data) => {
                    game_output.extend(self.add_player(guid, data, true));
                }
                PlayerCommand::RemovePlayer => {
                    if let Some((id, _)) = self.get_player_from_guid(&guid) {
                        if let Some(player) = self.players.remove(*id) {
                            game_output.push(ServerOutput::PlayerLeave(player.get_name()));
                        }
                    }
                }
                PlayerCommand::PlayerChooseTeam(selection) => {
                    if let Some((player_id, team)) = self.choose_team(&guid, selection.team) {
                        game_output.push(ServerOutput::PlayerJoinTeam {
                            id: player_id,
                            team,
                        })
                    }
                }
                PlayerCommand::PlayerChooseRunway(selection) => {
                    self.process_takeoff(&guid, selection);
                }
                PlayerCommand::PlayerKeyboard(keys) => {
                    if let Some((_, p)) = self.get_player_from_guid_mut(&guid) {
                        p.set_keys(keys);
                    }
                }
                PlayerCommand::EndRound => {
                    self.force_end_round();
                }
                PlayerCommand::SetPing(ping) => {
                    if let Some((_, player)) = self.get_player_from_guid_mut(&guid) {
                        player.set_ping(ping);
                    }
                }
                PlayerCommand::SendMessage(message, is_global) => {
                    let message = sanitize_text(&message, MAX_MESSAGE_CHARS);
                    if message.is_empty() {
                        continue;
                    }
                    if let Some((_, player)) = self.get_player_from_guid(&guid) {
                        game_output.push(ServerOutput::ChatMessage(
                            player.get_guid().clone(),
                            ChatMessage {
                                message,
                                private: !is_global,
                                sender_name: Some(player.get_full_name()),
                                team: *player.get_team(),
                            },
                        ));
                    }
                }
            };
        }

        game_output
    }

    fn add_player(
        &mut self,
        guid: PlayerGuid,
        data: AddPlayerData,
        is_bot: bool,
    ) -> Vec<ServerOutput> {
        let mut output = vec![];
        if self.get_player_from_guid(&guid).is_some() {
            return output;
        }
        let in_intermission = self.world_info.get_state() == WorldState::Intermission;
        let wait_for_next_round = self.game_mode == GameMode::Rounds
            && !in_intermission
            && self.players.get_map().len() + 1 >= ROUNDS_LATE_JOIN_PLAYERS
            && self.team_has_players(Team::Centrals)
            && self.team_has_players(Team::Allies);
        let name = match sanitize_text(&data.name, MAX_NAME_CHARS) {
            name if name.is_empty() => DEFAULT_PLAYER_NAME.to_string(),
            name => name,
        };
        let clan = data
            .clan
            .map(|clan| sanitize_text(&clan, MAX_CLAN_CHARS))
            .filter(|clan| !clan.is_empty());
        let mut player = Player::new(guid, name, clan);
        player.set_bot(is_bot);
        if let Some((id, p)) = self.players.insert(player) {
            output.push(ServerOutput::PlayerJoin(p.get_name()));
            if let Some(player) = self.players.get_mut(id) {
                if in_intermission {
                    player.set_ready(true);
                }
                if wait_for_next_round {
                    player.begin_spectating();
                }
            }
        }
        output
    }

    pub(crate) fn choose_team(
        &mut self,
        guid: &PlayerGuid,
        choice: Option<Team>,
    ) -> Option<(PlayerId, Team)> {
        if self.world_info.get_state() == WorldState::Intermission {
            return None;
        }

        let mut centrals = 0;
        let mut allies = 0;
        for (_, player) in self.players.get_map() {
            match player.get_team() {
                Some(Team::Centrals) => centrals += 1,
                Some(Team::Allies) => allies += 1,
                None => {}
            }
        }

        let is_bot = self
            .get_player_from_guid(guid)
            .map(|(_, p)| p.is_bot())
            .unwrap_or(false);
        let unbalanced_ok = is_bot || !self.team_balance;

        let team = match choice {
            None => {
                if centrals < allies {
                    Team::Centrals
                } else if allies < centrals {
                    Team::Allies
                } else if self.get_tick() % 2 == 0 {
                    Team::Centrals
                } else {
                    Team::Allies
                }
            }
            Some(Team::Centrals) if unbalanced_ok || centrals <= allies => Team::Centrals,
            Some(Team::Allies) if unbalanced_ok || allies <= centrals => Team::Allies,
            Some(_) => return None,
        };

        let (player_id, player) = self.get_player_from_guid_mut(guid)?;
        if player.get_team().is_some() || player.get_state() == PlayerState::Spectating {
            return None;
        }
        player.set_team(Some(team));
        Some((*player_id, team))
    }

    fn can_take_off(&self, guid: &PlayerGuid, selection: &RunwaySelection) -> bool {
        if self.world_info.get_state() == WorldState::Intermission {
            return false;
        }

        let Some((_, player)) = self.get_player_from_guid(guid) else {
            return false;
        };
        let Some(team) = *player.get_team() else {
            return false;
        };

        let state_allows = match player.get_controlling() {
            Some(ControllingEntity::Runway(runway_id, plane_type)) => {
                runway_id == selection.runway_id && plane_type == selection.plane_type
            }
            Some(_) => false,
            None => player.get_state() == PlayerState::ChoosingRunway,
        };

        let runway_ok = self
            .runways
            .get(selection.runway_id)
            .map(|r| *r.get_team() == team)
            .unwrap_or(false);

        state_allows && runway_ok && selection.plane_type.team() == team
    }

    pub(crate) fn process_takeoff(&mut self, guid: &PlayerGuid, selection: RunwaySelection) {
        if !self.can_take_off(guid, &selection) {
            return;
        }

        let maybe_team = self
            .get_player_from_guid(guid)
            .and_then(|p| p.1.get_team().clone());
        let maybe_pid = self.get_player_from_guid(guid).and_then(|p| Some(*p.0));

        if let Some(team) = maybe_team {
            if let Some(pid) = maybe_pid {
                if let Some(runway) = self.runways.get_mut(selection.runway_id) {
                    if runway.reserve_for(RunwayReservation::Takeoff) {
                        let plane = Plane::new(
                            pid,
                            team,
                            selection.plane_type,
                            selection.runway_id,
                            runway,
                        );

                        if let Some((plane_id, _)) = self.planes.insert(plane) {
                            if let Some((_, player)) = self.get_player_from_guid_mut(guid) {
                                player.set_keys(PlayerKeyboard::new());
                                player.set_last_runway(selection.runway_id);
                                player.set_state(PlayerState::Playing);
                                player.set_controlling(Some(ControllingEntity::Plane(plane_id)))
                            }
                        }
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        network::{encoding::NetworkedBytes, player_command_json_from_binary},
        world::World,
    };

    #[test]
    fn malformed_command_bytes_never_panic() {
        let mut seed: u32 = 12345;
        let mut next = || {
            seed = seed.wrapping_mul(1_103_515_245).wrapping_add(12_345);
            (seed >> 16) as u8
        };

        assert_eq!(player_command_json_from_binary(&vec![]), "");
        for tag in 0..=255u8 {
            for len in 0..12 {
                let mut bytes = vec![tag];
                bytes.extend((0..len).map(|_| next()));
                let _ = player_command_json_from_binary(&bytes);
            }
        }
        assert!(PlayerCommand::from_bytes(&[200]).is_none());
        assert!(PlayerCommand::from_bytes(&[2, 1]).is_none());
        assert!(PlayerCommand::from_bytes(&[2, 1, 99]).is_none());
        assert!(PlayerCommand::from_bytes(&[3, 0, 0, 99]).is_none());
        assert!(PlayerCommand::from_bytes(&[5, 0, 0, 0, 0]).is_none());
    }

    #[test]
    fn sanitize_text_strips_control_chars_and_limits_length() {
        assert_eq!(sanitize_text("  a\u{0}b\nc\u{7f}  ", 20), "abc");
        assert_eq!(sanitize_text(&"x".repeat(50), 20).chars().count(), 20);
        assert_eq!(sanitize_text("ääääää", 3), "äää");
        assert_eq!(sanitize_text("ab        cd", 4), "ab");
    }

    #[test]
    fn hostile_player_data_is_sanitized() {
        let mut world = World::new();
        let long_name = "n".repeat(500);
        world.handle_input(vec![
            ServerInput {
                player_guid: PlayerGuid::from("a"),
                command: PlayerCommand::AddPlayer(AddPlayerData {
                    guid: PlayerGuid::from("ignored"),
                    name: long_name,
                    clan: Some("c".repeat(100)),
                }),
            },
            ServerInput {
                player_guid: PlayerGuid::from("b"),
                command: PlayerCommand::AddPlayer(AddPlayerData {
                    guid: PlayerGuid::from("b"),
                    name: "\n\t ".to_string(),
                    clan: Some("\u{0}".to_string()),
                }),
            },
        ]);

        let (_, a) = world.get_player_from_guid(&PlayerGuid::from("a")).unwrap();
        assert_eq!(a.get_name().chars().count(), MAX_NAME_CHARS);
        assert_eq!(
            a.get_clan().as_ref().unwrap().chars().count(),
            MAX_CLAN_CHARS
        );

        let (_, b) = world.get_player_from_guid(&PlayerGuid::from("b")).unwrap();
        assert_eq!(b.get_name(), DEFAULT_PLAYER_NAME);
        assert!(b.get_clan().is_none());

        let output = world.handle_input(vec![
            ServerInput {
                player_guid: PlayerGuid::from("a"),
                command: PlayerCommand::SendMessage("m".repeat(10_000), true),
            },
            ServerInput {
                player_guid: PlayerGuid::from("a"),
                command: PlayerCommand::SendMessage(" \n ".to_string(), true),
            },
        ]);
        let messages: Vec<_> = output
            .iter()
            .filter_map(|o| match o {
                ServerOutput::ChatMessage(_, m) => Some(m.message.clone()),
                _ => None,
            })
            .collect();
        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].chars().count(), MAX_MESSAGE_CHARS);
    }
}
