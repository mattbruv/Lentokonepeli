use dogfight_macros::{EnumBytes, Networked};
use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    game_event::{KillEvent, KillMethod},
    images::{get_image, PARACHUTER0, PARACHUTER1},
    input::PlayerKeyboard,
    network::{property::*, EntityProperties, NetworkedEntity},
    tick_actions::{Action, ExplosionData, ManShootData, RemoveData},
    world::RESOLUTION,
};

use super::{
    container::{ManId, PlayerId},
    entity::Entity,
    types::{EntityType, Team},
};

const SPEED_PER_PIXEL: i32 = 100;

const INVULNERABILITY_TIME: u32 = 200;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum ManState {
    Falling,
    Parachuting,
    Standing,
    WalkingLeft,
    WalkingRight,
}

const SHOOT_DELAY_MS: u32 = 500;

#[derive(Networked)]
pub struct Man {
    x: i32,
    y: i32,

    previous_x: i32,

    x_speed: i32,
    y_speed: i32,

    team: Property<Team>,
    client_x: Property<i16>,
    client_y: Property<i16>,
    state: Property<ManState>,

    image_standing: RgbaImage,
    image_parachuting: RgbaImage,

    age_ms: u32,

    last_shot_ms: u32,
}

impl Man {
    pub fn new(team: Team) -> Self {
        Man {
            x: 0,
            y: 0,
            previous_x: 0,
            team: Property::new(team),
            client_x: Property::new(0),
            client_y: Property::new(0),
            state: Property::new(ManState::Falling),
            x_speed: 1,
            y_speed: 1,
            image_standing: get_image(PARACHUTER0),
            image_parachuting: get_image(PARACHUTER1),
            age_ms: 0,
            last_shot_ms: SHOOT_DELAY_MS,
        }
    }

    pub fn past_grace_period(&self) -> bool {
        self.age_ms > INVULNERABILITY_TIME
    }

    pub fn tick(
        &mut self,
        my_owner: PlayerId,
        man_id: ManId,
        keyboard: &PlayerKeyboard,
    ) -> Vec<Action> {
        let mut actions = vec![];

        self.age_ms += 10;
        self.last_shot_ms += 10;

        match self.state.get() {
            ManState::Falling => self.fall(keyboard),
            ManState::Parachuting => self.parachute(my_owner, man_id, keyboard, &mut actions),
            ManState::Standing | ManState::WalkingLeft | ManState::WalkingRight => {
                self.walk(my_owner, man_id, keyboard, &mut actions)
            }
        }

        actions
    }

    pub fn get_x(&self) -> i32 {
        self.x
    }

    pub fn set_x(&mut self, x: i32) -> () {
        self.previous_x = self.x;
        self.x = x;
        self.client_x.set((x / RESOLUTION) as i16);
    }

    pub fn get_client_x(&self) -> i16 {
        *self.client_x.get()
    }

    pub fn get_client_y(&self) -> i16 {
        *self.client_y.get()
    }

    pub fn set_client_x(&mut self, client_x: i16) -> () {
        self.x = client_x as i32 * RESOLUTION;
        self.client_x.set(client_x);
    }

    pub fn get_y(&self) -> i32 {
        self.y
    }

    pub fn set_y(&mut self, y: i32) -> () {
        self.y = y;
        self.client_y.set((y / RESOLUTION) as i16);
    }

    pub fn get_state(&self) -> ManState {
        *self.state.get()
    }

    pub fn set_state(&mut self, new_state: ManState) {
        self.y_speed = 1;
        self.state.set(new_state);
    }

    pub fn set_client_y(&mut self, client_y: i16) -> () {
        self.y = client_y as i32 * RESOLUTION;
        self.client_y.set(client_y);
    }

    fn fall(&mut self, keyboard: &PlayerKeyboard) {
        self.set_x(self.x + (RESOLUTION * self.x_speed / SPEED_PER_PIXEL));
        self.set_y(self.y + (RESOLUTION * self.y_speed / SPEED_PER_PIXEL));
        self.x_speed = (self.x_speed as f64 - self.x_speed as f64 * 0.01) as i32;
        self.y_speed += SPEED_PER_PIXEL / 30;

        if keyboard.space {
            self.state.set(ManState::Parachuting);
        }
    }

