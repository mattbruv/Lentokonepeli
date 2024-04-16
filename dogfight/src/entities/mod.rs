use serde::Serialize;
use ts_rs::TS;

pub mod container;
pub mod flag;
pub mod man;
pub mod plane;
pub mod player;

pub type EntityId = u16;

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug, TS)]
#[ts(export)]
pub enum Team {
    Centrals = 0,
    Allies = 1,
}

#[derive(Serialize, Clone, Copy, Debug, TS)]
#[ts(export)]
pub enum EntityType {
    Man = 0,
    Plane = 1,
    Player = 2,
    Flag = 3,
}
