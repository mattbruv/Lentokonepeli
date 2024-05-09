use std::sync::Arc;

use dogfight_macros::{EnumBytes, Networked};

use crate::{
    input::PlayerKeyboard,
    network::{property::*, EntityProperties, NetworkedEntity},
    world::{self, World, RESOLUTION},
};

use super::{plane::Plane, types::Team};

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

    xSpeed: i32,
    ySpeed: i32,

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
            xSpeed: 0,
            ySpeed: 0,
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
        self.set_x(self.x * self.xSpeed / SPEED_PER_PIXEL);
        self.set_y(self.y * self.ySpeed / SPEED_PER_PIXEL);
        self.xSpeed = (self.xSpeed as f32 - self.xSpeed as f32 * 0.01) as i32;
        self.ySpeed += SPEED_PER_PIXEL / 30;

        if keyboard.space {
            self.state.set(ManState::Parachuting);
        }
    }

    fn parachute(&mut self, keyboard: &PlayerKeyboard) {
        //todo!()
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
