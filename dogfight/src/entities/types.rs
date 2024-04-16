use crate::network::encoding::NetworkedBytes;
use dogfight_macros::EnumBytes;
use serde::Serialize;
use ts_rs::TS;

#[derive(Serialize, Clone, Copy, Debug, TS, EnumBytes)]
#[ts(export)]
pub enum EntityType {
    Man,
    Plane,
    Player,
    Flag,
    Ground,
    Coast,
    Runway,
    Water,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy, TS, Serialize, EnumBytes)]
#[ts(export)]
pub enum Terrain {
    Normal = 0,
    Desert = 1,
}

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug, TS, EnumBytes)]
#[ts(export)]
pub enum Team {
    Centrals = 0,
    Allies = 1,
}

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug, TS, EnumBytes)]
#[ts(export)]
pub enum Facing {
    Right = 0,
    Left = 1,
}
