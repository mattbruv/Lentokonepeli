use crate::network::{property::*, EntityProperties, NetworkedEntity};
use dogfight_macros::Networked;

use super::types::Team;

#[derive(Networked)]
pub struct Player {
    shots: i32,
    hits: i32,
    team_kills: i32,

    name: Property<String>,
    #[rustfmt::skip]
    clan: Property<Option::<String>>,
    #[rustfmt::skip]
    team: Property<Option::<Team>>,
}

impl Player {
    pub fn new(name: String) -> Self {
        Player {
            shots: 0,
            hits: 0,
            team_kills: 0,
            name: Property::new(name),
            clan: Property::new(None),
            team: Property::new(None),
        }
    }

    pub fn get_name(&self) -> &String {
        self.name.get()
    }

    pub fn set_team(&mut self, team: Option<Team>) {
        self.team.set(team);
    }
}
