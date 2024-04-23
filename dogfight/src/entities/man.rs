use dogfight_macros::{EnumBytes, Networked};

use crate::{
    network::{property::*, EntityProperties, NetworkedEntity},
    world::RESOLUTION,
};

use super::types::Team;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum ManState {
    Falling,
    Parachuting,
    Standing,
    WalkingLeft,
    WalkingRight,
}

#[derive(Networked)]
pub struct Man {
    x: i32,
    y: i32,

    team: Property<Team>,
    client_x: Property<i16>,
    client_y: Property<i16>,
    state: Property<ManState>,
}

impl Man {
    pub fn new(team: Team) -> Self {
        Man {
            x: 0,
            y: 0,
            team: Property::new(team),
            client_x: Property::new(0),
            client_y: Property::new(0),
            state: Property::new(ManState::Parachuting),
        }
    }

    pub fn get_x(&self) -> i32 {
        self.x
    }

    pub fn set_x(&mut self, x: i32) -> () {
        self.x = x;
        self.client_x.set((x / RESOLUTION) as i16);
    }

    pub fn get_y(&self) -> i32 {
        self.y
    }

    pub fn set_y(&mut self, y: i32) -> () {
        self.y = y;
        self.client_y.set((y / RESOLUTION) as i16);
    }
}
