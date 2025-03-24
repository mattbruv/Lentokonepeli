use dogfight_macros::Networked;
use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, HEADQUARTER_BROKE, HEADQUARTER_GERMANS, HEADQUARTER_RAF},
    math::get_client_percentage,
    network::{property::*, EntityProperties, NetworkedEntity},
};

use super::{
    entity::Entity,
    types::{EntityType, Team},
};

#[derive(Networked)]
pub struct Bunker {
    team: Property<Team>,
    client_x: Property<i16>,
    client_y: Property<i16>,
    client_health: Property<u8>,
    total_health: i32,

    image_raf: RgbaImage,
    image_germans: RgbaImage,
    image_destroyed: RgbaImage,
}

impl Bunker {
    pub fn new(team: Team, x: i16, y: i16) -> Self {
        let mut bunker = Bunker {
            team: Property::new(team),
            client_x: Property::new(x),
            client_y: Property::new(y),
            client_health: Property::new(0),
            total_health: 0,
            image_germans: get_image(HEADQUARTER_GERMANS),
            image_raf: get_image(HEADQUARTER_RAF),
            image_destroyed: get_image(HEADQUARTER_BROKE),
        };

        bunker.set_health(bunker.get_max_health());
        bunker
    }

    fn get_max_health(&self) -> i32 {
        350
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

    pub fn subtract_health(&mut self, amount: i32) -> () {
        let new_health = self.total_health - amount;
        self.set_health(new_health);
    }

    fn get_image(&self) -> &RgbaImage {
        if self.total_health == 0 {
            &self.image_destroyed
        } else {
            match *self.team.get() {
                Team::Centrals => &self.image_germans,
                Team::Allies => &self.image_raf,
            }
        }
    }
}

impl Entity for Bunker {
    fn get_type(&self) -> EntityType {
        EntityType::Bunker
    }
}

impl SolidEntity for Bunker {
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
