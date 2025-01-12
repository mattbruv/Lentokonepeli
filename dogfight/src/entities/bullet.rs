use dogfight_macros::Networked;
use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    math::radians_to_direction,
    network::{property::Property, EntityProperties, NetworkedEntity},
    tick_actions::{Action, RemoveData},
    world::RESOLUTION,
};

use super::{entity::Entity, types::EntityType, EntityId};

#[derive(Networked)]
pub struct Bullet {
    x: i32,
    y: i32,
    client_x: Property<i16>,
    client_y: Property<i16>,
    direction: Property<u8>,
    speed: Property<u8>,
    angle: f64,
    age: i32,
}

impl Bullet {
    pub fn new(x: i16, y: i16, angle: f64, speed: f64) -> Bullet {
        let dir = radians_to_direction(angle);
        let mut bullet = Bullet {
            x: x as i32 * RESOLUTION,
            y: y as i32 * RESOLUTION,
            client_x: Property::new(x),
            client_y: Property::new(y),
            direction: Property::new(dir),
            speed: Property::new(((speed + 4.0) * 25.0) as u8),
            angle: angle,
            age: 0,
        };

        if *bullet.speed.get() > 200 {
            bullet.speed.set(200);
        }

        bullet
    }

    pub fn set_position(&mut self, x: i16, y: i16) {
        self.x = x as i32 * RESOLUTION;
        self.y = y as i32 * RESOLUTION;
        self.client_x.set(x);
        self.client_y.set(y);
    }

    pub fn tick(&mut self, my_id: &EntityId) -> Vec<Action> {
        let mut actions = vec![];

        self.age += 1;

        self.move_bullet();

        if self.age == 175 {
            actions.push(Action::RemoveEntity(RemoveData {
                ent_id: *my_id,
                ent_type: self.get_type(),
            }));
        }

        actions
    }

    pub fn move_bullet(&mut self) -> () {
        self.x += (100.0 * (*self.speed.get() as f64) / 25.0 * self.angle.cos()) as i32;
        self.y += (100.0 * (*self.speed.get() as f64) / 25.0 * self.angle.sin()) as i32;
        //self.client_x.set((self.x / RESOLUTION) as i16);
        //self.client_y.set((self.y / RESOLUTION) as i16);
    }

    pub fn get_damage_factor(&self) -> f64 {
        if self.age > 175 {
            return 0.0;
        }

        let mut d = self.age as f64 / 175.0;
        d *= d;

        return 1.0 - d;
    }

    pub fn get_x(&self) -> i16 {
        (self.x / RESOLUTION) as i16
    }

    pub fn get_y(&self) -> i16 {
        (self.y / RESOLUTION) as i16
    }
}

impl Entity for Bullet {
    fn get_type(&self) -> EntityType {
        EntityType::Bullet
    }
}

impl SolidEntity for Bullet {
    fn get_collision_bounds(&self) -> BoundingBox {
        BoundingBox {
            x: (self.x / RESOLUTION) as i16,
            y: (self.y / RESOLUTION) as i16,
            width: 2,
            height: 2,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        None
    }

    fn do_rotate_collision_image(&mut self) -> () {}
}
