use dogfight_macros::Networked;
use serde::Serialize;
use ts_rs::TS;

use crate::network::{self, property::Property, EntityProperties, NetworkedEntity};

use super::man::ManProperties;

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

    pub fn test(&self) {}
}
