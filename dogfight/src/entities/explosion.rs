use dogfight_macros::Networked;
use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, EXPLOSION0004},
    network::{property::*, EntityProperties, NetworkedEntity},
};

use super::{
    entity::Entity,
    types::{EntityType, Team},
};

#[derive(Networked)]
pub struct Explosion {
    #[rustfmt::skip]
    team: Property<Option::<Team>>,
    client_x: Property<i16>,
    client_y: Property<i16>,

    do_collision: bool,

    image: RgbaImage,
}

impl Explosion {
    pub fn new(team: Option<Team>, x: i16, y: i16) -> Self {
        Explosion {
            team: Property::new(team),
            client_x: Property::new(x),
            client_y: Property::new(y),
            do_collision: false,

            image: get_image(EXPLOSION0004),
        }
    }

    /*
       The original game has weird internal state which controls
       whether or not the explosion should have collision detection.
       In our case, we can just have a method and not do any calculations
       for explosions which aren't ready.
    */
    pub fn do_collision_check(&self) -> bool {
        self.do_collision
    }

    pub fn get_team(&self) -> &Option<Team> {
        self.team.get()
    }

    pub fn get_client_x(&self) -> i16 {
        *self.client_x.get()
    }

    pub fn get_client_y(&self) -> i16 {
        *self.client_y.get()
    }
}

impl Entity for Explosion {
    fn get_type(&self) -> EntityType {
        EntityType::Runway
    }
}

impl SolidEntity for Explosion {
    fn get_collision_bounds(&self) -> BoundingBox {
        let w = self.image.width() as i16;
        let h = self.image.height() as i16;

        BoundingBox {
            x: *self.client_x.get() - w / 2,
            y: *self.client_y.get() - h / 2,
            width: w,
            height: h,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        Some(&self.image)
    }
}
