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
    BackgroundItem,
    Ground,
    Coast,
    Runway,
    Water,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy, TS, Serialize, EnumBytes)]
#[ts(export)]
pub enum BackgroundItemType {
    FlagCentrals,
    FlagAllies,
    ControlTower,
    DesertTower,
    PalmTree,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy, TS, Serialize, EnumBytes)]
#[ts(export)]
pub enum Terrain {
    Normal,
    Desert,
}

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug, TS, EnumBytes)]
#[ts(export)]
pub enum Team {
    Centrals,
    Allies,
}

#[derive(Serialize, Clone, Copy, PartialEq, Eq, Debug, TS, EnumBytes)]
#[ts(export)]
pub enum Facing {
    Right,
    Left,
}
