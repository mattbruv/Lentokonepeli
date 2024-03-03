use dogfight_macros::show_streams;
use ts_rs::TS;

#[show_streams]
pub struct ManState {
    x: i16,
    y: i16,
}

pub struct Man {
    x: i16,
    y: i16,
    client: ManState,
}
