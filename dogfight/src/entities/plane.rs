use crate::network::{self, NetworkedEntity};

pub struct Plane {
    //
}

impl Plane {
    pub fn new() -> Plane {
        Plane {}
    }
}

impl NetworkedEntity for Plane {
    fn get_full_properties(&self) -> network::EntityProperties {
        network::EntityProperties::Plane
    }

    fn get_changed_properties_and_reset(&mut self) -> network::EntityProperties {
        network::EntityProperties::Plane
    }
}
