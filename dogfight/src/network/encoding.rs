use std::collections::BTreeMap;

use crate::{
    entities::{
        background_item::BackgroundItemProperties,
        bomb::BombProperties,
        bullet::BulletProperties,
        bunker::BunkerProperties,
        coast::CoastProperties,
        container::RunwayId,
        explosion::ExplosionProperties,
        ground::GroundProperties,
        hill::HillProperties,
        man::ManProperties,
        plane::{PlaneProperties, PlaneType},
        player::PlayerProperties,
        runway::RunwayProperties,
        types::{EntityType, Team},
        water::WaterProperties,
        world_info::WorldInfoProperties,
    },
    input::{AddPlayerData, PlayerCommand, PlayerKeyboard, RunwaySelection, TeamSelection},
    network::EntityChangeType,
    world::World,
};

use super::{EntityChange, EntityProperties, NetworkedEntity};

/**
 * This function is used to create the header bytes to tell
 * if properties of an object are changed/included in the binary data or not.
 * It takes a vector of booleans representing the set state of each property in order,
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
    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized;
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
                EntityProperties::BackgroundItem(bg_item) => bg_item.to_bytes(),
                EntityProperties::Ground(ground) => ground.to_bytes(),
                EntityProperties::Coast(coast) => coast.to_bytes(),
                EntityProperties::Runway(runway) => runway.to_bytes(),
                EntityProperties::Water(water) => water.to_bytes(),
                EntityProperties::Bunker(bunker) => bunker.to_bytes(),
                EntityProperties::WorldInfo(world_info) => world_info.to_bytes(),
                EntityProperties::Bomb(bomb) => bomb.to_bytes(),
                EntityProperties::Explosion(explosion) => explosion.to_bytes(),
                EntityProperties::Hill(hill) => hill.to_bytes(),
                EntityProperties::Bullet(bullet) => bullet.to_bytes(),
            },
            _ => vec![],
        };

        // If nothing was encoded, don't return anything.
        //      if data_encoded.len() <= 1 {
        //          return vec![];
        //      }

        encoded.extend(data_encoded);

        encoded
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let (mut bytes, header) = u16::from_bytes(bytes)?;

        let update_type = header & 1;

        let ent_type_bitmask: u16 = 0b1111_1100_0000_0000;
        let ent_byte = ((header & ent_type_bitmask) >> 10) as u8;
        let slice = vec![ent_byte];
        let (_, ent_type) = EntityType::from_bytes(&slice)?;

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
                    let (slice, props) = ManProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Man(props))
                }
                EntityType::Plane => {
                    let (slice, props) = PlaneProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Plane(props))
                }
                EntityType::Player => {
                    let (slice, props) = PlayerProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Player(props))
                }
                EntityType::BackgroundItem => {
                    let (slice, props) = BackgroundItemProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::BackgroundItem(props))
                }
                EntityType::Ground => {
                    let (slice, props) = GroundProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Ground(props))
                }
                EntityType::Coast => {
                    let (slice, props) = CoastProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Coast(props))
                }
                EntityType::Runway => {
                    let (slice, props) = RunwayProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Runway(props))
                }
                EntityType::Water => {
                    let (slice, props) = WaterProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Water(props))
                }
                EntityType::Bunker => {
                    let (slice, props) = BunkerProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Bunker(props))
                }
                EntityType::WorldInfo => {
                    let (slice, props) = WorldInfoProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::WorldInfo(props))
                }
                EntityType::Bomb => {
                    let (slice, props) = BombProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Bomb(props))
                }
                EntityType::Explosion => {
                    let (slice, props) = ExplosionProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Explosion(props))
                }
                EntityType::Hill => {
                    let (slice, props) = HillProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Hill(props))
                }
                EntityType::Bullet => {
                    let (slice, props) = BulletProperties::from_bytes(bytes)?;
                    bytes = slice;
                    EntityChangeType::Properties(EntityProperties::Bullet(props))
                }
            },
            _ => panic!("Unknown entity change type {}", update_type),
        };

        let change: EntityChange = EntityChange {
            ent_type: ent_type,
            id: entity_id,
            update: update,
        };

        Some((bytes, change))
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

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let (bytes, is_some) = u8::from_bytes(bytes)?;

        match is_some {
            1 => {
                let (bytes, thing) = T::from_bytes(bytes)?;
                Some((bytes, Some(thing)))
            }
            _ => Some((bytes, None)),
        }
    }
}

impl<T: NetworkedBytes> NetworkedBytes for Vec<T> {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes: Vec<u8> = vec![];

        let length: u16 = self.len() as u16;
        bytes.extend(length.to_bytes());
        for entry in self.iter() {
            bytes.extend(entry.to_bytes());
        }

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (bytes, length) = u16::from_bytes(bytes)?; // Extract the length

        let mut remaining_bytes = bytes;
        let mut vec = Vec::with_capacity(length as usize);

        for _ in 0..length {
            let (new_bytes, entry) = T::from_bytes(remaining_bytes)?;
            remaining_bytes = new_bytes;
            vec.push(entry);
        }

        Some((remaining_bytes, vec))
    }
}

impl NetworkedBytes for String {
    fn to_bytes(&self) -> Vec<u8> {
        let bytes = self.as_bytes();
        let mut len = (bytes.len() as u32).to_bytes();
        len.extend(bytes);

        len
    }
    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let (bytes, len) = u32::from_bytes(bytes)?;
        let slice = bytes.get(0..len as usize)?;
        let string_value = std::str::from_utf8(slice).ok()?;

        Some((
            bytes.get(len as usize..).unwrap_or(&[]),
            string_value.into(),
        ))
    }
}

impl NetworkedBytes for i16 {
    fn to_bytes(&self) -> Vec<u8> {
        i16::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let value = i16::from_le_bytes(bytes.get(..2)?.try_into().ok()?);
        Some((&bytes[2..], value))
    }
}

impl NetworkedBytes for u16 {
    fn to_bytes(&self) -> Vec<u8> {
        u16::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let value = u16::from_le_bytes(bytes.get(..2)?.try_into().ok()?);
        Some((&bytes[2..], value))
    }
}

impl NetworkedBytes for u32 {
    fn to_bytes(&self) -> Vec<u8> {
        u32::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let value = u32::from_le_bytes(bytes.get(..4)?.try_into().ok()?);
        Some((&bytes[4..], value))
    }
}

impl NetworkedBytes for i32 {
    fn to_bytes(&self) -> Vec<u8> {
        i32::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let value = i32::from_le_bytes(bytes.get(..4)?.try_into().ok()?);
        Some((&bytes[4..], value))
    }
}

impl<K: NetworkedBytes + Ord, V: NetworkedBytes> NetworkedBytes for BTreeMap<K, V> {
    fn to_bytes(&self) -> Vec<u8> {
        let len = self.len() as u32;
        let mut bytes = vec![];

        bytes.extend(len.to_bytes());

        for (key, value) in self.iter() {
            bytes.extend(key.to_bytes());
            bytes.extend(value.to_bytes());
        }

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let mut btree_map = BTreeMap::new();

        let (bytes, length) = u32::from_bytes(bytes)?;

        let mut slice = bytes;

        for _ in 0..length {
            let (bytes, guid) = K::from_bytes(slice)?;
            let (bytes, index) = V::from_bytes(bytes)?;
            btree_map.insert(guid, index);
            slice = bytes
        }

        Some((slice, btree_map))
    }
}

impl NetworkedBytes for u8 {
    fn to_bytes(&self) -> Vec<u8> {
        u8::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let value = u8::from_le_bytes(bytes.get(..1)?.try_into().ok()?);
        Some((&bytes[1..], value))
    }
}

impl NetworkedBytes for bool {
    fn to_bytes(&self) -> Vec<u8> {
        vec![if *self { 1 } else { 0 }]
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let value = bytes[0] != 0;
        Some((&bytes[1..], value))
    }
}

impl NetworkedBytes for i8 {
    fn to_bytes(&self) -> Vec<u8> {
        i8::to_le_bytes(*self).into()
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let value = i8::from_le_bytes(bytes.get(..1)?.try_into().ok()?);
        Some((&bytes[1..], value))
    }
}

impl NetworkedBytes for PlayerCommand {
    /*
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
    */
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];

        match self {
            PlayerCommand::PlayerKeyboard(player_keyboard) => {
                bytes.push(0);
                bytes.extend(player_keyboard.to_bytes());
            }
            PlayerCommand::RemovePlayer => {
                bytes.push(1);
            }
            PlayerCommand::PlayerChooseTeam(team_selection) => {
                bytes.push(2);
                bytes.extend(team_selection.team.to_bytes());
            }
            PlayerCommand::PlayerChooseRunway(runway_selection) => {
                bytes.push(3);
                bytes.extend(runway_selection.runway_id.to_bytes());
                bytes.extend(runway_selection.plane_type.to_bytes());
            }
            PlayerCommand::AddPlayer(data) => {
                bytes.push(4);
                bytes.extend(data.to_bytes());
            }
            PlayerCommand::SendMessage(msg, is_global) => {
                bytes.push(5);
                bytes.extend(msg.to_bytes());
                bytes.extend(is_global.to_bytes());
            }
        };

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)> {
        let (mut bytes, command_type) = u8::from_bytes(bytes)?;

        let command = match command_type {
            0 => {
                let (slice, keyboard) = PlayerKeyboard::from_bytes(bytes)?;
                bytes = slice;
                PlayerCommand::PlayerKeyboard(keyboard)
            }
            1 => PlayerCommand::RemovePlayer,
            2 => {
                let (slice, team) = Option::<Team>::from_bytes(bytes)?;
                bytes = slice;
                PlayerCommand::PlayerChooseTeam(TeamSelection { team })
            }
            3 => {
                let (slice, runway_id) = RunwayId::from_bytes(bytes)?;
                bytes = slice;
                let (slice, plane_type) = PlaneType::from_bytes(bytes)?;
                bytes = slice;
                PlayerCommand::PlayerChooseRunway(RunwaySelection {
                    runway_id,
                    plane_type,
                })
            }
            4 => {
                let (slice, player_data) = AddPlayerData::from_bytes(bytes)?;
                bytes = slice;
                PlayerCommand::AddPlayer(player_data)
            }
            5 => {
                let (slice, msg) = String::from_bytes(bytes)?;
                let (slice, is_global) = bool::from_bytes(slice)?;
                bytes = slice;
                PlayerCommand::SendMessage(msg, is_global)
            }
            _ => panic!("Unknown command type"),
        };

        Some((bytes, command))
    }
}

