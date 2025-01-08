use dogfight_macros::Networked;
use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    images::{get_image, EXPLOSION0004},
    network::{property::*, EntityProperties, NetworkedEntity},
    tick_actions::{Action, RemoveData},
};

use super::{
    entity::Entity,
    types::{EntityType, Team},
    EntityId,
};

#[derive(Networked)]
pub struct Explosion {
    #[rustfmt::skip]
    team: Property<Option::<Team>>,
    client_x: Property<i16>,
    client_y: Property<i16>,

    age_ms: u32,
    phase: Property<u8>,

    do_collision: bool,

    image: RgbaImage,
}

const PHASE_TIME_MS: u32 = 70;
const TOTAL_PHASES: u32 = 8;

impl Explosion {
    pub fn new(team: Option<Team>, x: i16, y: i16) -> Self {
        Explosion {
            team: Property::new(team),
            client_x: Property::new(x),
            client_y: Property::new(y),

            age_ms: 0,
            phase: Property::new(0),

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

    pub fn tick(&mut self, my_id: EntityId) -> Vec<Action> {
        let mut actions = vec![];

        // Assuming the game is always going to run at 1 tick per 10 MS
        // as the original seemed to be designed to do.
        self.age_ms += 10;

        self.phase.set((self.age_ms / PHASE_TIME_MS) as u8);

        // If the phase just turned to 3, do collision once.
        if *self.phase.get() == 3 && self.phase.is_dirty() {
            self.do_collision = true;
        } else {
            self.do_collision = false;
        }

        // Mark this explosion to be destroyed if older than max phase.
        if self.age_ms > TOTAL_PHASES * PHASE_TIME_MS {
            actions.push(Action::RemoveEntity(RemoveData {
                ent_id: my_id,
                ent_type: self.get_type(),
            }));
        }

        actions
    }
}

impl Entity for Explosion {
    fn get_type(&self) -> EntityType {
        EntityType::Explosion
    }
}

impl SolidEntity for Explosion {
    fn get_collision_bounds(&self) -> BoundingBox {
        match self.do_collision {
            true => {
                let w = self.image.width() as i16;
                let h = self.image.height() as i16;

                BoundingBox {
                    x: *self.client_x.get() - w / 2,
                    y: *self.client_y.get() - h / 2,
                    width: w,
                    height: h,
                }
            }
            false => BoundingBox {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            },
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        Some(&self.image)
    }
}
