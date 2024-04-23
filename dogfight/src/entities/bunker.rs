use dogfight_macros::Networked;

use crate::network::{property::*, EntityProperties, NetworkedEntity};

use super::types::Team;

#[derive(Networked)]
pub struct Bunker {
    team: Property<Team>,
    x: Property<i16>,
    y: Property<i16>,
}

impl Bunker {
    pub fn new(team: Team, x: i16, y: i16) -> Self {
        Bunker {
            team: Property::new(team),
            x: Property::new(x),
            y: Property::new(y),
        }
    }
}
