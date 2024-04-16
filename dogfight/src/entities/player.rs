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
