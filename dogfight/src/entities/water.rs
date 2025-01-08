use dogfight_macros::Networked;
use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    network::{property::*, EntityProperties, NetworkedEntity},
};

use super::{
    entity::Entity,
    types::{EntityType, Facing, Terrain},
};

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

impl Entity for Water {
    fn get_type(&self) -> EntityType {
        EntityType::Water
    }
}

impl SolidEntity for Water {
    fn get_collision_bounds(&self) -> BoundingBox {
        BoundingBox {
            x: *self.client_x.get(),
            y: *self.client_y.get() + 5,
            width: *self.width.get(),
            height: 100,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        None
    }
}
