use std::time::Instant;

use dogfight::world::World;

fn main() {
    let mut world: World = World::new();
    let levels: Vec<&str> = include_str!("../levels.txt").split("\n\n").collect();

    let now = Instant::now();
    world.load_level(levels[0]);
    world.init();

    let mut input = vec![];

    input.push(dogfight::input::GameInput::AddPlayer {
        name: "player1".into(),
    });

    let changed = world.tick(input);

    println!("{:?}", changed);
}
