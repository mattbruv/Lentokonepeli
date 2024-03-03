use dogfight_macros::lento_test;
use ts_rs::TS;

#[lento_test]
pub struct ManState {
    x: i16,
    y: i16,
}

pub struct Man {
    x: i16,
    y: i16,
    client: ManState,
}
