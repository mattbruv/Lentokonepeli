use crate::entities::man::ManState;

pub struct EntityStateEntry {
    id: u16,
    state: EntityState,
}

pub enum EntityState {
    Man(ManState),
}

pub enum EntityUpdate {
    Man(ManState),
}
