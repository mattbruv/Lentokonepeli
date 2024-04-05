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

    let full = state_to_json(world.get_changed_state());

    let changed = state_to_json(world.get_changed_state());
    println!("{}", changed);
    let bool_vector = vec![
        true, false, true, false, true, false, true, false, false, true,
    ]; // Example vector of bools

    println!("Resulting bytes: {:?}", byte_vector);
    println!("{}", 0u8.to_foo());

    trait MyShit {
        fn to_foo(&self) -> String;
    }

    impl MyShit for u8 {
        fn to_foo(&self) -> String {
            "foo".to_owned()
        }
    }
}

// se me detiene el corazon
