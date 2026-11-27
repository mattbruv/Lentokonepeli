use crate::inspect::{BuildingInspect, RunwayInspect};
use crate::rules::{scale_damage, GameRules};
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
    max_health: i32,
    repair_ticks: i32,
    indestructible: bool,
    damage_percent: u16,
    delay_percent: u16,

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
            max_health: 1530,
            repair_ticks: 50,
            indestructible: false,
            damage_percent: 100,
            delay_percent: 100,
            image_runway: get_image(RUNWAY),
            image_runway2: get_image(RUNWAY2),
            last_reserve: None,
            reserve_timer: 10_000, // setting this to a high value to allow the player to immediately take off on game load
        };

        runway.set_health(runway.get_max_health());

        runway
    }

    fn inspect_building(&self) -> BuildingInspect {
        let max_health = self.get_max_health();
        BuildingInspect {
            health: self.total_health,
            max_health,
            health_percent: (self.total_health * 100 / max_health) as u8,
            alive: self.total_health > 0,
            repairing: self.total_health > 0 && self.total_health < max_health,
        }
    }

    pub fn inspect(&self) -> RunwayInspect {
        RunwayInspect {
            building: self.inspect_building(),
            facing: *self.facing.get(),
            last_reservation: self.last_reserve.as_ref().map(|r| format!("{:?}", r)),
            ms_since_reservation: self.reserve_timer,
        }
    }

    pub fn reset(&mut self) {
        self.health_timer = 0;
        self.last_reserve = None;
        self.reserve_timer = 10_000;
        self.set_health(self.get_max_health());
    }

    pub fn tick(&mut self) -> () {
        self.reserve_timer += 10;

        if self.repair_ticks > 0
            && self.total_health > 0
            && self.total_health < self.get_max_health()
        {
            self.health_timer = (self.health_timer + 1) % self.repair_ticks;

            if self.health_timer == 0 {
                self.set_health(self.total_health + 1);
            }
        }
    }

    pub fn subtract_health(&mut self, amount: i32) -> bool {
        if self.total_health <= 0 || self.indestructible {
            return false;
        }
        let new_health = self.total_health - scale_damage(amount, self.damage_percent);
        self.set_health(new_health);
        self.total_health == 0
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
        self.max_health
    }

    pub fn apply_rules(&mut self, rules: &GameRules) {
        self.max_health = rules.runway_health as i32;
        self.repair_ticks = rules.repair_ticks as i32;
        self.indestructible = rules.indestructible_buildings;
        self.damage_percent = rules.damage_percent;
        self.delay_percent = rules.runway_delay_percent;
        self.reset();
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
        match self.facing.get() {
            Facing::Right => self.client_x.get() + 15,
            Facing::Left => self.client_x.get() + 230,
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
                if let Some(RunwayReservation::Landing) = self.last_reserve {
                    RESERVE_LANDING_TAKEOFF_DELAY
                } else {
                    RESERVE_LANDING_LANDING_DELAY
                }
            }
        };
        let delay = scale_damage(delay, self.delay_percent);

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
