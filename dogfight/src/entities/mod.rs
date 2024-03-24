use serde::Serialize;

pub mod container;
pub mod man;
pub mod plane;

pub type EntityId = u16;

#[derive(Serialize, Clone, Copy)]
pub enum Team {
    None,
    Allies,
    Centrals,
}

#[derive(Serialize, Clone, Copy)]
pub enum EntityType {
    Man,
    Plane,
}
