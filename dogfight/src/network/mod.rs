use crate::entities::{man::*, EntityId};

pub mod entity_props;

trait NetworkedEntity {
    fn get_full_state(&self) -> EntityState;
    fn get_changed_state(&self) -> EntityState;
}

pub enum EntityState {
    Full(EntityId, FullState),
    Changed(EntityId, ChangedState),
}

pub enum ChangedState {
    //Man(EntityId, ChangedManState),
}

pub enum FullState {
    //Man(EntityId, ),
}
