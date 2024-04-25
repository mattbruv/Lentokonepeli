pub mod encoding;
pub mod property;

use serde::Serialize;
use ts_rs::TS;

use crate::{
    entities::{
        background_item::BackgroundItemProperties, bunker::BunkerProperties,
        coast::CoastProperties, ground::GroundProperties, man::ManProperties,
        plane::PlaneProperties, player::PlayerProperties, runway::RunwayProperties,
        types::EntityType, water::WaterProperties, world_info::WorldInfoProperties, EntityId,
    },
    output::GameOutput,
};

use self::encoding::NetworkedBytes;

pub trait NetworkedEntity {
    fn get_full_properties(&self) -> EntityProperties;
    fn get_changed_properties_and_reset(&mut self) -> EntityProperties;
    fn has_changes(&self) -> bool;
}

/*
pub(crate) fn entity_changes_to_json(state: Vec<EntityChange>) -> String {
    serde_json::to_string(&state).unwrap()
}
*/

pub(crate) fn entity_changes_to_binary(state: &Vec<EntityChange>) -> Vec<u8> {
    state.iter().flat_map(|x| x.to_bytes()).collect()
}

pub fn game_events_to_binary(events: &Vec<GameOutput>) -> Vec<u8> {
    events.to_bytes()
}

pub fn game_events_from_bytes(bytes: &Vec<u8>) -> Vec<GameOutput> {
    let (_, events) = Vec::<GameOutput>::from_bytes(bytes);
    events
}

pub fn game_events_to_json(events: &Vec<GameOutput>) -> String {
    serde_json::to_string(&events).unwrap()
}

impl NetworkedBytes for Vec<GameOutput> {
    fn to_bytes(&self) -> Vec<u8> {
        self.iter().flat_map(|x| x.to_bytes()).collect()
    }

    fn from_bytes(bytes: &[u8]) -> (&[u8], Self) {
        let mut events = vec![];
        let mut slice = bytes;

        while slice.len() > 0 {
            let (bytes, event) = GameOutput::from_bytes(slice);
            events.push(event);
            slice = &bytes;
        }

        (bytes, events)
    }
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
#[serde(tag = "type", content = "data")]
pub enum EntityChangeType {
    Deleted,
    Properties(EntityProperties),
}

#[derive(Serialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type", content = "props")]
pub enum EntityProperties {
    WorldInfo(WorldInfoProperties),
    Man(ManProperties),
    Plane(PlaneProperties),
    Player(PlayerProperties),
    BackgroundItem(BackgroundItemProperties),
    Ground(GroundProperties),
    Coast(CoastProperties),
    Runway(RunwayProperties),
    Water(WaterProperties),
    Bunker(BunkerProperties),
}
