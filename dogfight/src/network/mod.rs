pub mod property;

use std::io::Read;

use serde::Serialize;
use ts_rs::TS;

use crate::entities::{man::ManProperties, plane::PlaneProperties, EntityId, EntityType, Team};

pub trait NetworkedEntity {
    fn get_full_properties(&self) -> EntityProperties;
    fn get_changed_properties_and_reset(&mut self) -> EntityProperties;
}

pub trait NetworkedBytes {
    fn to_bytes(&self) -> Vec<u8>;
    fn from_bytes(bytes: &[u8]) -> (&[u8], Self);
}

impl NetworkedBytes for Team {
    fn to_bytes(&self) -> Vec<u8> {
        vec![*self as u8]
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        todo!()
    }
}

impl NetworkedBytes for i16 {
    fn to_bytes(&self) -> Vec<u8> {
        i16::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let value = i16::from_le_bytes(bytes[..2].try_into().unwrap());
        (&bytes[2..], value)
    }
}

impl NetworkedBytes for i32 {
    fn to_bytes(&self) -> Vec<u8> {
        i32::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let value = i32::from_le_bytes(bytes[..4].try_into().unwrap());
        (&bytes[4..], value)
    }
}

/**
 * This funciton is used to create the header bytes to tell
 * if properties of an object are changed/included in the binary data or not.
 * It takes a vector of booleans represeting the set state of each property in order,
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
