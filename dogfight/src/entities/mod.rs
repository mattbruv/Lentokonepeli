pub mod container;
pub mod man;
pub mod plane;

pub type EntityId = u16;

pub enum EntityType {
    Man,
    Plane,
}
