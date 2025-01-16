use std::f64::consts::TAU;

use dogfight_macros::Networked;
use image::RgbaImage;
use imageproc::geometric_transformations::{rotate, Interpolation};

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, get_rotateable_image, rotate_image, BOMB},
    math::radians_to_direction,
    network::{property::Property, EntityProperties, NetworkedEntity},
    world::{DIRECTIONS, RESOLUTION},
};

use super::{entity::Entity, types::EntityType};

#[derive(Networked)]
pub struct Bomb {
    x: i32,
    y: i32,
    client_x: Property<i16>,
    client_y: Property<i16>,
    direction: Property<u8>,
    angle: f64,
    x_speed: f64,
    y_speed: f64,
    image: RgbaImage,
    rotated_image: RgbaImage,
}

impl Bomb {
    pub fn new(x: i16, y: i16, angle: f64, speed: f64) -> Bomb {
        let dir = radians_to_direction(angle);
        Bomb {
            x: (x as i32) * RESOLUTION,
            y: (y as i32) * RESOLUTION,
            client_x: Property::new(x),
            client_y: Property::new(y),
            direction: Property::new(dir),
            angle: angle,
            x_speed: angle.cos() * speed * 100.0,
            y_speed: angle.sin() * speed * 100.0,

            image: get_rotateable_image(BOMB),
            rotated_image: get_rotateable_image(BOMB),
        }
    }

    pub fn set_position(&mut self, x: i16, y: i16) {
        self.x = x as i32 * RESOLUTION;
        self.y = y as i32 * RESOLUTION;
        self.client_x.set(x);
        self.client_y.set(y);
    }

    pub fn tick(&mut self) {
        self.x += ((RESOLUTION as f64) * self.x_speed / (RESOLUTION as f64)) as i32;
        self.y += ((RESOLUTION as f64) * self.y_speed / (RESOLUTION as f64)) as i32;

        self.client_x.set((self.x / RESOLUTION) as i16);
        self.client_y.set((self.y / RESOLUTION) as i16);

        self.x_speed -= self.x_speed * 0.01;
        self.y_speed += 3.3333333333333335;

        // update angle/direction
        self.angle = self.y_speed.atan2(self.x_speed);
        self.direction.set(radians_to_direction(self.angle));
    }

    pub fn get_x(&self) -> i16 {
        *self.client_x.get()
    }

    pub fn get_y(&self) -> i16 {
        *self.client_y.get()
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
        Some(&self.rotated_image)
    }

    fn do_rotate_collision_image(&mut self) -> () {
        self.rotated_image = rotate_image(&self.image, self.angle, false);
    }

    fn is_alive(&self) -> bool {
        true
    }
}
