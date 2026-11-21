use crate::{
    input::PlayerKeyboard,
    network::{property::*, EntityProperties, NetworkedEntity},
};
use dogfight_macros::{EnumBytes, Networked};
use serde::Deserialize;

use super::{
    container::{ManId, PlaneId, RunwayId},
    plane::PlaneType,
    types::Team,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS, PartialOrd, Ord)]
#[ts(export)]
pub struct PlayerGuid(String);

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

    keys: PlayerKeyboard,

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
}

impl Player {
    pub fn new(guid: PlayerGuid, name: String, clan: Option<String>) -> Self {
        Player {
            shots: 0,
            hits: 0,
            team_kills: 0,
            next_respawn: RespawnType::Default,
            respawn_ticks: None,
            keys: PlayerKeyboard::new(),
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
