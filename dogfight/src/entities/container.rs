use std::collections::HashMap;

use crate::network::{EntityState, EntityUpdate, NetworkedEntity};

use super::{EntityId, EntityType};

pub struct EntityContainer<T> {
    ent_type: EntityType,
    ids: Vec<EntityId>,
    map: HashMap<EntityId, T>,
}

impl<T> EntityContainer<T>
where
    T: NetworkedEntity,
{
    pub fn new(ent_type: EntityType) -> EntityContainer<T> {
        EntityContainer {
            ent_type: ent_type,
            ids: (0..(2 as EntityId).pow(10)).rev().collect(), // generate list of 0 to 2^10 = 1024 Ids
            map: HashMap::new(),
        }
    }

    pub fn insert(&mut self, ent: T) -> Option<&T> {
        // Try to get an available ID
        if let Some(id) = self.ids.pop() {
            // If the entity is inserted, return it
            if let Some(_) = self.map.insert(id, ent) {
                return self.get(id);
            }
            return None;
        }
        None
    }

    pub fn remove(&mut self, id: EntityId) -> Option<T> {
        self.map.remove(&id)
    }

    pub fn get_mut(&mut self, id: EntityId) -> Option<&mut T> {
        self.map.get_mut(&id)
    }

    pub fn get(&self, id: EntityId) -> Option<&T> {
        self.map.get(&id)
    }

    pub fn get_all_full_state(&self) -> Vec<EntityState> {
        self.map
            .iter()
            .map(|(id, ent)| EntityState {
                ent_type: self.ent_type,
                id: *id,
                update: EntityUpdate::Properties(ent.get_full_properties()),
            })
            .collect()
    }
}
