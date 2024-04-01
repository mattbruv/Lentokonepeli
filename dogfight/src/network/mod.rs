pub mod watched;

use serde::{Deserialize, Serialize};

use crate::entities::{man::ManProperties, EntityId, EntityType};

pub trait NetworkedEntity {
    fn get_full_properties(&self) -> EntityProperties;
    fn get_changed_properties(&self) -> EntityProperties;
}

pub fn state_to_json(state: Vec<EntityState>) -> String {
    serde_json::to_string(&state).unwrap()
}

pub fn state_to_bytes(state: Vec<EntityState>) -> Vec<u8> {
    bincode::serialize(&state).unwrap()
}

#[derive(Serialize)]
pub struct EntityState {
    pub ent_type: EntityType,
    pub id: EntityId,
    pub update: EntityUpdate,
}

#[derive(Serialize)]
pub enum EntityUpdate {
    Properties(EntityProperties),
    Deleted,
}

#[derive(Serialize)]
pub enum EntityProperties {
    Man(ManProperties),
    Plane,
}
