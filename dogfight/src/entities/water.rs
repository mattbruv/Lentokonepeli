use dogfight_macros::Networked;

use crate::network::{property::*, EntityProperties, NetworkedEntity};

use super::types::{Facing, Terrain};

#[derive(Networked)]
pub struct Water {
    terrain: Property<Terrain>,
    facing: Property<Facing>,
    width: Property<i16>,
    client_x: Property<i16>,
    client_y: Property<i16>,
}

impl Water {
    pub fn new(terrain: Terrain, facing: Facing, width: i16, x: i16, y: i16) -> Self {
        Self {
            terrain: Property::new(terrain),
            facing: Property::new(facing),
            width: Property::new(width),
            client_x: Property::new(x),
            client_y: Property::new(y),
        }
    }
}
