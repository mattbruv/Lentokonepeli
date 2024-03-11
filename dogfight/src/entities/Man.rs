use dogfight_macros::networkable;

// Derive macro
// Derive networking trait to get full/partial state
// create full/partial state structs
// with setters for networked properties
// boolean flags for determining if they're fresh
// fn to reset the boolean flag

#[networkable]
pub struct ManState {
    x: i16,
    y: i16,
}

pub struct Man {
    x: i32,
    y: i32,
}
