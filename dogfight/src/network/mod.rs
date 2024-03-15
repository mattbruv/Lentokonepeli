use crate::entities::{man::*, EntityId};

trait NetworkedEntity {
    fn get_full_state(&self) -> EntityState;
    fn get_changed_state(&self) -> EntityState::Changed;
}

pub enum EntityState {
    Full(FullState),
    Changed(ChangedState),
}

pub enum ChangedState {
    //Man(EntityId, ChangedManState),
}

pub enum FullState {
    //Man(EntityId, ),
}
