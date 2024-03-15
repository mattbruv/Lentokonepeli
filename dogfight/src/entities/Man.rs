use super::ManState;

// Derive macro
// Derive networking trait to get full/partial state
// create full/partial state structs
// with setters for networked properties
// boolean flags for determining if they're fresh
// fn to reset the boolean flag

pub struct Man {
    x: i32,
    y: i32,

    state: ManState,
}

impl Man {
    fn foo(&self) -> i16 {
        self.state.x
    }
}
