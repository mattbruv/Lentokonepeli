use std::time::Instant;

use dogfight::world::World;

fn main() {
    let mut world: World = World::new();

    let time = Instant::now();

    world.get_full_state();

    let elapsed = time.elapsed();

    println!("{:?} elapsed", elapsed)
}

// se me detiene el corazon
