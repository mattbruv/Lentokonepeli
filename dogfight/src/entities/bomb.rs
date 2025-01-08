use std::f64::consts::{PI, TAU};

use dogfight_macros::{EnumBytes, Networked};
use image::RgbaImage;
use serde::Deserialize;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, BOMB, PLANE4, PLANE5, PLANE6, PLANE7, PLANE8, PLANE9},
    network::property::Property,
    network::EntityProperties,
    network::NetworkedEntity,
    world::RESOLUTION,
};

use super::{entity::Entity, types::EntityType};

const DIRECTIONS: f64 = 256.0;

#[derive(Networked)]
pub struct Bomb {
    x: i32,
    y: i32,
    client_x: Property<i16>,
    client_y: Property<i16>,
    direction: Property<u8>,
    image: RgbaImage,
}

impl Bomb {
    pub fn new() -> Bomb {
        Bomb {
            x: 0,
            y: 0,
            client_x: Property::new(0),
            client_y: Property::new(0),
            direction: Property::new(0),
            image: get_image(BOMB),
        }
    }

    pub fn set_position(&mut self, x: i16, y: i16) {
        self.x = x as i32 * RESOLUTION;
        self.y = y as i32 * RESOLUTION;
        self.client_x.set(x);
        self.client_y.set(y);
    }

    pub fn set_direction(&mut self, direction: u8) {
        let angle = TAU * direction as f64 / DIRECTIONS;
        self.set_radians(angle);
    }

    // this.direction = ((int)(this.physicalModel.angle * 256.0D / 6.283185307179586D));
    fn set_radians(&mut self, new_angle: f64) {
        // self.physical_model.set_radians(new_angle);
        self.direction.set((new_angle * (DIRECTIONS) / TAU) as u8);
    }

    pub fn get_direction(&self) -> u8 {
        *self.direction.get()
    }
}

struct PhysicalModel {
    air_resistance: f64,
    gravity: f64,
    gravity_pull: f64,
    speed: f64,
    angle: f64,
}

impl PhysicalModel {
    const LANDING_SPEED: f64 = 100.0;

    fn new() -> Self {
        PhysicalModel {
            air_resistance: 1.0,
            gravity: 6.0,
            gravity_pull: 0.04908738521234052,
            speed: 0.0,
            angle: 0.0, // This should probably be named radians
        }
    }
}

impl Entity for Bomb {
    fn get_type(&self) -> EntityType {
        EntityType::Bomb
    }
}

impl SolidEntity for Bomb {
    fn get_collision_bounds(&self) -> BoundingBox {
        BoundingBox {
            x: (self.x / RESOLUTION) as i16,
            y: (self.y / RESOLUTION) as i16,
            width: self.image.width() as i16,
            height: self.image.height() as i16,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        None
    }
}
