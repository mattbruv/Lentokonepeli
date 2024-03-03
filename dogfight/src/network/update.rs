use crate::entities::{man::*, EntityId};
use ts_rs::TS;

pub enum FullState {
    Man(EntityId, ManState),
}

pub enum PartialState {}
