use dogfight_macros::{EnumBytes, Networked};

use crate::network::{
    property::*, EntityChange, EntityChangeType, EntityProperties, NetworkedEntity,
};

use super::types::{EntityType, Team};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS, EnumBytes)]
#[ts(export)]
pub enum WorldState {
    Intermission,
    Playing,
    PostGame,
}

#[derive(Networked)]
pub struct WorldInfo {
    #[rustfmt::skip]
    state: Property<Option::<WorldState>>,
    #[rustfmt::skip]
    winner: Property<Option::<Team>>,
    #[rustfmt::skip]
    time_left: Property<Option::<u16>>,
    centrals_score: Property<i32>,
    allies_score: Property<i32>,
}

impl WorldInfo {
    pub fn new() -> Self {
        Self {
            state: Property::new(Some(WorldState::Playing)),
            winner: Property::new(None),
            time_left: Property::new(None),
            centrals_score: Property::new(0),
            allies_score: Property::new(0),
        }
    }

    pub fn get_team_score(&self, team: Team) -> i32 {
        match team {
            Team::Centrals => *self.centrals_score.get(),
            Team::Allies => *self.allies_score.get(),
        }
    }

    pub fn get_state(&self) -> WorldState {
        self.state.get().unwrap_or(WorldState::Playing)
    }

    pub fn set_state(&mut self, state: WorldState) {
        self.state.set(Some(state));
    }

    pub fn set_winner(&mut self, winner: Option<Team>) {
        self.winner.set(winner);
    }

    pub fn set_time_left(&mut self, seconds: Option<u16>) {
        self.time_left.set(seconds);
    }

    pub fn reset_team_scores(&mut self) {
        self.centrals_score.set(0);
        self.allies_score.set(0);
    }

    pub fn adjust_team_score(&mut self, team: Team, amount: i32) {
        let score = match team {
            Team::Centrals => &mut self.centrals_score,
            Team::Allies => &mut self.allies_score,
        };
        let new = score.get() + amount;
        score.set(new);
    }

    pub fn get_all_full_state(&self) -> EntityChange {
        EntityChange {
            ent_type: EntityType::WorldInfo,
            id: 0,
            update: EntityChangeType::Properties(self.get_full_properties()),
        }
    }

    pub fn get_all_changed_state(&mut self) -> EntityChange {
        EntityChange {
            ent_type: EntityType::WorldInfo,
            id: 0,
            update: EntityChangeType::Properties(self.get_changed_properties_and_reset()),
        }
    }
}
