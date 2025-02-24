use std::f64::consts::PI;

use dogfight_macros::{EnumBytes, Networked};
use image::RgbaImage;
use serde::Deserialize;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{
        get_image, get_rotateable_image, rotate_image, PLANE4, PLANE5, PLANE6, PLANE7, PLANE8,
        PLANE9,
    },
    input::PlayerKeyboard,
    math::{get_client_percentage, radians_to_direction},
    network::{property::Property, EntityProperties, NetworkedEntity},
    tick_actions::{Action, RemoveData},
    world::RESOLUTION,
};

use super::{
    bomb::{self, Bomb},
    bullet::Bullet,
    entity::Entity,
    man::Man,
    player::ControllingEntity,
    runway::Runway,
    types::{EntityType, Facing, Team},
    EntityId,
};

const MAX_Y: i16 = -570;
// const SKY_HEIGHT: i16 = 500;

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
    player_id: EntityId,
    x: i32,
    y: i32,
    client_x: Property<i16>,
    client_y: Property<i16>,
    client_fuel: Property<u8>,
    client_ammo: Property<u8>,
    client_health: Property<u8>,
    total_bombs: Property<u8>,
    plane_type: Property<PlaneType>,
    direction: Property<u8>,
    mode: Property<PlaneMode>,
    motor_on: Property<bool>,
    flipped: Property<bool>,

    // Random shit
    last_flip_ms: i32,
    flip_delay_ms: i32,

    last_shot_ms: i32,

    last_bomb_ms: i32,
    bomb_delay_ms: i32,

    last_motor_on_ms: i32,
    motor_on_delay_ms: i32,

    total_fuel: i32,
    fuel_counter: i32,

    total_ammo: i32,
    total_health: i32,

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

    image_albatros_rotateable: RgbaImage,
    image_junkers_rotateable: RgbaImage,
    image_fokker_rotateable: RgbaImage,
    image_bristol_rotateable: RgbaImage,
    image_salmson_rotateable: RgbaImage,
    image_sopwith_rotateable: RgbaImage,

    rotated_image: RgbaImage,
}

