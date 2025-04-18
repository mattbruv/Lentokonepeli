use std::collections::HashMap;

use crate::network::{EntityChange, EntityChangeType, NetworkedEntity};

use super::player::ControllingEntity;
use super::player::Player;
use crate::entities::types::EntityType;
use crate::network::encoding::NetworkedBytes;
use serde::Deserialize;
use serde::Serialize;
use ts_rs::TS;

pub type EntityIdWrappedType = u16;

macro_rules! impl_from_u16 {
    ($($id_type:ident),*) => {
        $(
            #[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, TS, Deserialize)]
            #[ts(export)]
            pub struct $id_type(EntityIdWrappedType);

            impl From<EntityIdWrappedType> for $id_type {
                fn from(id: EntityIdWrappedType) -> Self {
                    $id_type(id)
                }
            }

            impl EntityId for $id_type {
                fn raw_value(self) -> u16 {
                    self.0
                }
            }

            impl NetworkedBytes for $id_type {
                fn to_bytes(&self) -> Vec<u8> {
                    let mut bytes: Vec<u8> = vec![];
                    // Extract u16 value to bytes
                    bytes.extend(self.0.to_bytes());
                    bytes
                }

                fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
                    let (bytes, val) = u16::from_bytes(bytes)?;
                    Some((bytes, Self(val)))
                }
            }
        )*
    };
}

pub trait EntityId {
    fn raw_value(self) -> u16;
}

// Use the macro for multiple ID types
impl_from_u16!(
    PlayerId,
    PlaneId, //
    BackgroundItemId,
    ManId,
    GroundId,
    CoastId,
    RunwayId,
    WaterId,
    BunkerId,
    BombId,
    ExplosionId,
    HillId,
    BulletId
);

pub struct EntityContainer<T, EntId>
where
    T: NetworkedEntity,
    EntId: From<u16> + Copy + Eq + std::hash::Hash,
{
    ent_type: EntityType,
    ids: Vec<EntId>,
    removed_ids: Vec<EntId>,
    map: HashMap<EntId, T>,
}

impl<T, EntId> EntityContainer<T, EntId>
where
    T: NetworkedEntity,
    EntId: From<u16> + Copy + Eq + std::hash::Hash + EntityId,
{
    pub fn new(ent_type: EntityType) -> EntityContainer<T, EntId> {
        let container: EntityContainer<T, EntId> = EntityContainer {
            ent_type: ent_type,
            ids: (0..2_u16.pow(9)).rev().map(EntId::from).collect(), // generate list of 0 to 2^9 = 512 Ids
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
    pub fn insert(&mut self, entity: T) -> Option<(EntId, &T)> {
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

    pub fn remove(&mut self, id: EntId) -> Option<T> {
        let ent = self.map.remove(&id);

        if let Some(_) = ent {
            self.removed_ids.push(id);
        }

        ent
    }

    pub fn get_mut(&mut self, id: EntId) -> Option<&mut T> {
        self.map.get_mut(&id)
    }

    pub fn get(&self, id: EntId) -> Option<&T> {
        self.map.get(&id)
    }

    pub fn get_map_mut(&mut self) -> &mut HashMap<EntId, T> {
        &mut self.map
    }

    pub fn get_map(&self) -> &HashMap<EntId, T> {
        &self.map
    }

    pub fn get_all_full_state(&self) -> Vec<EntityChange> {
        self.map
            .iter()
            .map(|(id, ent)| EntityChange {
                ent_type: self.ent_type,
                id: id.raw_value(),
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
                id: id.raw_value(),
                update: EntityChangeType::Properties(ent.get_changed_properties_and_reset()),
            })
            .collect();

        let removed = self.removed_ids.iter().map(|id| EntityChange {
            ent_type: self.ent_type,
            id: id.raw_value(),
            update: EntityChangeType::Deleted,
        });

        /*
        if removed.len() > 0 {
            log(&format!("ids len: {}", self.ids.len()).into());
        }
        */

        updated.extend(removed);

        // Move all removed_ids into ids to recycle them and make them available again.
        // This will clear removed_ids
        self.ids.append(&mut self.removed_ids);

        updated
    }
}

impl EntityContainer<Player, PlayerId> {
    pub fn get_player_controlling(
        &mut self,
        ent: ControllingEntity,
    ) -> Option<(&PlayerId, &mut Player)> {
        self.get_map_mut()
            .iter_mut()
            .find(|(_, p)| match p.get_controlling() {
                Some(controlled) => controlled == ent,
                None => false,
            })
    }
}
