use crate::network::{ChangedState, FullState, NetworkedEntity};

pub struct Man {
    //
}

impl NetworkedEntity for Man {
    fn get_full_state(&self) -> FullState {
        FullState::Man
    }

    fn get_changed_state(&self) -> ChangedState {
        ChangedState::Man
    }
}
