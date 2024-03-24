use std::os::macos::raw::stat;

use serde::{Deserialize, Serialize};

use crate::entities::{
    man::{Man, ManChangedState, ManFullState},
    EntityId, EntityType,
};

#[derive(Serialize)]
pub struct EntityTag {
    pub ent_type: EntityType,
    pub id: EntityId,
}

pub trait NetworkedEntity {
    fn get_full_state(&self) -> FullState;
    fn get_changed_state(&self) -> ChangedState;
}

pub fn state_to_json(state: Vec<EntityState>) -> String {
    serde_json::to_string(&state).unwrap()
}

pub fn state_to_bytes(state: Vec<EntityState>) -> Vec<u8> {
    bincode::serialize(&state).unwrap()
}

#[derive(Serialize)]
pub struct EntityState {
    pub tag: EntityTag,
    pub update: EntityUpdate,
}

#[derive(Serialize)]
pub enum EntityUpdate {
    Full(FullState),
    Changed(ChangedState),
    Deleted,
}

#[derive(Serialize)]
pub enum ChangedState {
    Man(ManChangedState),
    Plane,
}

#[derive(Serialize)]
pub enum FullState {
    Man(ManFullState),
    Plane,
}
