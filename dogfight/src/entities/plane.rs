use crate::network::{ChangedState, FullState, NetworkedEntity};

pub struct Plane {
    //
}

impl NetworkedEntity for Plane {
    fn get_full_state(&self) -> FullState {
        FullState::Plane
    }

    fn get_changed_state(&self) -> ChangedState {
        ChangedState::Plane
    }
}
