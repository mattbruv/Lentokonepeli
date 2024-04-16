use std::f32::consts::FRAC_1_PI;

use dogfight_macros::Networked;

use crate::network::{property::*, EntityProperties, NetworkedEntity};

use super::types::{Facing, Terrain};

#[derive(Networked)]
pub struct Coast {
    terrain: Property<Terrain>,
    facing: Property<Facing>,
    client_x: Property<i16>,
    client_y: Property<i16>,
}

impl Coast {
    pub fn new(terrain: Terrain, facing: Facing, x: i16, y: i16) -> Self {
        Coast {
            terrain: Property::new(terrain),
            facing: Property::new(facing),
            client_x: Property::new(x),
            client_y: Property::new(y),
        }
    }
}
