use dogfight_macros::Networkable;

#[derive(Networkable)]
pub struct Man {
    #[client(i16)]
    x: i32,

    #[client(i16)]
    y: i32,

    z: hey,
}
