use crate::{
    input::PlayerKeyboard,
    network::{property::*, EntityProperties, NetworkedEntity},
};
use dogfight_macros::{EnumBytes, Networked};
use serde::Deserialize;

use super::{
    container::{ManId, PlaneId, PlayerId, RunwayId},
    plane::PlaneType,
    types::Team,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS, PartialOrd, Ord)]
#[ts(export)]
pub struct PlayerGuid(String);

impl From<&str> for PlayerGuid {
    fn from(value: &str) -> Self {
        Self(value.to_string())
    }
}

impl NetworkedBytes for PlayerGuid {
    fn to_bytes(&self) -> Vec<u8> {
        self.0.to_bytes()
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (bytes, guid) = String::from_bytes(bytes)?;
        Some((bytes, Self(guid)))
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum PlayerState {
    ChoosingTeam,
    ChoosingRunway,
    WaitingRespawn,
    Playing,
    Refueling,
    Spectating,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum ControllingEntity {
    Man(ManId),
    Plane(PlaneId),
    Runway(RunwayId, PlaneType),
}

impl NetworkedBytes for ControllingEntity {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];
        let (ent_type, data_bytes): (u8, Vec<u8>) = match self {
            ControllingEntity::Man(man_id) => (0, man_id.to_bytes()),
            ControllingEntity::Plane(plane_id) => (1, plane_id.to_bytes()),
            ControllingEntity::Runway(runway_id, plane_type) => {
                let mut runway_info = vec![];
                runway_info.extend(runway_id.to_bytes());
                runway_info.extend(plane_type.to_bytes());
                (2, runway_info)
            }
        };
        bytes.extend(ent_type.to_bytes());
        bytes.extend(data_bytes);
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let (bytes, ent_type) = u8::from_bytes(bytes)?;
        //let (bytes, ent_id) = EntityIdWrappedType::from_bytes(bytes)?;

        let (bytes, controlling) = match ent_type {
            0 => {
                let (bytes, man_id) = ManId::from_bytes(bytes)?;
                (bytes, ControllingEntity::Man(man_id))
            }
            1 => {
                let (bytes, plane_id) = PlaneId::from_bytes(bytes)?;
                (bytes, ControllingEntity::Plane(plane_id))
            }
            2 => {
                let (bytes, runway_id) = RunwayId::from_bytes(bytes)?;
                let (bytes, plane_type) = PlaneType::from_bytes(bytes)?;
                (bytes, ControllingEntity::Runway(runway_id, plane_type))
            }
            _ => panic!("Invalid controlling ent index: {}", ent_type),
        };

        Some((bytes, controlling))
    }
}

pub const CHOOSER_KEY_DELAY_TICKS: u32 = 18;
pub const SPECTATE_DEATH_VIEW_TICKS: u32 = 300;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum RespawnType {
    Default,
    Suicide,
    TeamKill,
}

impl RespawnType {
    fn wait_ticks(&self) -> u32 {
        match self {
            RespawnType::Default => 400,
            RespawnType::Suicide => 800,
            RespawnType::TeamKill => 1000,
        }
    }
}

#[derive(Networked)]
pub struct Player {
    shots: i32,
    hits: i32,
    team_kills: i32,
    next_respawn: RespawnType,
    respawn_ticks: Option<u32>,
    spectate_ticks: u32,

    keys: PlayerKeyboard,
    previous_keys: PlayerKeyboard,
    chooser_timer: u32,
    takeoff_held: bool,

