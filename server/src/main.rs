use dogfight::network::NetworkedBytes;
use std::{time::Instant, vec};

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
                let t1 = Instant::now();
                let bytes = man.to_bytes();
                let t1diff = t1.elapsed();
                println!("{:?}", bytes);
                println!("{:?}", t1diff);
            }
            _ => {}
        },
        _ => {}
    }

    let mut test: Vec<u8> = (-325900 as i32).to_bytes();

    test.append(&mut vec![0, 10]);
    println!("{:?}", test);
    let (b, i) = i32::from_bytes(&test);
    println!("{:?}", test);
    println!("{:?}", i);
    println!("{:?}", b);
}
