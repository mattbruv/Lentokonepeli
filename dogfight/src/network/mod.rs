use crate::entities::{
    man::{Man, ManChangedState, ManFullState},
    EntityId, EntityType,
};

pub struct EntityTag {
    ent_type: EntityType,
    id: EntityId,
}

pub trait NetworkedEntity {
    fn get_full_state(&self) -> FullState;
    fn get_changed_state(&self) -> ChangedState;
}

pub struct EntityState {
    tag: EntityTag,
    update: EntityUpdate,
}

pub enum EntityUpdate {
    Full(FullState),
    Changed(ChangedState),
    Deleted,
}

pub enum ChangedState {
    Man(ManChangedState),
    Plane,
}

pub enum FullState {
    Man(ManFullState),
    Plane,
}
