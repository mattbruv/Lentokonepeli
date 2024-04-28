use crate::{
    input::PlayerKeyboard,
    network::{property::*, EntityProperties, NetworkedEntity},
};
use dogfight_macros::{EnumBytes, Networked};

use super::types::Team;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum PlayerState {
    ChoosingTeam,
    ChoosingRunway,
    WaitingRespawn,
    Playing,
}

#[derive(Networked)]
pub struct Player {
    shots: i32,
    hits: i32,
    team_kills: i32,

    keys: PlayerKeyboard,

    name: Property<String>,
    #[rustfmt::skip]
    clan: Property<Option::<String>>,
    #[rustfmt::skip]
    team: Property<Option::<Team>>,
    state: Property<PlayerState>,
}

impl Player {
    pub fn new(name: String) -> Self {
        Player {
            shots: 0,
            hits: 0,
            team_kills: 0,
            keys: PlayerKeyboard::new(),
            name: Property::new(name),
            clan: Property::new(None),
            team: Property::new(None),
            state: Property::new(PlayerState::ChoosingTeam),
        }
    }

    pub fn set_keys(&mut self, state: PlayerKeyboard) {
        self.keys = state
    }

    pub fn get_name(&self) -> String {
        self.name.get().clone()
    }

    pub fn set_team(&mut self, team: Option<Team>) {
        self.team.set(team);
        self.state.set(PlayerState::ChoosingRunway);
    }

    pub fn get_team(&self) -> &Option<Team> {
        self.team.get()
    }
}
