use serde::Serialize;
use ts_rs::TS;

#[derive(Serialize, Clone, Copy, Debug, TS)]
#[ts(export)]
pub enum EntityType {
    Man = 0,
    Plane = 1,
    Player = 2,
    Flag = 3,
    Ground = 4,
    Coast = 5,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy, TS, Serialize)]
#[ts(export)]
pub enum Terrain {
    Normal = 0,
    Desert = 1,
}

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug, TS)]
#[ts(export)]
pub enum Team {
    Centrals = 0,
    Allies = 1,
}

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug, TS)]
#[ts(export)]
pub enum Facing {
    Right = 0,
    Left = 1,
}
