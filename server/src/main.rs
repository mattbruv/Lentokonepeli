use std::time::Instant;

use dogfight::event::GameEvent;
use dogfight::network::encoding::NetworkedBytes;
use dogfight::network::{game_events_from_bytes, game_events_to_binary};
use dogfight::world::World;

fn main() {
    let mut world: World = World::new();
    let levels: Vec<&str> = include_str!("../levels.txt").split("\n\n").collect();

    let now = Instant::now();
    world.load_level(levels[0]);
    world.init();

    let changed = world.tick();

    match &changed[0] {
        GameEvent::EntityChanges(c) => {
            for thing in c.iter() {
                println!("{:?}", thing);
            }
        }
    }

    let bin = game_events_to_binary(&changed);
    let parsed = game_events_from_bytes(&bin);
    println!("{:?}", bin);
    println!("{:?}", parsed);
}
