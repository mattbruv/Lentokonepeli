use dogfight_macros::{EnumBytes, Networked};
use euclid::{rect, Point2D, Rect};

use crate::{
    collision::{SolidEntity, WorldSpace},
    input::PlayerKeyboard,
    network::{property::*, EntityProperties, NetworkedEntity},
    world::RESOLUTION,
};

use super::types::Team;

const SPEED_PER_PIXEL: i32 = 100;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum ManState {
    Falling,
    Parachuting,
    Standing,
    WalkingLeft,
    WalkingRight,
}

#[derive(Networked)]
pub struct Man {
    x: i32,
    y: i32,

    x_speed: i32,
    y_speed: i32,

    team: Property<Team>,
    client_x: Property<i16>,
    client_y: Property<i16>,
    state: Property<ManState>,
}

impl Man {
    pub fn new(team: Team) -> Self {
        Man {
            x: 0,
            y: 0,
            team: Property::new(team),
            client_x: Property::new(0),
            client_y: Property::new(0),
            state: Property::new(ManState::Falling),
            x_speed: 1,
            y_speed: 1,
        }
    }

    pub fn tick(&mut self, keyboard: &PlayerKeyboard) -> () {
        match self.state.get() {
            ManState::Falling => self.fall(keyboard),
            ManState::Parachuting => self.parachute(keyboard),
            ManState::Standing | ManState::WalkingLeft | ManState::WalkingRight => {
                self.walk(keyboard)
            }
        }
    }

    pub fn get_x(&self) -> i32 {
        self.x
    }

    pub fn set_x(&mut self, x: i32) -> () {
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

    fn parachute(&mut self, keyboard: &PlayerKeyboard) {
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
    }

    fn walk(&mut self, keyboard: &PlayerKeyboard) {
        self.state.set(ManState::Standing);

        if keyboard.left {
            self.set_x(self.x - 100);
            self.state.set(ManState::WalkingLeft);
        }

        if keyboard.right {
            self.set_x(self.x + 100);
            self.state.set(ManState::WalkingRight);
        }
    }
}

impl SolidEntity for Man {
    fn get_team(&self) -> Team {
        *self.team.get()
    }

    fn get_collision_bounds(&self) -> Rect<i32, WorldSpace> {
        rect(self.x, self.y, 10, 10)
    }
}
