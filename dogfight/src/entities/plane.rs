use std::f64::consts::PI;

use dogfight_macros::{EnumBytes, Networked};
use image::RgbaImage;
use serde::Deserialize;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_rotateable_image, rotate_image, PLANE4, PLANE5, PLANE6, PLANE7, PLANE8, PLANE9},
    input::PlayerKeyboard,
    math::radians_to_direction,
    network::{property::Property, EntityProperties, NetworkedEntity},
    tick_actions::Action,
    world::RESOLUTION,
};

use super::{
    bomb::Bomb,
    entity::Entity,
    man::Man,
    player::ControllingEntity,
    runway::Runway,
    types::{EntityType, Facing, Team},
    EntityId,
};

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

    takeoff_counter: i32,
    dodge_counter: i32,

    runway: Option<EntityId>,

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

    rotated_image: RgbaImage,
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

            takeoff_counter: 0,
            dodge_counter: 0,

            runway: None,

            // Physical Model
            air_resistance: 1.0,
            gravity: 6.0,
            gravity_pull: 0.04908738521234052,
            speed: 0.0,
            angle: 0.0, // This should probably be named radians

            image_albatros: get_rotateable_image(PLANE4),
            image_junkers: get_rotateable_image(PLANE5),
            image_fokker: get_rotateable_image(PLANE6),
            image_bristol: get_rotateable_image(PLANE7),
            image_salmson: get_rotateable_image(PLANE8),
            image_sopwith: get_rotateable_image(PLANE9),

            rotated_image: get_rotateable_image(PLANE4),
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

    pub fn tick(&mut self, my_id: &EntityId, keyboard: Option<&PlayerKeyboard>) -> Vec<Action> {
        let mut actions = vec![];

        // web_sys::console::log_1(&format!("ticking plane! {:?}", self.mode.get()).into());

        // Add a tick to our counters
        self.last_bomb_ms += 10;
        self.last_flip_ms += 10;
        self.last_motor_on_ms += 10;

        match self.mode.get() {
            PlaneMode::Flying => self.tick_flying(my_id, keyboard, &mut actions),
            PlaneMode::Landing => self.tick_landing(),
            PlaneMode::Landed => self.tick_landed(keyboard),
            PlaneMode::TakingOff => self.tick_takeoff(),
            PlaneMode::Falling => self.tick_falling(my_id, keyboard, &mut actions),
            PlaneMode::Dodging => self.tick_dodging(),
        };

        actions
    }

    fn tick_dodging(&mut self) {
        if *self.motor_on.get() {
            self.drain_fuel();
            self.accelerate();
        }

        self.run();

        self.x += (100.0 * self.angle.cos() * self.speed / 100.0) as i32;
        self.client_x.set((self.x / RESOLUTION) as i16);

        self.y += (100.0 * self.angle.sin() * self.speed / 100.0) as i32;
        self.client_y.set((self.y / RESOLUTION) as i16);

        self.direction.set(radians_to_direction(self.angle));

        self.dodge_counter += 1;

        if self.dodge_counter > 40 {
            self.mode.set(PlaneMode::Flying);
            self.dodge_counter = 0;
        } else if self.dodge_counter == 10 {
            self.flipped.set(!self.flipped.get());
        } else if self.dodge_counter == 20 {
            self.flipped.set(!self.flipped.get());
        } else if self.dodge_counter == 30 {
            self.flipped.set(!self.flipped.get());
        }
    }

    fn tick_falling(
        &mut self,
        my_id: &u16,
        keyboard: Option<&PlayerKeyboard>,
        actions: &mut Vec<Action>,
    ) {
        self.run();

        // this.x += (int)(100.0D * Math.cos(this.physicalModel.angle) * this.physicalModel.speed / 100.0D);
        // this.y += (int)(100.0D * Math.sin(this.physicalModel.angle) * this.physicalModel.speed / 100.0D);
        // this.direction = ((int)(this.physicalModel.angle * 256.0D / 6.283185307179586D));
        self.x += (100.0 * self.angle.cos() * self.speed / 100.0) as i32;
        self.client_x.set((self.x / RESOLUTION) as i16);

        self.y += (100.0 * self.angle.sin() * self.speed / 100.0) as i32;
        self.client_y.set((self.y / RESOLUTION) as i16);

        self.direction.set(radians_to_direction(self.angle));

        if let Some(keys) = keyboard {
            if keys.space {
                self.spawn_man_action(my_id, actions);
            }
        }
    }

    fn tick_takeoff(&mut self) {
        self.accelerate();

        self.takeoff_counter += 1;

        if self.takeoff_counter == 65 || self.takeoff_counter == 75 {
            if *self.flipped.get() {
                self.steer_up();
            } else {
                self.steer_down();
            }
        } else if self.takeoff_counter == 60 || self.takeoff_counter == 70 {
            if *self.flipped.get() {
                self.steer_up();
            } else {
                self.steer_down();
            }
            self.y -= 100;
            self.client_y.set((self.y / RESOLUTION) as i16);
        }

        // Fly! Free bird
        if self.takeoff_counter >= 70 {
            self.mode.set(PlaneMode::Flying);
            self.takeoff_counter = 0;
        }

        self.direction.set(radians_to_direction(self.angle));

        if self.speed != 0.0 {
            self.x += (100.0 * self.angle.cos() * self.speed / 100.0) as i32;
            self.client_x.set((self.x / RESOLUTION) as i16);
        }
    }

    fn tick_landed(&mut self, keyboard: Option<&PlayerKeyboard>) {
        if let Some(keys) = keyboard {
            //
            if keys.down && self.last_motor_on_ms > self.motor_on_delay_ms {
                self.motor_on.set(!self.motor_on.get());
                self.last_motor_on_ms = 0;
                self.mode.set(PlaneMode::TakingOff);
            }
        }
    }

    fn tick_landing(&mut self) {
        // if going faster than 100, slow down
        if self.speed > 100.0 {
            self.speed -= 3.0;
        }
        // if going slower than 100, speed up.
        if self.speed < 100.0 {
            self.speed += 3.0;
        }
        // if we're within a range of 3 from 100, set to 100.
        if (self.speed - 100.0).abs() < 3.0 {
            self.speed = 100.0;
        }

        if self.speed != 0.0 {
            self.x += (100.0 * self.angle.cos() * self.speed / 100.0) as i32;
            self.client_x.set((self.x / RESOLUTION) as i16);
        }
    }

    fn tick_flying(
        &mut self,
        my_id: &u16,
        keyboard: Option<&PlayerKeyboard>,
        actions: &mut Vec<Action>,
    ) {
        // Apply player key logic if pressed
        if let Some(keys) = keyboard {
            // check if we're flipped
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
            if keys.down && self.last_motor_on_ms > self.motor_on_delay_ms && self.total_fuel > 0 {
                self.motor_on.set(!self.motor_on.get());
                self.last_motor_on_ms = 0;
            }

            // Spawn man if jumping out of plane
            // Or force plan abandon if out of bounds
            let is_out_of_bounds = *self.client_x.get() > 20_000 || *self.client_x.get() < -20_000;

            // Jump out of plane
            if keys.space || is_out_of_bounds {
                self.spawn_man_action(my_id, actions);
                self.mode.set(PlaneMode::Falling);
            }

            // Bombs away
            if keys.shift {
                let x = self.x / RESOLUTION;
                let y = self.y / RESOLUTION;
                actions.push(Action::SpawnBomb(Bomb::new(
                    x as i16,
                    y as i16,
                    *self.direction.get(),
                    self.speed / 100.0,
                )));
                //
            }
        }

        // If we are flying within bounds
        if *self.motor_on.get() && (self.x / RESOLUTION < 20_000) && (self.x / RESOLUTION > -20_000)
        {
            self.drain_fuel();
            self.accelerate();
        }

        self.run();

        // update coordinates and angle
        if self.speed != 0.0 {
            // TODO: this should probably be speed per pixel instead, it's distinct
            let res = RESOLUTION as f64;
            //web_sys::console::log_1(&format!("x before: {}", self.x).into());
            //web_sys::console::log_1(&format!("y before: {}", self.y).into());

            self.x += (res * self.angle.cos() * self.speed / res) as i32;
            self.y += (res * self.angle.sin() * self.speed / res) as i32;

            //web_sys::console::log_1(&format!("x after: {}", self.x).into());
            //web_sys::console::log_1(&format!("y after: {}", self.y).into());
            self.client_x.set((self.x / RESOLUTION) as i16);
            self.client_y.set((self.y / RESOLUTION) as i16);

            self.direction.set(radians_to_direction(self.angle));
        }
    }

    fn drain_fuel(&mut self) {
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
    }

    fn spawn_man_action(&mut self, my_id: &u16, actions: &mut Vec<Action>) {
        let mut man = Man::new(Team::Allies);
        man.set_x(self.x);
        man.set_y(self.y);
        actions.push(Action::SpawnMan(
            man,
            Some(ControllingEntity {
                id: *my_id,
                entity_type: self.get_type(),
            }),
        ));
    }

    pub fn set_client_y(&mut self, new_client_y: i16) -> () {
        self.y  = new_client_y as i32 * RESOLUTION;
        self.client_y.set(new_client_y);
    }

    pub fn set_angle(&mut self, new_angle_radians: f64) -> () {
        self.angle = new_angle_radians;
        self.direction.set(radians_to_direction(self.angle));
    }

    pub fn get_runway(&self) -> Option<EntityId> {
        self.runway
    }

    pub fn set_runway(&mut self, runway: Option<EntityId>) -> () {
        self.runway = runway;
    }

    pub fn is_facing_runway_correctly(&self, runway: &Runway) -> bool {
        // TODO: check to make sure the runway team is same as player team
        let facing = runway.get_facing();
        if ((facing == Facing::Right)
            && (self.angle == PI))
            || ((facing == Facing::Left)
                && (self.angle == 0.0)
                && (runway.reserve_for(2)))
        {
            return true;
        }


        false
    }

    pub fn flipped(&self) -> bool {
        *self.flipped.get()
    }

    pub fn can_land_on_runway(&self, runway: &Runway) -> bool {
        let x = *self.client_x.get();

        // Holy mother of if statements
        if (*self.mode.get() != PlaneMode::Landing) && // fo
        (x > runway.get_landable_x()) &&
        (x + self.get_width() < runway.get_landable_x() + runway.get_landable_width()) &&
        (!self.motor_on.get()) &&
        (self.speed < 250.0 + self.get_speed_modifier()) &&
        (
            (
                (!*self.flipped.get()) && 
                (
                    (self.angle < 0.8975979010256552) || 
                    (self.angle > 5.385587406153931)
                )
            ) || 
            (
                (*self.flipped.get()) && 
                (self.angle < 4.039190554615448) && 
                (self.angle > 2.243994752564138)
            )
        )
        {
            return true;
        }

        false
    }

    pub(crate) fn get_mode(&self) -> PlaneMode {
        *self.mode.get()
    }

    pub(crate) fn set_mode(&mut self, mode: PlaneMode) -> () {
        self.mode.set(mode);
    }

    pub(crate) fn get_width(&self) -> i16 {
        self.rotated_image.width() as i16
    }

    pub fn get_motor_on(&self) -> bool {
        *self.motor_on.get()
    }

    pub(crate) fn get_client_x(&self) -> i16 {
        *self.client_x.get()
    }

    pub(crate) fn get_client_y(&self) -> i16 {
        *self.client_y.get()
    }
    
    pub(crate) fn get_bottom_height(&self) -> i16 {
        // Convert the image to RGBA8 for easy pixel manipulation
        let image = self.get_image();
        let (width, height) = image.dimensions();
    
        for y in (0..height).rev() {
            for x in 0..width {
                let pixel = image.get_pixel(x, y);
                if pixel[3] > 0 { // Check if alpha channel is non-zero (or change condition to fit your needs)
                    return (y + 1).try_into().unwrap();
                }
            }
        }
    
        0 // Return 0 if no non-transparent pixels are found
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
            (((self.get_y() / RESOLUTION) as i16) - (MAX_Y + self.get_max_y())) as f64 / 150.0;
        if multiplier > 1.0 {
            multiplier = 1.0;
        }
        multiplier
    }
}

