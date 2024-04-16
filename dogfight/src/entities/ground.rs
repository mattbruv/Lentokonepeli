use dogfight_macros::Networked;

use crate::network::{property::*, EntityProperties, NetworkedEntity};

use super::terrain::Terrain;

#[derive(Networked)]
pub struct Ground {
    terrain: Property<Terrain>,
    client_x: Property<i16>,
    client_y: Property<i16>,
}

impl Ground {
    pub fn new(terrain: Terrain, x: i16, y: i16) -> Self {
        Ground {
            terrain: Property::new(terrain),
            client_x: Property::new(x),
            client_y: Property::new(y),
        }
    }
}
