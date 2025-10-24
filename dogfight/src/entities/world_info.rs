use dogfight_macros::{EnumBytes, Networked};

use crate::network::{
    property::*, EntityChange, EntityChangeType, EntityProperties, NetworkedEntity,
};

use super::types::{EntityType, Team};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum WorldState {
    Intermission,
    Playing,
    PostGame,
}

#[derive(Networked)]
pub struct WorldInfo {
    #[rustfmt::skip]
    state: Property<Option::<WorldState>>,
    #[rustfmt::skip]
    winner: Property<Option::<Team>>,
    time_total_ms: Property<u32>,
    client_time_ms: Property<u32>,
    current_tick: u32,
}

impl WorldInfo {
    pub fn new() -> Self {
        Self {
            state: Property::new(Some(WorldState::Intermission)),
            winner: Property::new(None),

            // minutes * seconds per minute * milliseconds per second
            time_total_ms: Property::new(10 * 60 * 1000),
            client_time_ms: Property::new(0),
            current_tick: 0,
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

    pub(crate) fn tick(&mut self) -> () {
        self.current_tick += 1;
        // we should never NOT be running at 10 ms per tick, so just multiply by this
        // we don't want to mark this as dirty because it would update over the network every tick..
        // but we need the information of how far along we are to be sent out to each client
        // so they can calculate the game clock state
        self.client_time_ms
            .set_without_flagging(self.current_tick * 10);
    }
}
