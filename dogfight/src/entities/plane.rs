use dogfight_macros::Networked;

use crate::network::{property::Property, EntityProperties, NetworkedEntity};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[ts(export)]
pub enum PlaneType {
    Albatros = 4,
    Junkers = 5,
    Fokker = 6,
    Bristol = 7,
    Salmson = 8,
    Sopwith = 9,
}

#[derive(Debug)]
pub enum PlaneState {
    Flying = 0,    // 0
    Landing = 1,   // 1
    Landed = 2,    // 2
    TakingOff = 3, // 3
    Falling = 4,   // 4
    Dodging = 6,   // 6
}

#[derive(Networked)]
pub struct Plane {
    plane_type: Property<PlaneType>,
}

impl Plane {
    pub fn new(plane_type: PlaneType) -> Plane {
        Plane {
            plane_type: Property::new(plane_type),
        }
    }
}
