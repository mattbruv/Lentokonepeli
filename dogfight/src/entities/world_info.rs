use dogfight_macros::{EnumBytes, Networked};

use crate::{
    network::{property::*, EntityChange, EntityChangeType, EntityProperties, NetworkedEntity},
    world::RESOLUTION,
};

use super::types::{EntityType, Team};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum WorldState {
    Falling,
    Parachuting,
    Standing,
    WalkingLeft,
    WalkingRight,
}

#[derive(Networked)]
pub struct WorldInfo {
    state: Property<WorldState>,
}

impl WorldInfo {
    pub fn new() -> Self {
        Self {
            state: Property::new(WorldState::Falling),
        }
    }

    pub fn get_all_full_state(&self) -> EntityChange {
        EntityChange {
            ent_type: EntityType::WorldInfo,
            id: 0,
            update: EntityChangeType::Properties(self.get_full_properties()),
        }
    }

    pub fn get_all_changed_state(&mut self) -> EntityChange {
        EntityChange {
            ent_type: EntityType::WorldInfo,
            id: 0,
            update: EntityChangeType::Properties(self.get_changed_properties_and_reset()),
        }
    }
}
