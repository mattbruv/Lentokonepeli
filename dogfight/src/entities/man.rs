use dogfight_macros::Networked;
use serde::Serialize;
use ts_rs::TS;

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

/*
#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct ManProperties {
    team: Option<Team>,
    x: Option<i16>,
    y: Option<i16>,
}

impl NetworkedEntity for Man {
    fn get_full_properties(&self) -> EntityProperties {
        EntityProperties::Man(ManProperties {
            team: self.team.get_full(),
            x: self.client_x.get_full(),
            y: self.client_y.get_full(),
        })
    }

    fn get_changed_properties_and_reset(&mut self) -> EntityProperties {
        EntityProperties::Man(ManProperties {
            team: self.team.get_changed(),
            x: self.client_x.get_changed(),
            y: self.client_y.get_changed(),
        })
    }
}

 */
