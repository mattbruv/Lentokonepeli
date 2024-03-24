use crate::entities::{EntityId, EntityType};

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
    data: EntityData,
}

pub enum EntityData {
    Full(FullState),
    Changed(ChangedState),
}

pub enum ChangedState {
    Man,
    Plane,
}

pub enum FullState {
    Man,
    Plane,
}
