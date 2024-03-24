use crate::{
    network::{ChangedState, FullState, NetworkedEntity},
    world::RESOLUTION,
};

use super::Team;

pub enum ManState {}
pub struct Man {
    team: Team,
    x: i32,
    y: i32,
    client_x: i16,
    client_y: i16,
}

impl Man {
    pub fn new(team: Team) -> Self {
        Man {
            team: team,
            x: 0,
            y: 0,
            client_x: 0,
            client_y: 0,
        }
    }
}

pub struct ManChangedState {
    delta_x: i8,
    delta_y: i8,
}

pub struct ManFullState {
    team: Team,
    x: i16,
    y: i16,
}

impl NetworkedEntity for Man {
    fn get_full_state(&self) -> FullState {
        FullState::Man(ManFullState {
            team: self.team,
            x: (self.x / RESOLUTION) as i16,
            y: (self.y / RESOLUTION) as i16,
        })
    }

    fn get_changed_state(&self) -> ChangedState {
        ChangedState::Man(ManChangedState {
            delta_x: -10,
            delta_y: 10,
        })
    }
}
