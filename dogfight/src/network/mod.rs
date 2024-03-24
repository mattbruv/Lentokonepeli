struct EntityTag {}

trait NetworkedEntity {
    fn get_full_state(&self) -> EntityState;
    fn get_changed_state(&self) -> EntityState;
}

pub enum EntityState {
    Full(FullState),
    Changed(ChangedState),
}

pub enum ChangedState {}

pub enum FullState {}
