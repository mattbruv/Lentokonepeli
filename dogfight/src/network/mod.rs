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
        let team = match bytes[0] {
            0 => Team::None,
            1 => Team::Allies,
            2 => Team::Centrals,
            _ => panic!("Unrecognized team byte: {}", bytes[0]),
        };
        (&bytes[1..], team)
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

impl NetworkedBytes for u8 {
    fn to_bytes(&self) -> Vec<u8> {
        u8::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let value = u8::from_le_bytes(bytes[..1].try_into().unwrap());
        (&bytes[1..], value)
    }
}

impl NetworkedBytes for i8 {
    fn to_bytes(&self) -> Vec<u8> {
        i8::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let value = i8::from_le_bytes(bytes[..1].try_into().unwrap());
        (&bytes[1..], value)
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

pub fn parse_property_header_bytes(header_bytes: &[u8], num_bytes: usize) -> (Vec<bool>, &[u8]) {
    let mut properties = Vec::new();
    let mut remaining_bytes = header_bytes;

    for _ in 0..num_bytes {
        let byte = remaining_bytes.get(0).copied().unwrap_or(0);
        for i in 0..8 {
            properties.push(byte & (1 << i) != 0);
        }
        remaining_bytes = &remaining_bytes[1..];
    }

    (properties, remaining_bytes)
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
