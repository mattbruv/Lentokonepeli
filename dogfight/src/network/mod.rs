pub mod property;

use serde::Serialize;
use ts_rs::TS;

use crate::entities::{man::ManProperties, plane::PlaneProperties, EntityId, EntityType};

pub trait NetworkedEntity {
    fn get_full_properties(&self) -> EntityProperties;
    fn get_changed_properties_and_reset(&mut self) -> EntityProperties;
}

pub trait NetworkedProperties {
    fn to_bytes(&self) -> Vec<u8>;
    // fn from_bytes(bytes: Vec<u8>) -> Self;
}

/**
 * This funciton is used to create the header bytes to tell
 * if properties of an object are changed/included in the binary data or not.
 * It takes a vector of properties in order,
 * each boolean representing if that property is set or not
 * and returns this data smushed into bytes
 */
pub fn property_header_bytes(is_property_set_vector: Vec<bool>) -> Vec<u8> {
    let byte_vector: Vec<u8> = is_property_set_vector
        .chunks(8)
        .map(|chunk| {
            chunk
                .iter()
                .enumerate()
                .fold(0u8, |byte, (i, &property_is_set)| {
                    if property_is_set {
                        byte | (1 << i)
                    } else {
                        byte
                    }
                })
        })
        .collect();

    byte_vector
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
