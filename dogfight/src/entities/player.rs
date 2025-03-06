use crate::{
    input::PlayerKeyboard,
    network::{property::*, EntityProperties, NetworkedEntity},
};
use dogfight_macros::{EnumBytes, Networked};

use super::{
    types::{EntityType, Team},
    EntityId,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum PlayerState {
    ChoosingTeam,
    ChoosingRunway,
    WaitingRespawn,
    Playing,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[ts(export)]
pub struct ControllingEntity {
    pub id: EntityId,
    pub entity_type: EntityType,
}

impl ControllingEntity {
    pub fn new(id: EntityId, entity_type: EntityType) -> Self {
        Self { id, entity_type }
    }
}

impl NetworkedBytes for ControllingEntity {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];
        bytes.extend(self.id.to_bytes());
        bytes.extend(self.entity_type.to_bytes());
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let (slice, id) = EntityId::from_bytes(bytes)?;
        let (dice, entity_type) = EntityType::from_bytes(slice)?;
        let controlling: ControllingEntity = ControllingEntity { id, entity_type };
        Some((dice, controlling))
    }
}

#[derive(Networked)]
pub struct Player {
    shots: i32,
    hits: i32,
    team_kills: i32,

    keys: PlayerKeyboard,

    guid: Property<String>,
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
}

impl Player {
    pub fn new(guid: String, name: String, clan: Option<String>) -> Self {
        Player {
            shots: 0,
            hits: 0,
            team_kills: 0,
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

    pub fn get_name(&self) -> String {
        self.name.get().clone()
    }

    pub fn get_guid(&self) -> &String {
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