impl World {
    pub fn get_full_state(&self) -> Vec<EntityChange> {
        let mut state = vec![];
        state.push(self.world_info.get_all_full_state());
        // player state should be serialized first
        state.extend(self.planes.get_all_full_state());
        state.extend(self.men.get_all_full_state());
        state.extend(self.background_items.get_all_full_state());
        state.extend(self.grounds.get_all_full_state());
        state.extend(self.coasts.get_all_full_state());
        state.extend(self.runways.get_all_full_state());
        state.extend(self.waters.get_all_full_state());
        state.extend(self.bunkers.get_all_full_state());
        state.extend(self.bombs.get_all_full_state());
        state.extend(self.explosions.get_all_full_state());
        state.extend(self.hills.get_all_full_state());
        state.extend(self.bullets.get_all_full_state());
        state.extend(self.players.get_all_full_state());
        state
    }

    pub(crate) fn get_changed_state(&mut self) -> Vec<EntityChange> {
        let mut state = vec![];

        if self.world_info.has_changes() {
            state.push(self.world_info.get_all_changed_state());
        }

        // player state should be serialized first
        state.extend(self.planes.get_all_changed_state());
        state.extend(self.men.get_all_changed_state());
        state.extend(self.background_items.get_all_changed_state());
        state.extend(self.grounds.get_all_changed_state());
        state.extend(self.coasts.get_all_changed_state());
        state.extend(self.runways.get_all_changed_state());
        state.extend(self.waters.get_all_changed_state());
        state.extend(self.bunkers.get_all_changed_state());
        state.extend(self.bombs.get_all_changed_state());
        state.extend(self.explosions.get_all_changed_state());
        state.extend(self.hills.get_all_changed_state());
        state.extend(self.bullets.get_all_changed_state());
        state.extend(self.players.get_all_changed_state());
        state
    }
}
