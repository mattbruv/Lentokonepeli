pub mod encoding;
pub mod property;

use serde::Serialize;
use ts_rs::TS;

use crate::entities::{
    coast::CoastProperties, flag::FlagProperties, ground::GroundProperties, man::ManProperties,
    plane::PlaneProperties, player::PlayerProperties, runway::RunwayProperties, types::EntityType,
    water::WaterProperties, EntityId,
};

use self::encoding::NetworkedBytes;

pub trait NetworkedEntity {
    fn get_full_properties(&self) -> EntityProperties;
    fn get_changed_properties_and_reset(&mut self) -> EntityProperties;
}

pub fn entity_changes_to_json(state: Vec<EntityChange>) -> String {
    serde_json::to_string(&state).unwrap()
}

pub fn entity_changes_to_binary(state: Vec<EntityChange>) -> Vec<u8> {
    state.iter().flat_map(|x| x.to_bytes()).collect()
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
    Man(ManProperties),
    Plane(PlaneProperties),
    Player(PlayerProperties),
    Flag(FlagProperties),
    Ground(GroundProperties),
    Coast(CoastProperties),
    Runway(RunwayProperties),
    Water(WaterProperties),
}
