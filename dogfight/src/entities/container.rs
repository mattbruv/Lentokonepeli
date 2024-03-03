use std::collections::HashMap;

use super::EntityId;

pub struct EntityContainer<T> {
    ids: Vec<EntityId>,
    map: HashMap<EntityId, T>,
}

impl<T> EntityContainer<T> {
    pub fn new() -> EntityContainer<T> {
        EntityContainer {
            ids: (0..(2 as u16).pow(10)).rev().collect(),
            map: HashMap::new(),
        }
    }
}
