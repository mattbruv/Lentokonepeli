use crate::{
    entities::{EntityType, Team},
    network::EntityChangeType,
};

use super::{EntityChange, EntityProperties};

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

pub trait NetworkedBytes {
    fn to_bytes(&self) -> Vec<u8>;
    fn from_bytes(bytes: &[u8]) -> (&[u8], Self);
}

impl NetworkedBytes for EntityChange {
    fn to_bytes(&self) -> Vec<u8> {
        let ent_type_bytes = self.ent_type.to_bytes();
        let ent_type_u8 = ent_type_bytes.first().unwrap();
        let update_type: u8 = match self.update {
            EntityChangeType::Deleted => 0,
            EntityChangeType::Properties(_) => 1,
        };

        let mut header: u16 = 0;

        // set entity type as far left 6 bits
        header |= (*ent_type_u8 as u16) << 10;

        // set the entity ID, 9 bits wide
        header |= self.id << 1;

        // add update type as a single bit at bit 0
        header |= update_type as u16;

        let header_bytes = u16::to_le_bytes(header);

        let mut encoded = vec![];
        encoded.extend(header_bytes);

        let data_encoded: Vec<u8> = match &self.update {
            EntityChangeType::Properties(props) => match props {
                EntityProperties::Man(man) => man.to_bytes(),
                EntityProperties::Plane(plane) => plane.to_bytes(),
            },
            _ => vec![],
        };

        encoded.extend(data_encoded);

        encoded
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        todo!()
    }
}

impl NetworkedBytes for EntityType {
    fn to_bytes(&self) -> Vec<u8> {
        vec![*self as u8]
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let ent_type = match bytes[0] {
            0 => EntityType::Man,
            1 => EntityType::Plane,
            _ => panic!("Unrecognized entity type: {}", bytes[0]),
        };
        (&bytes[1..], ent_type)
    }
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
