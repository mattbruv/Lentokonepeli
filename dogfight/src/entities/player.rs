use crate::network::{property::*, EntityProperties, NetworkedEntity};
use dogfight_macros::Networked;

#[derive(Networked)]
pub struct Player {
    shots: i32,
    hits: i32,
    team_kills: i32,

    name: Property<String>,
    #[rustfmt::skip]
    clan: Property<Option::<String>>,
}

impl Player {
    pub fn new(name: String) -> Self {
        Player {
            shots: 0,
            hits: 0,
            team_kills: 0,
            name: Property::new(name),
            clan: Property::new(None),
        }
    }
}
