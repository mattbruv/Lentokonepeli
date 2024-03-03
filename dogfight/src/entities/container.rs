use std::{collections::HashMap, ops::Index};

use super::EntityId;

pub struct EntityContainer<T> {
    ids: Vec<EntityId>,
    map: HashMap<EntityId, T>,
}

impl<T> EntityContainer<T> {
    pub fn new() -> EntityContainer<T> {
        EntityContainer {
            ids: (0..(2 as EntityId).pow(10)).rev().collect(),
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
