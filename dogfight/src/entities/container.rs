use std::collections::HashMap;

use crate::network::{EntityChange, EntityChangeType, NetworkedEntity};

use super::{player::Player, EntityId};
use crate::entities::types::EntityType;

pub struct EntityContainer<T> {
    ent_type: EntityType,
    ids: Vec<EntityId>,
    removed_ids: Vec<EntityId>,
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
            removed_ids: vec![],
            map: HashMap::new(),
        };

        assert!(container.ids.len() <= 512);
        container
    }

    /**
     * Try to insert an entity into the HashMap.
     * returns the entity if it was successfully inserted,
     * otherwise returns None
     */
    pub fn insert(&mut self, entity: T) -> Option<(EntityId, &T)> {
        // Try to get an available ID
        if let Some(id) = self.ids.pop() {
            // If an entity already exists, cancel this operation
            if let Some(_) = self.get(id) {
                self.ids.push(id);
                return None;
            }

            // This is a little weird.
            // Inserting into a hashmap returns None if nothing was there,
            // not Some(inserted_item) like I originally assumed.
            // It was backwards.
            self.map.insert(id, entity);
            return Some((id, self.get(id).unwrap()));
        }
        None
    }

    pub fn remove(&mut self, id: EntityId) -> Option<T> {
        let ent = self.map.remove(&id);

        if let Some(_) = ent {
            self.removed_ids.push(id);
        }

        ent
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
        let mut updated: Vec<EntityChange> = self
            .map
            .iter_mut()
            .filter(|(_, ent)| ent.has_changes())
            .map(|(id, ent)| EntityChange {
                ent_type: self.ent_type,
                id: *id,
                update: EntityChangeType::Properties(ent.get_changed_properties_and_reset()),
            })
            .collect();

        let removed = self.removed_ids.iter().map(|id| EntityChange {
            ent_type: self.ent_type,
            id: *id,
            update: EntityChangeType::Deleted,
        });

        /*
        if removed.len() > 0 {
            web_sys::console::log_1(&format!("ids len: {}", self.ids.len()).into());
        }
        */

        updated.extend(removed);

        // Move all removed_ids into ids to recycle them and make them available again.
        // This will clear removed_ids
        self.ids.append(&mut self.removed_ids);

        updated
    }
}

impl EntityContainer<Player> {
    pub fn get_player_controlling(
        &mut self,
        ent_type: EntityType,
        ent_id: EntityId,
    ) -> Option<(&u16, &mut Player)> {
        self.get_map_mut()
            .iter_mut()
            .find(|(_, p)| match p.get_controlling() {
                Some(controlled) => controlled.entity_type == ent_type && controlled.id == ent_id,
                None => false,
            })
    }
}
