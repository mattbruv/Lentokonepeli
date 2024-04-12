pub mod encoding;
pub mod property;

use serde::Serialize;
use ts_rs::TS;

use crate::entities::{man::ManProperties, plane::PlaneProperties, EntityId, EntityType};

pub trait NetworkedEntity {
    fn get_full_properties(&self) -> EntityProperties;
    fn get_changed_properties_and_reset(&mut self) -> EntityProperties;
}

pub fn state_to_json(state: Vec<EntityChange>) -> String {
    serde_json::to_string(&state).unwrap()
}

pub fn state_to_bytes(state: Vec<EntityChange>) -> Vec<u8> {
    bincode::serialize(&state).unwrap()
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub struct EntityChange {
    pub ent_type: EntityType,
    pub id: EntityId,
    pub update: EntityChangeType,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub enum EntityChangeType {
    Properties(EntityProperties),
    Deleted,
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
pub enum EntityProperties {
    Man(ManProperties),
    Plane(PlaneProperties),
}
