use crate::network::{self, NetworkedEntity};

pub struct Plane {
    //
}

impl NetworkedEntity for Plane {
    fn get_full_properties(&self) -> network::EntityProperties {
        todo!()
    }

    fn get_changed_properties_and_reset(&mut self) -> network::EntityProperties {
        todo!()
    }
}
