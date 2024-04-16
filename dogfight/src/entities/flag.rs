use dogfight_macros::Networked;

use crate::network::{property::*, EntityProperties, NetworkedEntity};

use super::types::Team;

#[derive(Networked)]
pub struct Flag {
    team: Property<Team>,
    client_x: Property<i16>,
    client_y: Property<i16>,
}

impl Flag {
    pub fn new(team: Team, x: i16, y: i16) -> Self {
        Flag {
            team: Property::new(team),
            client_x: Property::new(x),
            client_y: Property::new(y),
        }
    }
}
