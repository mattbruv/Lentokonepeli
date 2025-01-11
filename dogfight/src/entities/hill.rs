use dogfight_macros::Networked;

use crate::network::{property::*, EntityProperties, NetworkedEntity};

use super::types::Terrain;

#[derive(Networked)]
pub struct Hill {
    terrain: Property<Terrain>,
    client_x: Property<i16>,
    client_y: Property<i16>,
}

impl Hill {
    pub fn new(terrain_type: Terrain, x: i16, y: i16) -> Self {
        Self {
            terrain: Property::new(terrain_type),
            client_x: Property::new(x),
            client_y: Property::new(y),
        }
    }
}