    fn parachute(
        &mut self,
        my_owner: PlayerId,
        man_id: ManId,
        keyboard: &PlayerKeyboard,
        actions: &mut Vec<Action>,
    ) {
        self.set_x(self.x + (RESOLUTION * self.x_speed / SPEED_PER_PIXEL));
        self.set_y(self.y + (RESOLUTION * self.y_speed / SPEED_PER_PIXEL));
        self.x_speed = (self.x_speed as f64 - self.x_speed as f64 * 0.01) as i32;
        self.y_speed = (self.y_speed as f64 - self.y_speed as f64 * 0.05) as i32;

        if self.y_speed < SPEED_PER_PIXEL {
            self.y_speed = SPEED_PER_PIXEL;
        }

        if keyboard.left {
            self.set_x(self.x - 100);
        }

        if keyboard.right {
            self.set_x(self.x + 100);
        }

        // If we're shooting
        if keyboard.ctrl && self.last_shot_ms >= SHOOT_DELAY_MS {
            self.last_shot_ms = 0;
            actions.push(Action::ManShootBullet(ManShootData {
                player_id: my_owner,
                man_ent_id: man_id,
            }));
        }
    }

    fn walk(
        &mut self,
        my_owner: PlayerId,
        man_id: ManId,
        keyboard: &PlayerKeyboard,
        actions: &mut Vec<Action>,
    ) {
        self.state.set(ManState::Standing);

        if keyboard.left {
            self.set_x(self.x - 100);
            self.state.set(ManState::WalkingLeft);

            if self.get_client_x() < -20_000 {
                self.blow_me_up(my_owner, actions, man_id);
            }
        }

        if keyboard.right {
            self.set_x(self.x + 100);
            self.state.set(ManState::WalkingRight);

            if self.get_client_x() > 20_000 {
                self.blow_me_up(my_owner, actions, man_id);
            }
        }

        if keyboard.shift {
            self.blow_me_up(my_owner, actions, man_id);
        }

        // If we're shooting
        if keyboard.ctrl && self.last_shot_ms >= SHOOT_DELAY_MS {
            self.last_shot_ms = 0;

            actions.push(Action::ManShootBullet(ManShootData {
                man_ent_id: man_id,
                player_id: my_owner,
            }));
        }
    }

    fn blow_me_up(&mut self, my_owner: PlayerId, actions: &mut Vec<Action>, man_id: ManId) {
        actions.push(Action::RemoveEntity(RemoveData::Man(man_id)));

        // We don't want the top left corner, but rather bottom middle
        let x = self.client_x.get() + (self.image_standing.width() / 2) as i16;
        let y = self.client_y.get() + (self.image_standing.height()) as i16;

        // log(format!("x: {}, y: {}", x, y));
        actions.push(Action::RegisterKill(KillEvent::new(
            my_owner,
            None,
            KillMethod::Man,
        )));
        actions.push(Action::Explosion(ExplosionData {
            explosion_owner: Some(my_owner),
            team: Some(*self.team.get()),
            client_x: x,
            client_y: y,
        }));
    }

    pub fn die_from_fall(&self) -> bool {
        // log(self.y_speed.to_string());
        (self.y_speed as f64) >= (SPEED_PER_PIXEL as f64) * 1.5
    }

    pub fn get_team(&self) -> Team {
        *self.team.get()
    }

    pub fn set_to_previous_x(&mut self) -> () {
        self.set_x(self.previous_x);
    }
}

impl Entity for Man {
    fn get_type(&self) -> EntityType {
        EntityType::Man
    }
}

impl SolidEntity for Man {
    fn get_collision_bounds(&self) -> BoundingBox {
        BoundingBox {
            x: (self.x / RESOLUTION) as i16,
            y: (self.y / RESOLUTION) as i16,
            width: self.image_parachuting.width() as i16,
            height: self.image_parachuting.height() as i16,
        }
    }

    fn get_collision_image(&self) -> Option<&RgbaImage> {
        match self.state.get() {
            ManState::Parachuting => Some(&self.image_parachuting),
            _ => Some(&self.image_standing),
        }
    }

    fn do_rotate_collision_image(&mut self) -> () {}

    fn is_alive(&self) -> bool {
        true
    }
}
