use dogfight_macros::Networked;
use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, RUNWAY, RUNWAY2},
    math::get_client_percentage,
    network::{property::*, EntityProperties, NetworkedEntity},
};

use super::{
    entity::Entity,
    types::{EntityType, Facing, Team},
};

#[derive(Debug)]
pub enum RunwayReservation {
    Takeoff = 1,
    Landing = 2,
}

// Yes, these are named like in the original, somewhat confusing
const RESERVE_TAKEOFF_LANDING_DELAY: i32 = 1000;
const RESERVE_LANDING_TAKEOFF_DELAY: i32 = 2000;
const RESERVE_LANDING_LANDING_DELAY: i32 = 1000;
const RESERVE_TAKEOFF_TAKEOFF_DELAY: i32 = 1000;

#[derive(Networked)]
pub struct Runway {
    team: Property<Team>,
    facing: Property<Facing>,
    client_x: Property<i16>,
    client_y: Property<i16>,
    client_health: Property<u8>,

    total_health: i32,
    health_timer: i32,

    last_reserve: Option<RunwayReservation>,
    reserve_timer: i32,

    image_runway: RgbaImage,
    image_runway2: RgbaImage,
}

impl Runway {
    pub fn new(team: Team, facing: Facing, x: i16, y: i16) -> Self {
        let mut runway = Runway {
            team: Property::new(team),
            facing: Property::new(facing),
            client_x: Property::new(x),
            client_y: Property::new(y),
            client_health: Property::new(0),
            total_health: 0,
            health_timer: 0,
            image_runway: get_image(RUNWAY),
            image_runway2: get_image(RUNWAY2),
            last_reserve: None,
            reserve_timer: 10_000, // setting this to a high value to allow the player to immediately take off on game load
        };

        runway.set_health(runway.get_max_health());

        runway
    }

    pub fn tick(&mut self) -> () {
        self.reserve_timer += 10;

        if self.total_health > 0 && self.total_health < self.get_max_health() {
            self.health_timer = (self.health_timer + 1) % 50;

            if self.health_timer == 0 {
                self.set_health(self.total_health + 1);
            }
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
        }

        self.client_health.set(get_client_percentage(
            self.total_health,
            self.get_max_health(),
        ));
    }

    fn get_max_health(&self) -> i32 {
        1530
    }

    pub fn get_team(&self) -> &Team {
        self.team.get()
    }

    pub fn get_client_x(&self) -> i16 {
        *self.client_x.get()
    }

    pub fn get_client_y(&self) -> i16 {
        *self.client_y.get()
    }

    pub fn get_landable_x(&self) -> i16 {
        let x = self.client_x.get();
        match self.facing.get() {
            Facing::Left => *x,
            Facing::Right => x + 65,
        }
    }

    pub fn get_landable_y(&self) -> i16 {
        self.client_y.get() + 23
    }

    pub fn get_start_x(&self) -> i16 {
        // original offsets are 15 for right facing, and 230 for left facing,
        // but these don't seem quite right, at least the left facing one.
        // probably just a difference between how planes X,Y are calculated
        // in the original vs this one.
        match self.facing.get() {
            Facing::Right => self.client_x.get() + 20,
            Facing::Left => self.client_x.get() + 255,
        }
    }

    pub fn get_facing(&self) -> Facing {
        *self.facing.get()
    }

    pub fn get_start_y(&self) -> i16 {
        self.get_landable_y()
    }

    pub fn get_landable_width(&self) -> i16 {
        self.get_image().width() as i16 - 65
    }

    fn get_image(&self) -> &RgbaImage {
        match self.facing.get() {
            Facing::Right => &self.image_runway,
            Facing::Left => &self.image_runway2,
        }
    }

    // Lentokonepeli Air traffic controller logic :)
    pub(crate) fn reserve_for(&mut self, reservation: RunwayReservation) -> bool {
        let delay = match reservation {
            RunwayReservation::Landing => {
                if let Some(RunwayReservation::Landing) = self.last_reserve {
                    RESERVE_TAKEOFF_LANDING_DELAY
                } else {
                    RESERVE_TAKEOFF_TAKEOFF_DELAY
                }
            }
            RunwayReservation::Takeoff => {
                if let Some(RunwayReservation::Takeoff) = self.last_reserve {
                    RESERVE_LANDING_TAKEOFF_DELAY
                } else {
                    RESERVE_LANDING_LANDING_DELAY
                }
            }
        };

        /*
        log(format!(
            "reserve_timer: {}, delay: {}, ",
            self.reserve_timer, delay
        ));
        */

        if self.reserve_timer < delay {
            return false;
        }

        if self.is_alive() == false {
            return false;
        }

        /*
        log(format!(
            "delay: {delay}, reservation: {:?}, last_reserve: {:?} timer: {}",
            reservation, self.last_reserve, self.reserve_timer
        ));
        */

        self.reserve_timer = 0;
        self.last_reserve = Some(reservation);
        // Clear for landing/takeoff :)
        return true;
    }
}

impl Entity for Runway {
    fn get_type(&self) -> EntityType {
        EntityType::Runway
    }
}

impl Runway {
    pub fn get_landing_bounds(&self) -> BoundingBox {
        BoundingBox {
            x: self.get_landable_x(),
            y: self.get_start_y(),
            width: self.get_landable_width(),
            height: self.get_start_y() - self.get_landable_y(),
        }
    }
}

impl SolidEntity for Runway {
    fn get_collision_bounds(&self) -> BoundingBox {
        let img = self.get_image();
        BoundingBox {
            x: *self.client_x.get(),
            y: *self.client_y.get(),
            width: img.width() as i16,
            height: img.height() as i16,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        Some(self.get_image())
    }

    fn do_rotate_collision_image(&mut self) -> () {}

    fn is_alive(&self) -> bool {
        self.total_health > 0
    }
}
