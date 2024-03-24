use crate::{
    entities::{container::EntityContainer, man::Man, plane::Plane, EntityType},
    network::EntityState,
};

pub const RESOLUTION: i32 = 100;

pub struct World {
    planes: EntityContainer<Plane>,
    men: EntityContainer<Man>,
}

impl World {
    pub fn new() -> Self {
        World {
            men: EntityContainer::new(EntityType::Man),
            planes: EntityContainer::new(EntityType::Plane),
        }
    }

    pub fn get_state() -> Vec<EntityState> {
        vec![]
    }
}
