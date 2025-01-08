use std::f64::consts::{PI, TAU};

use dogfight_macros::{EnumBytes, Networked};
use image::RgbaImage;
use serde::Deserialize;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, PARACHUTER0, PLANE4, PLANE5, PLANE6, PLANE7, PLANE8, PLANE9},
    network::{property::Property, EntityProperties, NetworkedEntity},
    world::{DIRECTIONS, RESOLUTION},
};

use super::{entity::Entity, types::EntityType};

const MAX_Y: i16 = -570;
const SKY_HEIGHT: i16 = 500;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS, EnumBytes)]
#[ts(export)]
pub enum PlaneType {
    Albatros = 4,
    Junkers = 5,
    Fokker = 6,
    Bristol = 7,
    Salmson = 8,
    Sopwith = 9,
}

#[derive(Debug)]
pub enum PlaneState {
    Flying = 0,    // 0
    Landing = 1,   // 1
    Landed = 2,    // 2
    TakingOff = 3, // 3
    Falling = 4,   // 4
    // There is no 5th enum in the original game, what could this have been?...
    Dodging = 6, // 6
}

#[derive(Networked)]
pub struct Plane {
    x: i32,
    y: i32,
    client_x: Property<i16>,
    client_y: Property<i16>,
    plane_type: Property<PlaneType>,
    direction: Property<u8>,
    state: PlaneState,
    physical_model: PhysicalModel,

    image_albatros: RgbaImage,
    image_junkers: RgbaImage,
    image_fokker: RgbaImage,
    image_bristol: RgbaImage,
    image_salmson: RgbaImage,
    image_sopwith: RgbaImage,
}

impl Plane {
    pub fn new(plane_type: PlaneType) -> Plane {
        Plane {
            plane_type: Property::new(plane_type),
            x: 0,
            y: 0,
            client_x: Property::new(0),
            client_y: Property::new(0),
            direction: Property::new(0),
            state: PlaneState::Landed,
            physical_model: PhysicalModel::new(),

            image_albatros: get_image(PLANE4),
            image_junkers: get_image(PLANE5),
            image_fokker: get_image(PLANE6),
            image_bristol: get_image(PLANE7),
            image_salmson: get_image(PLANE8),
            image_sopwith: get_image(PLANE9),
        }
    }

    pub fn set_position(&mut self, x: i16, y: i16) {
        self.x = x as i32 * RESOLUTION;
        self.y = y as i32 * RESOLUTION;
        self.client_x.set(x);
        self.client_y.set(y);
    }

    pub fn set_direction(&mut self, direction: u8) {
        let angle = TAU * direction as f64 / (DIRECTIONS as f64);
        self.set_radians(angle);
    }

    // this.direction = ((int)(this.physicalModel.angle * 256.0D / 6.283185307179586D));
    fn set_radians(&mut self, new_angle: f64) {
        self.physical_model.set_radians(new_angle);
        self.direction
            .set((new_angle * (DIRECTIONS as f64) / TAU) as u8);
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

    fn set_radians(&mut self, new_angle: f64) {
        self.angle = new_angle
    }

    fn accelerate(&mut self, plane: &Plane) {
        self.speed += plane.get_acceleration_speed() * self.get_height_multiplier(plane);
    }

    fn air_resistance(&mut self, plane: &Plane) {
        let mut resistance = (self.speed - plane.get_speed_modifier()).powi(2) * 5.0e-5;
        if resistance < self.air_resistance {
            resistance = self.air_resistance;
        }
        self.speed -= resistance;
        if self.speed < 0.0 {
            self.speed = 0.0;
        }
    }

    fn gravity(&mut self, plane: &Plane) {
        let mut d1 = (1.0 - self.speed / 150.0) * self.gravity_pull;
        if d1 < 0.0 {
            d1 = 0.0;
        }

        if (self.angle >= PI / 2.0) && (self.angle <= 3.0 * PI / 2.0) {
            d1 = -d1;
        }

        self.angle += d1;
        if self.angle < 0.0 {
            self.angle += 2.0 * PI;
        } else if self.angle >= 2.0 * PI {
            self.angle -= 2.0 * PI;
        }

        let d2 = self.gravity * self.angle.sin();
        self.speed += d2;
        if self.speed < 0.0 {
            self.speed = 0.0;
        }
    }

    fn run(&mut self, plane: &Plane) {
        self.gravity(plane);
        self.air_resistance(plane);
    }

    fn steer_up(&mut self, plane: &Plane) {
        self.angle += self.speed / 100.0 / 4.0 * plane.get_turn_step();
        if self.angle >= 2.0 * PI {
            self.angle -= 2.0 * PI;
        }
    }

    fn steer_down(&mut self, plane: &Plane) {
        self.angle -= self.speed / 100.0 / 4.0 * plane.get_turn_step();
        if self.angle < 0.0 {
            self.angle += 2.0 * PI;
        }
    }

    fn get_height_multiplier(&self, plane: &Plane) -> f64 {
        let mut multiplier =
            (plane.get_y() as f64 / 100.0 - (64966.0 + plane.get_max_y() as f64)) / 150.0;
        if multiplier > 1.0 {
            multiplier = 1.0;
        }
        multiplier
    }
}

impl Plane {
    fn get_acceleration_speed(&self) -> f64 {
        match self.plane_type.get() {
            PlaneType::Albatros => 4.75,
            PlaneType::Junkers => 1.0,
            PlaneType::Fokker => 1.0,
            PlaneType::Bristol => 1.0,
            PlaneType::Salmson => 1.0,
            PlaneType::Sopwith => 1.0,
        }
    }