impl Plane {
    fn get_max_ammo(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => 95,
            PlaneType::Junkers => 100,
            PlaneType::Fokker => 90,
            PlaneType::Bristol => 100,
            PlaneType::Salmson => 60,
            PlaneType::Sopwith => 80,
        }
    }

    fn get_max_bombs(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => 0,
            PlaneType::Junkers => 5,
            PlaneType::Fokker => 0,
            PlaneType::Bristol => 0,
            PlaneType::Salmson => 5,
            PlaneType::Sopwith => 0,
        }
    }

    fn get_max_fuel(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => 80,
            PlaneType::Junkers => 100,
            PlaneType::Fokker => 90,
            PlaneType::Bristol => 60,
            PlaneType::Salmson => 60,
            PlaneType::Sopwith => 80,
        }
    }

    fn get_max_health(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => 135,
            PlaneType::Junkers => 160,
            PlaneType::Fokker => 120,
            PlaneType::Bristol => 135,
            PlaneType::Salmson => 90,
            PlaneType::Sopwith => 120,
        }
    }

    fn get_acceleration_speed(&self) -> f64 {
        match self.plane_type.get() {
            PlaneType::Albatros => 4.75,
            PlaneType::Junkers => 4.65,
            PlaneType::Fokker => 5.0,
            PlaneType::Bristol => 4.85,
            PlaneType::Salmson => 4.7,
            PlaneType::Sopwith => 5.0,
        }
    }

    fn get_max_y(&self) -> i16 {
        match self.plane_type.get() {
            PlaneType::Albatros => -50,
            PlaneType::Junkers => 10,
            PlaneType::Fokker => 0,
            PlaneType::Bristol => -20,
            PlaneType::Salmson => -140,
            PlaneType::Sopwith => 20,
        }
    }

    fn get_turn_step(&self) -> f64 {
        match self.plane_type.get() {
            PlaneType::Albatros => 0.031415926535897934,
            PlaneType::Junkers => 0.028559933214452663,
            PlaneType::Fokker => 0.0483321946706122,
            PlaneType::Bristol => 0.036110260386089575,
            PlaneType::Salmson => 0.031415926535897934,
            PlaneType::Sopwith => 0.04487989505128276,
        }
    }

    fn get_shoot_delay(&self) -> i32 {
        match self.plane_type.get() {
            PlaneType::Albatros => 118,
            PlaneType::Junkers => 170,
            PlaneType::Fokker => 120,
            PlaneType::Bristol => 97,
            PlaneType::Salmson => 180,
            PlaneType::Sopwith => 130,
        }
    }

    fn get_speed_modifier(&self) -> f64 {
        match self.plane_type.get() {
            PlaneType::Albatros => 55.0,
            PlaneType::Junkers => 0.0,
            PlaneType::Fokker => 0.0,
            PlaneType::Bristol => 0.0,
            PlaneType::Salmson => 50.0,
            PlaneType::Sopwith => 50.0,
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
            x: (self.x / RESOLUTION) as i16 - (img.width() / 2) as i16,
            y: (self.y / RESOLUTION) as i16 - (img.height() / 2) as i16,
            width: img.width() as i16,
            height: img.height() as i16,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        Some(&self.rotated_image)
    }

    fn do_rotate_collision_image(&mut self) -> () {
        match self.plane_type.get() {
            PlaneType::Albatros => {
                self.rotated_image = rotate_image(&self.image_albatros, self.angle);
            }
            PlaneType::Junkers => {
                self.rotated_image = rotate_image(&self.image_junkers, self.angle);
            }
            PlaneType::Fokker => {
                self.rotated_image = rotate_image(&self.image_fokker, self.angle);
            }
            PlaneType::Bristol => {
                self.rotated_image = rotate_image(&self.image_bristol, self.angle);
            }
            PlaneType::Salmson => {
                self.rotated_image = rotate_image(&self.image_salmson, self.angle);
            }
            PlaneType::Sopwith => {
                self.rotated_image = rotate_image(&self.image_sopwith, self.angle);
            }
        };
    }
}
