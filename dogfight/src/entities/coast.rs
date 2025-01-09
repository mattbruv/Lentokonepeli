use dogfight_macros::Networked;
use image::{imageops, RgbaImage};

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, BEACH_L, BEACH_L_DESERT},
    network::{property::*, EntityProperties, NetworkedEntity},
};

use super::{
    entity::Entity,
    types::{EntityType, Facing, Terrain},
};

#[derive(Networked)]
pub struct Coast {
    terrain: Property<Terrain>,
    facing: Property<Facing>,
    client_x: Property<i16>,
    client_y: Property<i16>,

    image_normal: RgbaImage,
    image_desert: RgbaImage,
    image_normal_flipped: RgbaImage,
    image_desert_flipped: RgbaImage,
}

impl Coast {
    pub fn new(terrain: Terrain, facing: Facing, x: i16, y: i16) -> Self {
        Coast {
            terrain: Property::new(terrain),
            facing: Property::new(facing),
            client_x: Property::new(x),
            client_y: Property::new(y),
            image_normal: get_image(BEACH_L),
            image_desert: get_image(BEACH_L_DESERT),
            image_normal_flipped: imageops::flip_horizontal(&get_image(BEACH_L)),
            image_desert_flipped: imageops::flip_horizontal(&get_image(BEACH_L_DESERT)),
        }
    }
}

impl Entity for Coast {
    fn get_type(&self) -> EntityType {
        EntityType::Coast
    }
}

impl SolidEntity for Coast {
    fn get_collision_bounds(&self) -> BoundingBox {
        let img = self.get_collision_image().unwrap();
        BoundingBox {
            x: *self.client_x.get(),
            y: *self.client_y.get(),
            width: img.width() as i16,
            height: img.height() as i16,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        match self.facing.get() {
            Facing::Left => match self.terrain.get() {
                Terrain::Normal => Some(&self.image_normal),
                Terrain::Desert => Some(&self.image_desert),
            },
            Facing::Right => match self.terrain.get() {
                Terrain::Normal => Some(&self.image_normal_flipped),
                Terrain::Desert => Some(&self.image_desert_flipped),
            },
        }
    }

    fn do_rotate_collision_image(&mut self) -> () {}
}
