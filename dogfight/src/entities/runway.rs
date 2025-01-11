use dogfight_macros::Networked;
use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, RUNWAY, RUNWAY2},
    network::{property::*, EntityProperties, NetworkedEntity},
};

use super::{
    entity::Entity,
    types::{EntityType, Facing, Team},
};

#[derive(Networked)]
pub struct Runway {
    team: Property<Team>,
    facing: Property<Facing>,
    client_x: Property<i16>,
    client_y: Property<i16>,

    image_runway: RgbaImage,
    image_runway2: RgbaImage,
}

impl Runway {
    pub fn new(team: Team, facing: Facing, x: i16, y: i16) -> Self {
        Runway {
            team: Property::new(team),
            facing: Property::new(facing),
            client_x: Property::new(x),
            client_y: Property::new(y),
            image_runway: get_image(RUNWAY),
            image_runway2: get_image(RUNWAY2),
        }
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
            Facing::Left => self.client_x.get() + 15,
            Facing::Right => self.client_x.get() + 230,
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

    pub(crate) fn reserve_for(&self, arg: i32) -> bool {
        // TODO: Fill this out
        true
    }
}

impl Entity for Runway {
    fn get_type(&self) -> EntityType {
        EntityType::Runway
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
}
