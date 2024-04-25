use dogfight_macros::{EnumBytes, Networked};
use serde::Deserialize;

use crate::network::{property::Property, EntityProperties, NetworkedEntity};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS, EnumBytes)]
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
    x: i32,
    y: i32,
    client_x: Property<i16>,
    client_y: Property<i16>,
    plane_type: Property<PlaneType>,
    state: PlaneState,
}

impl Plane {
    pub fn new(plane_type: PlaneType) -> Plane {
        Plane {
            plane_type: Property::new(plane_type),
            x: 0,
            y: 0,
            client_x: Property::new(0),
            client_y: Property::new(0),
            state: PlaneState::Landed,
        }
    }
}
