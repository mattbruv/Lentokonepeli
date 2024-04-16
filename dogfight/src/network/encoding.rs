use crate::{
    entities::{
        man::ManProperties, plane::PlaneProperties, player::PlayerProperties, EntityType, Team,
    },
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
                EntityProperties::Player(player) => player.to_bytes(),
            },
            _ => vec![],
        };

        // If nothing was encoded, don't return anything.
        if data_encoded.len() <= 1 {
            return vec![];
        }

        encoded.extend(data_encoded);

        encoded
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let (mut bytes, header) = u16::from_bytes(bytes);

        let update_type = header & 1;

        let ent_type_bitmask: u16 = 0b1111_1100_0000_0000;
        let ent_type = entity_type_from_u8(((header & ent_type_bitmask) >> 10) as u8);

        let ent_id_bitmask: u16 = 0b0000_0011_1111_1110;
        let entity_id = (header & ent_id_bitmask) >> 1;

        let update: EntityChangeType = match update_type {
            0 => EntityChangeType::Deleted,

            // for each possible type:
            // parse the properties from bytes,
            // advance the byte array,
            // and return the new struct
            1 => match ent_type {
                EntityType::Man => {
                    let (slice, props) = ManProperties::from_bytes(bytes);
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Man(props))
                }
                EntityType::Plane => {
                    let (slice, props) = PlaneProperties::from_bytes(bytes);
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Plane(props))
                }
                EntityType::Player => {
                    let (slice, props) = PlayerProperties::from_bytes(bytes);
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Player(props))
                }
            },
            _ => panic!("Unknown entity change type {}", update_type),
        };

        let change: EntityChange = EntityChange {
            ent_type: ent_type,
            id: entity_id,
            update: update,
        };

        (bytes, change)
    }
}

fn entity_type_from_u8(byte: u8) -> EntityType {
    match byte {
        0 => EntityType::Man,
        1 => EntityType::Plane,
        _ => panic!("Unrecognized entity type: {}", byte),
    }
}

impl NetworkedBytes for EntityType {
    fn to_bytes(&self) -> Vec<u8> {
        vec![*self as u8]
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let ent_type = entity_type_from_u8(bytes[0]);
        (&bytes[1..], ent_type)
    }
}

impl<T: NetworkedBytes> NetworkedBytes for Option<T> {
    fn to_bytes(&self) -> Vec<u8> {
        match self {
            Some(thing) => {
                let mut bytes = vec![1];
                bytes.extend(thing.to_bytes());
                bytes
            }
            None => vec![0],
        }
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let (bytes, is_some) = u8::from_bytes(bytes);

        match is_some {
            1 => {
                let (bytes, thing) = T::from_bytes(bytes);
                (bytes, Some(thing))
            }
            _ => (bytes, None),
        }
    }
}

impl NetworkedBytes for String {
    fn to_bytes(&self) -> Vec<u8> {
        let bytes = self.as_bytes();
        let mut len = (bytes.len() as u32).to_bytes();
        len.extend(bytes);

        len
    }
    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let (bytes, len) = u32::from_bytes(bytes);
        let slice = &bytes[0..len as usize];
        let string_value = std::str::from_utf8(slice).unwrap();

        (&bytes[len as usize..], string_value.into())
    }
}

impl NetworkedBytes for Team {
    fn to_bytes(&self) -> Vec<u8> {
        vec![*self as u8]
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let team = match bytes[0] {
            0 => Team::Centrals,
            1 => Team::Allies,
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

impl NetworkedBytes for u16 {
    fn to_bytes(&self) -> Vec<u8> {
        u16::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let value = u16::from_le_bytes(bytes[..2].try_into().unwrap());
        (&bytes[2..], value)
    }
}

impl NetworkedBytes for u32 {
    fn to_bytes(&self) -> Vec<u8> {
        u32::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let value = u32::from_le_bytes(bytes[..4].try_into().unwrap());
        (&bytes[4..], value)
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
