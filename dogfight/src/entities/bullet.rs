use crate::inspect::BulletInspect;
use dogfight_macros::Networked;
use image::RgbaImage;
use std::f64::consts::TAU;

use crate::{
    collision::{BoundingBox, SolidEntity},
    math::radians_to_signed_direction,
    network::{property::Property, EntityProperties, NetworkedEntity},
    world::RESOLUTION,
};

use super::{
    container::{ManId, PlaneId, PlayerId},
    entity::Entity,
    types::EntityType,
};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum BulletOrigin {
    Plane(PlaneId),
    Man(ManId),
}

pub const BULLET_LIFETIME: i32 = 175;

#[derive(Networked)]
pub struct Bullet {
    player_id: PlayerId,
    origin: BulletOrigin,
    x: i32,
    y: i32,
    client_x: Property<i16>,
    client_y: Property<i16>,
    direction: Property<u8>,
    speed: Property<u8>,
    angle: f64,
    age: i32,
    is_alive: bool,
    hit_enemy: bool,
}

impl Bullet {
    pub fn new(
        owner: PlayerId,
        origin: BulletOrigin,
        x: i16,
        y: i16,
        angle: f64,
        speed: f64,
    ) -> Bullet {
        let signed_dir = radians_to_signed_direction(angle);
        let dir = signed_dir as u8;
        let angle = signed_dir as f64 * TAU / 256.0;
        let mut bullet = Bullet {
            player_id: owner,
            origin,
            x: x as i32 * RESOLUTION,
            y: y as i32 * RESOLUTION,
            client_x: Property::new(x),
            client_y: Property::new(y),
            direction: Property::new(dir),
            speed: Property::new(((speed + 4.0) * 25.0) as u8),
            angle: angle,
            age: 0,
            is_alive: true,
            hit_enemy: false,
        };

        if *bullet.speed.get() > 200 {
            bullet.speed.set(200);
        }

        /*
        log(format!(
            "angle: {} dir: {}",
            bullet.angle,
            bullet.direction.get()
        ));
        */

        bullet
    }

    pub fn tick(&mut self) {
        self.age += 1;
        self.move_bullet();
    }

    pub fn expired(&self) -> bool {
        self.age >= BULLET_LIFETIME
    }

    pub fn get_origin(&self) -> BulletOrigin {
        self.origin
    }

    pub fn move_bullet(&mut self) -> () {
        self.x += (100.0 * (*self.speed.get() as f64) / 25.0 * self.angle.cos()) as i32;
        self.y += (100.0 * (*self.speed.get() as f64) / 25.0 * self.angle.sin()) as i32;
        //self.client_x.set((self.x / RESOLUTION) as i16);
        //self.client_y.set((self.y / RESOLUTION) as i16);
    }

    pub fn sync_client_position(&mut self) {
        self.client_x.set(self.get_x());
        self.client_y.set(self.get_y());
    }

    pub fn inspect(&self) -> BulletInspect {
        BulletInspect {
            age: self.age,
            damage_factor: self.get_damage_factor(),
            speed: *self.speed.get(),
            direction: *self.direction.get(),
            hit_enemy: self.hit_enemy,
        }
    }

    pub fn mark_hit_enemy(&mut self) {
        self.hit_enemy = true;
    }

    pub fn hit_enemy(&self) -> bool {
        self.hit_enemy
    }

    pub fn player_id(&self) -> PlayerId {
        self.player_id
    }

    pub fn get_damage_factor(&self) -> f64 {
        if self.age > 175 {
            return 0.0;
        }

        let mut d = self.age as f64 / 175.0;
        d *= d;

        return 1.0 - d;
    }

    pub(crate) fn get_velocity(&self) -> (f64, f64) {
        let speed = *self.speed.get() as f64 / 25.0;
        (speed * self.angle.cos(), speed * self.angle.sin())
    }

    pub(crate) fn remaining_ticks(&self) -> i32 {
        BULLET_LIFETIME - self.age
    }

    pub fn get_x(&self) -> i16 {
        (self.x / RESOLUTION) as i16
    }

    pub fn get_y(&self) -> i16 {
        (self.y / RESOLUTION) as i16
    }

    pub fn kill(&mut self) -> () {
        self.is_alive = false;
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

    fn is_alive(&self) -> bool {
        self.is_alive
    }
}

#[cfg(test)]
mod tests {
    use super::Bullet;
    use crate::{entities::container::PlayerId, network::encoding::NetworkedBytes, world::World};

    fn world_with_bullet(sync: bool) -> (World, crate::entities::container::BulletId) {
        let mut world = World::new();
        world.sync_bullet_positions = sync;
        let (_, owner) = PlayerId::from_bytes(&[0, 0]).unwrap();
        let (id, _) = world
            .bullets
            .insert(Bullet::new(
                owner,
                super::BulletOrigin::Man(crate::entities::container::ManId::from(0)),
                100,
                100,
                0.0,
                4.0,
            ))
            .unwrap();
        for _ in 0..10 {
            world.tick(vec![]);
        }
        (world, id)
    }

    #[test]
    fn replay_worlds_keep_bullet_client_position_in_sync() {
        let (world, id) = world_with_bullet(true);
        let bullet = world.bullets.get(id).unwrap();
        assert_ne!(bullet.get_x(), 100);
        assert_eq!(*bullet.client_x.get(), bullet.get_x());
        assert_eq!(*bullet.client_y.get(), bullet.get_y());
    }

    #[test]
    fn live_worlds_only_send_bullet_spawn_position() {
        let (world, id) = world_with_bullet(false);
        let bullet = world.bullets.get(id).unwrap();
        assert_ne!(bullet.get_x(), 100);
        assert_eq!(*bullet.client_x.get(), 100);
    }
}
