use dogfight_macros::Networked;

use crate::network::{property::*, EntityProperties, NetworkedEntity};

use super::types::{Facing, Team};

#[derive(Networked)]
pub struct Runway {
    team: Property<Team>,
    facing: Property<Facing>,
    client_x: Property<i16>,
    client_y: Property<i16>,
}

impl Runway {
    pub fn new(team: Team, facing: Facing, x: i16, y: i16) -> Self {
        Runway {
            team: Property::new(team),
            facing: Property::new(facing),
            client_x: Property::new(x),
            client_y: Property::new(y),
        }
    }
}
