use dogfight::network::{state_to_bytes, state_to_json};
use dogfight::world::World;
use serde::Serialize;
use std::time::Instant;

use bincode::{config, Decode, Encode};
use ts_rs::TS;

#[derive(Encode, Decode, Debug, Serialize, TS)]
#[ts(export)]
pub struct Test {
    x: i16,
    y: i16,
}

fn main() {
    let world = World::new();

    let config = config::standard();

    let json = state_to_json(world.get_state());
    let bin = state_to_bytes(world.get_state());

    println!("{}", json);
    println!("{:?}", bin);
}
