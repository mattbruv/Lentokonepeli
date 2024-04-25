use std::collections::HashMap;

use crate::network::{EntityChange, EntityChangeType, NetworkedEntity};

use super::EntityId;
use crate::entities::types::EntityType;

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
        let container = EntityContainer {
            ent_type: ent_type,
            ids: (0..(2 as EntityId).pow(9)).rev().collect(), // generate list of 0 to 2^9 = 512 Ids
            map: HashMap::new(),
        };

        assert!(container.ids.len() <= 512);
        container
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

    pub fn get_map_mut(&mut self) -> &mut HashMap<EntityId, T> {
        &mut self.map
    }

    pub fn get_map(&self) -> &HashMap<EntityId, T> {
        &self.map
    }

    pub fn get_all_full_state(&self) -> Vec<EntityChange> {
        self.map
            .iter()
            .map(|(id, ent)| EntityChange {
                ent_type: self.ent_type,
                id: *id,
                update: EntityChangeType::Properties(ent.get_full_properties()),
            })
            .collect()
    }

    pub fn get_all_changed_state(&mut self) -> Vec<EntityChange> {
        self.map
            .iter_mut()
            .filter(|(_, ent)| ent.has_changes())
            .map(|(id, ent)| EntityChange {
                ent_type: self.ent_type,
                id: *id,
                update: EntityChangeType::Properties(ent.get_changed_properties_and_reset()),
            })
            .collect()
    }
}
