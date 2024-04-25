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
}
