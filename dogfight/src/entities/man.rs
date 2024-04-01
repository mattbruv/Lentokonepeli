use serde::Serialize;

use crate::{
    network::{self, NetworkedEntity},
    world::RESOLUTION,
};

use super::Team;

pub struct Man {
    team: Team,
    x: i32,
    y: i32,
    client_x: i16,
    client_y: i16,
}

impl Man {
    pub fn new(team: Team) -> Self {
        Man {
            team: team,
            x: 0,
            y: 0,
            client_x: 0,
            client_y: 0,
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
    fn get_full_properties(&self) -> network::EntityProperties {
        todo!()
    }

    fn get_changed_properties(&self) -> network::EntityProperties {
        todo!()
    }
}