    guid: Property<PlayerGuid>,
    name: Property<String>,
    #[rustfmt::skip]
    clan: Property<Option::<String>>,
    #[rustfmt::skip]
    team: Property<Option::<Team>>,
    state: Property<PlayerState>,
    #[rustfmt::skip]
    controlling: Property<Option::<ControllingEntity>>,
    kills: Property<i16>,
    deaths: Property<u16>,
    score: Property<i16>,
    respawn_seconds: Property<u8>,
    respawn_type: Property<RespawnType>,
    ready: Property<bool>,
    accuracy: Property<u16>,
    ping: Property<u16>,
    #[rustfmt::skip]
    last_runway: Property<Option::<RunwayId>>,
    team_option: Property<u8>,
    #[rustfmt::skip]
    selected_runway: Property<Option::<RunwayId>>,
    selected_plane: Property<u8>,
    bot: Property<bool>,
    #[rustfmt::skip]
    spectating: Property<Option::<PlayerId>>,
}

impl Player {
    pub fn new(guid: PlayerGuid, name: String, clan: Option<String>) -> Self {
        Player {
            shots: 0,
            hits: 0,
            team_kills: 0,
            next_respawn: RespawnType::Default,
            respawn_ticks: None,
            spectate_ticks: 0,
            keys: PlayerKeyboard::new(),
            previous_keys: PlayerKeyboard::new(),
            chooser_timer: CHOOSER_KEY_DELAY_TICKS,
            takeoff_held: false,
            guid: Property::new(guid),
            name: Property::new(name),
            clan: Property::new(clan),
            team: Property::new(None),
            state: Property::new(PlayerState::ChoosingTeam),
            controlling: Property::new(None),
            kills: Property::new(0),
            deaths: Property::new(0),
            score: Property::new(0),
            respawn_seconds: Property::new(0),
            respawn_type: Property::new(RespawnType::Default),
            ready: Property::new(false),
            accuracy: Property::new(0),
            ping: Property::new(0),
            last_runway: Property::new(None),
            team_option: Property::new(1),
            selected_runway: Property::new(None),
            selected_plane: Property::new(0),
            bot: Property::new(false),
            spectating: Property::new(None),
        }
    }

    pub fn get_kills(&self) -> i16 {
        *self.kills.get()
    }

    pub fn adjust_kills(&mut self, amount: i16) -> () {
        self.kills.set(self.kills.get() + amount);
    }

    pub fn get_deaths(&self) -> u16 {
        *self.deaths.get()
    }

    pub fn set_deaths(&mut self, amount: u16) -> () {
        self.deaths.set(amount);
    }

    pub fn adjust_score(&mut self, amount: i16) -> () {
        let new = self.score.get() + amount;
        self.score.set(new);
    }

    pub fn set_state(&mut self, state: PlayerState) {
        self.state.set(state);
    }

    pub fn get_state(&self) -> PlayerState {
        *self.state.get()
    }

    pub fn record_bullet(&mut self, hit: bool) {
        self.shots += 1;
        if hit {
            self.hits += 1;
        }
        self.accuracy.set((1000 * self.hits / self.shots) as u16);
    }

    pub fn set_ping(&mut self, ping: u16) {
        self.ping.set(ping);
    }

    pub fn is_ready(&self) -> bool {
        *self.ready.get()
    }

    pub fn set_ready(&mut self, ready: bool) {
        self.ready.set(ready);
    }

    pub fn get_last_runway(&self) -> Option<RunwayId> {
        *self.last_runway.get()
    }

    pub fn get_previous_keys(&self) -> &PlayerKeyboard {
        &self.previous_keys
    }

    pub fn remember_keys(&mut self) {
        self.previous_keys = self.keys;
    }

    pub fn advance_chooser_timer(&mut self) -> bool {
        self.chooser_timer = self.chooser_timer.saturating_add(1);
        self.chooser_timer > CHOOSER_KEY_DELAY_TICKS
    }

    pub fn hold_takeoff(&mut self, enter_pressed: bool, enter_down: bool) -> bool {
        self.takeoff_held = enter_down && (self.takeoff_held || enter_pressed);
        self.takeoff_held
    }

    pub fn reset_chooser_timer(&mut self) {
        self.chooser_timer = 0;
    }

    pub fn get_team_option(&self) -> u8 {
        *self.team_option.get()
    }

    pub fn set_team_option(&mut self, option: u8) {
        self.team_option.set(option.min(2));
    }

    pub fn get_selected_runway(&self) -> Option<RunwayId> {
        *self.selected_runway.get()
    }

    pub fn set_selected_runway(&mut self, runway_id: Option<RunwayId>) {
        self.selected_runway.set(runway_id);
    }

    pub fn get_selected_plane(&self) -> u8 {
        *self.selected_plane.get()
    }

    pub fn set_selected_plane(&mut self, index: u8) {
        self.selected_plane.set(index % 3);
    }

    pub fn set_last_runway(&mut self, runway_id: RunwayId) {
        self.last_runway.set(Some(runway_id));
    }

