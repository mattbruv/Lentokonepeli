pub mod container;
pub mod man;
pub mod plane;

pub type EntityId = u16;

#[derive(Clone, Copy)]
pub enum Team {
    None,
    Allies,
    Centrals,
}

pub enum EntityType {
    Man,
    Plane,
}
