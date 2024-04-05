use serde::Serialize;
use ts_rs::TS;

pub mod container;
pub mod man;
pub mod plane;

pub type EntityId = u16;

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug, TS)]
#[ts(export)]
pub enum Team {
    None,
    Allies,
    Centrals,
}

#[derive(Serialize, Clone, Copy, Debug, TS)]
#[ts(export)]
pub enum EntityType {
    Man,
    Plane,
}
