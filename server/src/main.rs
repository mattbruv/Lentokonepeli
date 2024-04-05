use dogfight::network::NetworkedBytes;
use std::time::Instant;

use dogfight::{network::state_to_json, world::World};
use serde_json::to_string;

fn main() {
    let mut world: World = World::new();

    let time = Instant::now();

    for _ in 1..1000 {
        world.test()
    }
    let elapsed = time.elapsed();
    println!("{:?} elapsed", elapsed);

    let mut full = world.get_changed_state();
    world.test();
    full = world.get_changed_state();
    let first = &full[0];
    match &first.update {
        dogfight::network::EntityChangeType::Properties(p) => match p {
            dogfight::network::EntityProperties::Man(man) => {
                println!("{:?}", man.to_bytes());
            }
            _ => {}
        },
        _ => {}
    }
    println!("{:?}", first);
}
