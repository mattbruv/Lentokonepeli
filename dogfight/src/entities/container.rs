use std::collections::HashMap;

use super::EntityId;

pub struct EntityContainer<T> {
    ids: Vec<EntityId>,
    map: HashMap<EntityId, T>,
}

impl<T> EntityContainer<T> {
    pub fn new() -> EntityContainer<T> {
        EntityContainer {
            ids: (0..(2 as EntityId).pow(10)).rev().collect(), // generate list of 0 to 2^10 = 1024 Ids
            map: HashMap::new(),
        }
    }

    pub fn get_mut(&mut self, id: EntityId) -> Option<&mut T> {
        self.map.get_mut(&id)
    }

    pub fn get(&self, id: EntityId) -> Option<&T> {
        self.map.get(&id)
    }
}
