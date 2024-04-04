use std::time::Instant;

use dogfight::world::World;

fn main() {
    let mut world: World = World::new();

    let time = Instant::now();

    for _ in 1..1000 {
        world.test()
    }
    let elapsed = time.elapsed();
    println!("{:?} elapsed", elapsed);

    println!("{:?}", world.get_full_state());
    println!("{:?}", time.elapsed());
    println!("{:?}", world.get_changed_state());

    println!("{:?} elapsed", elapsed)
}

// se me detiene el corazon
