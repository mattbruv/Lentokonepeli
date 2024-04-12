use dogfight_macros::Networked;

use crate::{
    entities::Team,
    network::{property::*, EntityProperties, NetworkedEntity},
    world::RESOLUTION,
};

#[derive(Networked)]
pub struct Man {
    x: i32,
    y: i32,

    team: Property<Team>,
    client_x: Property<i16>,
    client_y: Property<i16>,
    foo: Property<i16>,
}

impl Man {
    pub fn test(&mut self) {}
    pub fn new(team: Team) -> Self {
        Man {
            x: 0,
            y: 0,
            team: Property::new(team),
            client_x: Property::new(0),
            client_y: Property::new(0),
            foo: Property::new(20),
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