    pub fn reset_for_round(&mut self, keep_team: bool) {
        self.last_runway.set(None);
        self.team_option.set(1);
        self.selected_runway.set(None);
        self.selected_plane.set(0);
        self.previous_keys = PlayerKeyboard::new();
        self.chooser_timer = CHOOSER_KEY_DELAY_TICKS;
        self.next_respawn = RespawnType::Default;
        self.respawn_ticks = None;
        self.spectate_ticks = 0;
        self.keys = PlayerKeyboard::new();
        self.controlling.set(None);
        self.spectating.set(None);
        self.respawn_seconds.set(0);
        self.ready.set(false);

        if keep_team && self.team.get().is_some() {
            self.state.set(PlayerState::ChoosingRunway);
            return;
        }

        self.shots = 0;
        self.hits = 0;
        self.team.set(None);
        self.state.set(PlayerState::ChoosingTeam);
        self.kills.set(0);
        self.deaths.set(0);
        self.score.set(0);
        self.accuracy.set(0);
    }

    pub fn begin_spectating(&mut self) {
        self.respawn_ticks = None;
        self.respawn_seconds.set(0);
        self.spectate_ticks = 0;
        self.spectating.set(None);
        self.controlling.set(None);
        self.state.set(PlayerState::Spectating);
    }

    pub fn advance_spectate_timer(&mut self) -> bool {
        self.spectate_ticks = self.spectate_ticks.saturating_add(1);
        self.spectate_ticks > SPECTATE_DEATH_VIEW_TICKS
    }

    pub fn get_spectating(&self) -> Option<PlayerId> {
        *self.spectating.get()
    }

    pub fn set_spectating(&mut self, target: Option<PlayerId>) {
        self.spectating.set(target);
    }

    pub fn mark_suicide(&mut self) {
        if self.next_respawn == RespawnType::Default {
            self.next_respawn = RespawnType::Suicide;
        }
    }

    pub fn mark_team_kill(&mut self) {
        self.next_respawn = RespawnType::TeamKill;
    }

    pub fn begin_respawn(&mut self) {
        self.respawn_ticks = None;
        self.state.set(PlayerState::WaitingRespawn);
    }

    pub fn tick_respawn(&mut self) {
        if *self.state.get() != PlayerState::WaitingRespawn {
            return;
        }

        let ticks = match self.respawn_ticks {
            None => {
                let wait = self.next_respawn.wait_ticks();
                self.respawn_type.set(self.next_respawn);
                self.next_respawn = RespawnType::Default;
                wait
            }
            Some(ticks) => ticks.saturating_sub(1),
        };

        if ticks == 0 {
            self.respawn_ticks = None;
            self.next_respawn = RespawnType::Default;
            self.respawn_seconds.set(0);
            self.state.set(PlayerState::ChoosingRunway);
        } else {
            self.respawn_ticks = Some(ticks);
            self.respawn_seconds.set(ticks.div_ceil(100) as u8);
        }
    }

    pub fn set_controlling(&mut self, controlling: Option<ControllingEntity>) {
        self.controlling.set(controlling);
    }

    pub fn get_controlling(&self) -> Option<ControllingEntity> {
        *self.controlling.get()
    }

    pub fn set_keys(&mut self, keys: PlayerKeyboard) {
        self.keys = keys
    }

    pub fn get_keys(&self) -> &PlayerKeyboard {
        &self.keys
    }

    pub fn is_bot(&self) -> bool {
        *self.bot.get()
    }

    pub fn set_bot(&mut self, bot: bool) {
        self.bot.set(bot);
    }

    pub fn get_full_name(&self) -> String {
        let name = self.get_name();
        let clan = self.clan.get();

        match clan {
            Some(tag) => format!("[{tag}] {name}").trim().to_owned(),
            None => name.trim().to_owned(),
        }
    }

    pub fn get_name(&self) -> String {
        self.name.get().clone()
    }

    pub fn get_clan(&self) -> Option<String> {
        self.clan.get().clone()
    }

    pub fn get_guid(&self) -> &PlayerGuid {
        self.guid.get()
    }

    pub fn set_team(&mut self, team: Option<Team>) {
        self.team.set(team);
        self.state.set(PlayerState::ChoosingRunway);
    }

    pub fn get_team(&self) -> &Option<Team> {
        self.team.get()
    }

    pub(crate) fn set_clan(&mut self, clan: String) -> () {
        self.clan.set(Some(clan));
    }
}
