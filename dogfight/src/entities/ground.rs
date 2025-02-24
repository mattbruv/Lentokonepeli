use dogfight_macros::Networked;
use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, GROUND1},
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

    image: RgbaImage,
}

impl Ground {
    pub fn new(terrain: Terrain, width: i16, x: i16, y: i16) -> Self {
        Ground {
            terrain: Property::new(terrain),
            width: Property::new(width),
            client_x: Property::new(x),
            client_y: Property::new(y),
            image: get_image(GROUND1),
        }
    }

    pub fn get_x(&self) -> i16 {
        *self.client_x.get()
    }

    pub fn get_y(&self) -> i16 {
        *self.client_y.get()
    }
}

impl Entity for Ground {
    fn get_type(&self) -> EntityType {
        EntityType::Ground
    }
}

const Y_HIT_OFFSET: i16 = 7;

impl SolidEntity for Ground {
    fn get_collision_bounds(&self) -> BoundingBox {
        BoundingBox {
            x: *self.client_x.get(),
            y: *self.client_y.get() + Y_HIT_OFFSET, // hardcoded offset of 7 in original server
            width: *self.width.get(),
            height: self.image.height() as i16 - Y_HIT_OFFSET,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        None
    }

    fn do_rotate_collision_image(&mut self) -> () {}

    fn is_alive(&self) -> bool {
        true
    }
}
