use dogfight_macros::Networked;

use crate::{
    collision::{BoundingBox, SolidEntity},
    network::{property::*, EntityProperties, NetworkedEntity},
};

use super::{
    entity::Entity,
    types::{EntityType, Terrain},
};

#[derive(Networked)]
pub struct Ground {
    terrain: Property<Terrain>,
    width: Property<i16>,
    client_x: Property<i16>,
    client_y: Property<i16>,
}

impl Ground {
    pub fn new(terrain: Terrain, width: i16, x: i16, y: i16) -> Self {
        Ground {
            terrain: Property::new(terrain),
            width: Property::new(width),
            client_x: Property::new(x),
            client_y: Property::new(y),
        }
    }
}

impl Entity for Ground {
    fn get_type(&self) -> EntityType {
        EntityType::Ground
    }
}

impl SolidEntity for Ground {
    fn get_collision_bounds(&self) -> crate::collision::BoundingBox {
        BoundingBox {
            x: *self.client_x.get(),
            y: *self.client_y.get(),
            width: *self.width.get(),
            height: 100,
        }
    }

    fn get_collision_image(&self) -> Option<&image::RgbaImage> {
        None
    }
}