    fn get_speed_modifier(&self) -> f64 {
        match self.plane_type.get() {
            PlaneType::Albatros => 55.0,
            PlaneType::Junkers => 1.0,
            PlaneType::Fokker => 1.0,
            PlaneType::Bristol => 1.0,
            PlaneType::Salmson => 1.0,
            PlaneType::Sopwith => 1.0,
        }
    }

    fn get_turn_step(&self) -> f64 {
        match self.plane_type.get() {
            PlaneType::Albatros => 0.031415926535897934,
            PlaneType::Junkers => 1.0,
            PlaneType::Fokker => 1.0,
            PlaneType::Bristol => 1.0,
            PlaneType::Salmson => 1.0,
            PlaneType::Sopwith => 1.0,
        }
    }

    fn get_max_y(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => -50,
            PlaneType::Junkers => 1,
            PlaneType::Fokker => 1,
            PlaneType::Bristol => 1,
            PlaneType::Salmson => 1,
            PlaneType::Sopwith => 1,
        }
    }

    fn get_max_ammo(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => 95,
            PlaneType::Junkers => 100,
            PlaneType::Fokker => 1,
            PlaneType::Bristol => 1,
            PlaneType::Salmson => 1,
            PlaneType::Sopwith => 1,
        }
    }

    fn get_max_bombs(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => 0,
            PlaneType::Junkers => 5,
            PlaneType::Fokker => 0,
            PlaneType::Bristol => 0,
            PlaneType::Salmson => 0,
            PlaneType::Sopwith => 0,
        }
    }

    fn get_max_fuel(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => 80,
            PlaneType::Junkers => 0,
            PlaneType::Fokker => 0,
            PlaneType::Bristol => 0,
            PlaneType::Salmson => 0,
            PlaneType::Sopwith => 0,
        }
    }

    fn get_max_health(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => 135,
            PlaneType::Junkers => 0,
            PlaneType::Fokker => 0,
            PlaneType::Bristol => 0,
            PlaneType::Salmson => 0,
            PlaneType::Sopwith => 0,
        }
    }

    fn get_y(&self) -> i32 {
        self.y
    }

    fn get_image(&self) -> &RgbaImage {
        match self.plane_type.get() {
            PlaneType::Albatros => &self.image_albatros,
            PlaneType::Junkers => &self.image_junkers,
            PlaneType::Fokker => &self.image_fokker,
            PlaneType::Bristol => &self.image_bristol,
            PlaneType::Salmson => &self.image_salmson,
            PlaneType::Sopwith => &self.image_sopwith,
        }
    }
}

impl Entity for Plane {
    fn get_type(&self) -> EntityType {
        EntityType::Plane
    }
}

impl SolidEntity for Plane {
    fn get_collision_bounds(&self) -> BoundingBox {
        let img = self.get_image();
        BoundingBox {
            x: (self.x / RESOLUTION) as i16,
            y: (self.y / RESOLUTION) as i16,
            width: img.width() as i16,
            height: img.height() as i16,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        None
    }
}
