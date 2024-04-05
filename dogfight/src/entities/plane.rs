use dogfight_macros::Networked;

use crate::network::{property::Property, EntityProperties, NetworkedEntity};

#[derive(Networked)]
pub struct Plane {
    style: Property<i32>,
}

impl Plane {
    pub fn new() -> Plane {
        Plane {
            style: Property::new(320),
        }
    }
}
