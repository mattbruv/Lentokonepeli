use serde::Serialize;

use crate::{
    entities::Team,
    network::{property::*, EntityProperties, NetworkedEntity},
    world::RESOLUTION,
};

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
            team: Property::new(team),
            x: 0,
            y: 0,
            client_x: Property::new(0),
            client_y: Property::new(0),
        }
    }
}

#[derive(Serialize)]
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
