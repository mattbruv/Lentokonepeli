use std::f64::consts::PI;

use dogfight_macros::{EnumBytes, Networked};
use image::RgbaImage;
use serde::Deserialize;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, PLANE4, PLANE5, PLANE6, PLANE7, PLANE8, PLANE9},
    input::PlayerKeyboard,
    math::radians_to_direction,
    network::{property::Property, EntityProperties, NetworkedEntity},
    tick_actions::Action,
    world::RESOLUTION,
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS, EnumBytes)]
#[ts(export)]
pub enum PlaneMode {
    Flying = 0,    // 0
    Landing = 1,   // 1
    Landed = 2,    // 2
    TakingOff = 3, // 3
    Falling = 4,   // 4
    // There is no 5th enum in the original game, what could this have been?...
    Dodging = 6, // 6
}

/*
    this.keyMap.put(PLANE_UP, new int[] { 37 });
    this.keyMap.put(PLANE_DOWN, new int[] { 39 });
    this.keyMap.put(PLANE_SHOOT, new int[] { 17, 45 });
    this.keyMap.put(PLANE_BOMB, new int[] { 16, 46, 66 });
    this.keyMap.put(PLANE_MOTOR, new int[] { 40 });
    this.keyMap.put(PLANE_FLIP, new int[] { 38 });
    this.keyMap.put(PLANE_JUMP, new int[] { 32 });
*/

#[derive(Networked)]
pub struct Plane {
    x: i32,
    y: i32,
    client_x: Property<i16>,
    client_y: Property<i16>,
    client_fuel: Property<u8>,
    plane_type: Property<PlaneType>,
    direction: Property<u8>,
    mode: Property<PlaneMode>,
    motor_on: Property<bool>,
    flipped: Property<bool>,

    // Random shit
    last_flip_ms: i32,
    flip_delay_ms: i32,

    last_bomb_ms: i32,
    bomb_delay_ms: i32,

    last_motor_on_ms: i32,
    motor_on_delay_ms: i32,

    total_fuel: i32,
    fuel_counter: i32,

    // Physical Model
    air_resistance: f64,
    gravity: f64,
    gravity_pull: f64,
    speed: f64,
    angle: f64,

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
            client_fuel: Property::new(0),
            direction: Property::new(0),
            mode: Property::new(PlaneMode::Flying),
            motor_on: Property::new(true),
            flipped: Property::new(false),

            // random shit
            fuel_counter: 100,
            total_fuel: 500,

            last_flip_ms: 0,
            flip_delay_ms: 200,

            last_bomb_ms: 0,
            bomb_delay_ms: 500,

            last_motor_on_ms: 0,
            motor_on_delay_ms: 500,

            // Physical Model
            air_resistance: 1.0,
            gravity: 6.0,
            gravity_pull: 0.04908738521234052,
            speed: 0.0,
            angle: 0.0, // This should probably be named radians

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

    pub fn get_direction(&self) -> u8 {
        *self.direction.get()
    }

    pub fn tick(&mut self, keyboard: Option<&PlayerKeyboard>) -> Vec<Action> {
        let mut actions = vec![];

        match self.mode.get() {
            PlaneMode::Flying => {
                // check if we're flipped
                if let Some(keys) = keyboard {
                    if keys.up && self.last_flip_ms > self.flip_delay_ms {
                        self.flipped.set(!self.flipped.get());
                        self.last_flip_ms = 0;
                    }

                    // PLANE_DOWN = 39 = right = steer_up
                    if keys.right {
                        self.steer_up();
                    }

                    // PLANE_UP = 37 = left = steer_down
                    if keys.left {
                        self.steer_down();
                    }

                    // PLANE_MOTOR = 40 = down
                    if keys.down
                        && self.last_motor_on_ms > self.motor_on_delay_ms
                        && self.total_fuel > 0
                    {
                        self.motor_on.set(!self.motor_on.get());
                        self.last_motor_on_ms = 0;
                    }

                    // If we are flying within bounds
                    if *self.motor_on.get()
                        && (self.x / RESOLUTION < 20_000)
                        && (self.x / RESOLUTION > -20_000)
                    {
                        // drain fuel
                        if self.fuel_counter > 0 {
                            self.fuel_counter -= 1;
                        }

                        if self.fuel_counter == 0 {
                            if self.total_fuel == 0 {
                                self.motor_on.set(false);
                            } else {
                                self.fuel_counter = 100;
                                // TODO: extract this into a function so we can update client fuel
                                self.total_fuel -= 1;
                            }
                        }

                        self.accelerate();
                    }

                    self.run();

                    // update coordinates and angle
                    if self.speed != 0.0 {
                        //
                        let res = RESOLUTION as f64;
                        self.x = (res * self.angle.cos() * self.speed / res) as i32;
                        self.y = (res * self.angle.sin() * self.speed / res) as i32;
                        self.client_x.set((self.x / RESOLUTION) as i16);
                        self.client_y.set((self.y / RESOLUTION) as i16);

                        self.direction.set(radians_to_direction(self.angle));
                    }
                }
            }
            PlaneMode::Landing => todo!(),
            PlaneMode::Landed => todo!(),
            PlaneMode::TakingOff => todo!(),
            PlaneMode::Falling => todo!(),
            PlaneMode::Dodging => todo!(),
        }

        actions
    }
}

// Impl Physical Model
impl Plane {
    const LANDING_SPEED: f64 = 100.0;

    fn run(&mut self) {
        self.gravity();
        self.air_resistance();
    }

    fn accelerate(&mut self) {
        self.speed += self.get_acceleration_speed() * self.get_height_multiplier();
    }

    fn air_resistance(&mut self) {
        let mut resistance = (self.speed - self.get_speed_modifier()).powi(2) * 5.0e-5;
        if resistance < self.air_resistance {
            resistance = self.air_resistance;
        }
        self.speed -= resistance;
        if self.speed < 0.0 {
            self.speed = 0.0;
        }
    }

    fn gravity(&mut self) {
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

    fn steer_up(&mut self) {
        self.angle += self.speed / 100.0 / 4.0 * self.get_turn_step();
        if self.angle >= 2.0 * PI {
            self.angle -= 2.0 * PI;
        }
    }

    fn steer_down(&mut self) {
        self.angle -= self.speed / 100.0 / 4.0 * self.get_turn_step();
        if self.angle < 0.0 {
            self.angle += 2.0 * PI;
        }
    }

    fn get_height_multiplier(&self) -> f64 {
        let mut multiplier =
            (self.get_y() as f64 / 100.0 - (64966.0 + self.get_max_y() as f64)) / 150.0;
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