impl Plane {
    pub fn new(
        owner_id: EntityId,
        plane_type: PlaneType,
        runway_id: EntityId,
        runway: &Runway,
    ) -> Plane {
        let mut plane = Plane {
            player_id: owner_id,
            plane_type: Property::new(plane_type),
            x: 0,
            y: 0,
            client_x: Property::new(0),
            client_y: Property::new(0),
            client_fuel: Property::new(0),
            client_ammo: Property::new(0),
            client_health: Property::new(0),
            direction: Property::new(0),
            total_bombs: Property::new(0),
            mode: Property::new(PlaneMode::Flying),
            motor_on: Property::new(true),
            flipped: Property::new(false),

            // random shit
            fuel_counter: 100,
            total_fuel: 0,

            total_ammo: 0,
            total_health: 0,

            last_flip_ms: 0,
            flip_delay_ms: 200,

            last_bomb_ms: 0,
            bomb_delay_ms: 500,

            last_shot_ms: 0,

            last_motor_on_ms: 0,
            motor_on_delay_ms: 500,

            takeoff_counter: 0,
            dodge_counter: 0,

            runway: Some(runway_id),

            // Physical Model
            air_resistance: 1.0,
            gravity: 6.0,
            gravity_pull: 0.04908738521234052,
            speed: 0.0,
            angle: 0.0, // This should probably be named radians

            image_albatros_rotateable: get_rotateable_image(PLANE4),
            image_junkers_rotateable: get_rotateable_image(PLANE5),
            image_fokker_rotateable: get_rotateable_image(PLANE6),
            image_bristol_rotateable: get_rotateable_image(PLANE7),
            image_salmson_rotateable: get_rotateable_image(PLANE8),
            image_sopwith_rotateable: get_rotateable_image(PLANE9),

            image_albatros: get_image(PLANE4),
            image_junkers: get_image(PLANE5),
            image_fokker: get_image(PLANE6),
            image_bristol: get_image(PLANE7),
            image_salmson: get_image(PLANE8),
            image_sopwith: get_image(PLANE9),

            rotated_image: get_rotateable_image(PLANE4),
        };

        plane.park(runway);

        plane.set_fuel(plane.get_max_fuel());
        plane.set_ammo(plane.get_max_ammo());
        plane.set_health(plane.get_max_health());
        plane.total_bombs.set(plane.get_max_bombs());
        plane.motor_on.set(true);
        plane.set_mode(PlaneMode::TakingOff);

        plane
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

    pub fn tick(
        &mut self,
        my_id: &EntityId,
        runway: Option<&Runway>,
        keyboard: Option<&PlayerKeyboard>,
    ) -> Vec<Action> {
        let mut actions = vec![];

        // web_sys::console::log_1(&format!("ticking plane! {:?}", self.mode.get()).into());

        // Add a tick to our counters
        self.last_bomb_ms += 10;
        self.last_flip_ms += 10;
        self.last_shot_ms += 10;
        self.last_motor_on_ms += 10;

        match self.mode.get() {
            PlaneMode::Flying => self.tick_flying(my_id, keyboard, &mut actions),
            PlaneMode::Landing => self.tick_landing(my_id, runway, &mut actions),
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

    fn park(&mut self, runway: &Runway) -> () {
        web_sys::console::log_1(&format!("start_x {}", runway.get_start_x()).into());
        self.set_client_x(runway.get_start_x());

        web_sys::console::log_1(&format!("start_y {}", runway.get_start_y()).into());
        self.set_client_y(runway.get_start_y() - self.get_bottom_height());
        web_sys::console::log_1(&format!("bottom_height {}", self.get_bottom_height()).into());

        if runway.get_facing() == Facing::Left {
            self.set_angle(PI);
            self.flipped.set(true);
        } else {
            self.set_angle(0.0);
            self.flipped.set(false);
        }

        self.speed = 0.0;
        self.fuel_counter = 100;
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
            self.runway = None;
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

    fn tick_landing(
        &mut self,
        my_id: &EntityId,
        runway: Option<&Runway>,
        actions: &mut Vec<Action>,
    ) {
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

        if let Some(r) = runway {
            let runway_x = r.get_start_x();
            let plane_x = self.get_client_x();
            let landed = match r.get_facing() {
                Facing::Right => plane_x <= runway_x,
                Facing::Left => plane_x >= runway_x,
            };

            if landed {
                actions.push(Action::RemoveEntity(RemoveData {
                    ent_id: *my_id,
                    ent_type: self.get_type(),
                }));
            }
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
            if keys.down && self.last_motor_on_ms >= self.motor_on_delay_ms && self.total_fuel > 0 {
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
        }

        self.direction.set(radians_to_direction(self.angle));

        // Process things like shooting/bombs after we've updated our coords.

        if let Some(keys) = keyboard {
            // Shoot bullets
            if keys.ctrl && (self.last_shot_ms >= self.get_shoot_delay()) && self.total_ammo > 0 {
                self.last_shot_ms = 0;
                let new_ammo_amount = self.total_ammo - 1;

                let x = *self.client_x.get();
                let y = *self.client_y.get();
                let img = self.get_image();
                let w = img.width() as i16;
                let h = img.height() as i16;

                let d3 = self.angle;
                let i3: i16 = x + ((d3.cos() * ((w / 2 + 2) as f64)) as i16);
                let i4: i16 = y + ((d3.sin() * ((h / 2 + 2) as f64)) as i16);

                /*
                i3 = (int)(this.x + this.w / 2 * 100 + Math.cos(d3) * (this.w / 2 + 2) * 100.0D) / 100;
                i4 = (int)(this.y + this.h / 2 * 100 + Math.sin(d3) * (this.h / 2 + 2) * 100.0D) / 100;
                */
                self.set_ammo(new_ammo_amount);

                actions.push(Action::SpawnBullet(Bullet::new(
                    self.player_id,
                    i3,
                    i4,
                    self.angle,
                    self.speed / 100.0,
                )));
            }

            // Bombs away
            if keys.shift && self.last_bomb_ms >= self.bomb_delay_ms && *self.total_bombs.get() > 0
            {
                self.last_bomb_ms = 0;
                self.total_bombs.set(self.total_bombs.get() - 1);

                let x = *self.client_x.get();
                let y = *self.client_y.get();
                actions.push(Action::SpawnBomb(Bomb::new(
                    self.player_id,
                    x,
                    y,
                    self.angle,
                    self.speed / 100.0,
                )));
                //
            }
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
                self.set_fuel(self.total_fuel - 1);
            }
        }
    }

    pub fn set_fuel(&mut self, fuel_amount: i32) -> () {
        self.total_fuel = fuel_amount;
        self.client_fuel
            .set(get_client_percentage(self.total_fuel, self.get_max_fuel()));
    }

    pub fn set_ammo(&mut self, ammo_amount: i32) -> () {
        self.total_ammo = ammo_amount;
        self.client_ammo
            .set(get_client_percentage(self.total_ammo, self.get_max_ammo()));
    }

    pub fn player_id(&self) -> u16 {
        self.player_id
    }

    pub fn health(&self) -> i32 {
        self.total_health
    }

    /**
     * Returns some pseudo-random value between -0.5 and +0.5
     */
    fn deterministic_rotation_value(&self) -> f64 {
        let x = *self.client_x.get();
        let y = *self.client_y.get();

        // Combine x and y into a single value, for example by using a hash-like approach
        let combined = (x as i32 * 31 + y as i32).wrapping_mul(12345);

        // Normalize the combined value to be between -0.5 and +0.5
        let normalized = (combined as f64) / i32::MAX as f64;
        normalized / 2.0
    }

    pub fn do_plane_collision(&mut self) -> () {
        // only do this if we're in flying mode
        if let PlaneMode::Flying = self.mode.get() {
            self.set_mode(PlaneMode::Dodging);

            // calculate rotation factor
            // the original game uses Math.random()
            // But we want this game to be deterministic in order to have replays one day.
            // Old:
            // PhysicalModel.access$118(this.physicalModel, (Math.random() - 0.5D) * 0.7853981633974483D);
            // Math.random() - 0.5D * (PI / 4)
            let rotation_factor = self.deterministic_rotation_value() * (PI / 4.0);

            self.angle += rotation_factor;

            self.flipped.set(!self.flipped.get());
            self.set_health(self.health() - 25);
            // TODO: add message for the player who took out this plane if health < 0
        }
    }

    pub fn subtract_health(&mut self, amount: i32) -> () {
        let new_health = self.total_health - amount;
        self.set_health(new_health);
    }

    pub fn set_health(&mut self, health_amount: i32) -> () {
        self.total_health = health_amount;

        if self.total_health < 0 {
            self.total_health = 0;
            self.mode.set(PlaneMode::Falling);
        }

        self.client_health.set(get_client_percentage(
            self.total_health,
            self.get_max_health(),
        ));
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

    pub fn set_client_x(&mut self, new_client_x: i16) -> () {
        self.x = new_client_x as i32 * RESOLUTION;
        self.client_x.set(new_client_x);
    }

    pub fn set_client_y(&mut self, new_client_y: i16) -> () {
        self.y = new_client_y as i32 * RESOLUTION;
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
        if ((facing == Facing::Right) && (self.angle == PI))
            || ((facing == Facing::Left) && (self.angle == 0.0) && (runway.reserve_for(2)))
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
        if (*self.mode.get() != PlaneMode::Landing)
            && (x > runway.get_landable_x())
            && (x + self.get_width() < runway.get_landable_x() + runway.get_landable_width())
            && (!self.motor_on.get())
            && (self.speed < 250.0 + self.get_speed_modifier())
            && (((!*self.flipped.get())
                && ((self.angle < 0.8975979010256552) || (self.angle > 5.385587406153931)))
                || ((*self.flipped.get())
                    && (self.angle < 4.039190554615448)
                    && (self.angle > 2.243994752564138)))
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
        (self.get_image().height() / 2) as i16
        // Convert the image to RGBA8 for easy pixel manipulation
        /*
        let image = self.get_image();
        let (width, height) = image.dimensions();
        web_sys::console::log_1(&format!("img width: {} height: {}", width, height).into());

        for y in (0..height).rev() {
            for x in 0..width {
                let pixel = image.get_pixel(x, y);
                if pixel[3] > 0 {
                    // Check if alpha channel is non-zero (or change condition to fit your needs)
                    return (y + 1).try_into().unwrap();
                }
            }
        }

        0 // Return 0 if no non-transparent pixels are found
        */
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

    fn get_max_bombs(&self) -> u8 {
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
        let img = self.get_collision_image().unwrap();
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
        let flip = self.flipped();

        let original_image = match self.plane_type.get() {
            PlaneType::Albatros => &self.image_albatros_rotateable,
            PlaneType::Junkers => &self.image_junkers_rotateable,
            PlaneType::Fokker => &self.image_fokker_rotateable,
            PlaneType::Bristol => &self.image_bristol_rotateable,
            PlaneType::Salmson => &self.image_salmson_rotateable,
            PlaneType::Sopwith => &self.image_sopwith_rotateable,
        };

        self.rotated_image = rotate_image(original_image, self.angle, flip);
    }

    fn is_alive(&self) -> bool {
        true
    }
}
