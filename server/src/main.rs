use std::time::Instant;

use dogfight::event::GameEvent;
use dogfight::network::encoding::NetworkedBytes;
use dogfight::world::World;

fn main() {
    let mut world: World = World::new();
    let levels: Vec<&str> = include_str!("../levels.txt").split("\n\n").collect();

    let now = Instant::now();
    world.load_level(levels[0]);
    world.init();

    let full = world.get_full_state();
    let changed = world.tick();
    let changed = &world.tick()[0];
    let el = now.elapsed();
    println!("{:?}", changed);
    let bytes = changed.to_bytes();
    println!("{:?}", bytes);
    let parsed = GameEvent::from_bytes(&bytes);
    println!("{:?}", parsed);
    println!("{:?}", el);
    match &parsed.1 {
        GameEvent::EntityChanges(c) => {
            println!("change len: {}", c.len());
        }
    }
    let a = serde_json::to_string(changed).unwrap();
    let b = serde_json::to_string(&parsed.1).unwrap();
    println!("a: {}", a);
    println!("b: {}", b);
    println!("equal?: {}", a == b);
    println!("{:?}", parsed.0);
}
