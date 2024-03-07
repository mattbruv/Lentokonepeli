use dogfight_macros::PartialState;

#[derive(PartialState)]
pub struct FullManState {
    x: i16,
    y: i16,
}

pub struct Man {
    x: i16,
    y: i16,
    client: FullManState,
}
