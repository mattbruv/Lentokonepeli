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

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let (slice, id) = EntityId::from_bytes(bytes);
        let (dice, entity_type) = EntityType::from_bytes(slice);
        let controlling: ControllingEntity = ControllingEntity { id, entity_type };
        (dice, controlling)
    }
}

#[derive(Networked)]
pub struct Player {
    shots: i32,
    hits: i32,
    team_kills: i32,

    keys: PlayerKeyboard,

    name: Property<String>,
    #[rustfmt::skip]
    clan: Property<Option::<String>>,
    #[rustfmt::skip]
    team: Property<Option::<Team>>,
    state: Property<PlayerState>,
    #[rustfmt::skip]
    controlling: Property<Option::<ControllingEntity>>,
}

impl Player {
    pub fn new(name: String) -> Self {
        Player {
            shots: 0,
            hits: 0,
            team_kills: 0,
            keys: PlayerKeyboard::new(),
            name: Property::new(name),
            clan: Property::new(None),
            team: Property::new(None),
            state: Property::new(PlayerState::ChoosingTeam),
            controlling: Property::new(None),
        }
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

    pub fn set_team(&mut self, team: Option<Team>) {
        self.team.set(team);
        self.state.set(PlayerState::ChoosingRunway);
    }

    pub fn get_team(&self) -> &Option<Team> {
        self.team.get()
    }
}
