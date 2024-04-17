use dogfight::{
    network::{encoding::NetworkedBytes, EntityChange},
    world::World,
};

fn main() {
    let mut world: World = World::new();
    let levels: Vec<&str> = include_str!("../levels.txt").split("\n\n").collect();

    world.load_level(levels[0]);
}
