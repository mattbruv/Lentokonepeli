use dogfight::{
    network::{encoding::NetworkedBytes, EntityChange},
    world::World,
};

fn main() {
    let world: World = World::new();

    let state = world.get_full_state();
    let bytes: Vec<Vec<u8>> = state.iter().map(|x| x.to_bytes()).collect();

    println!("{:?}", bytes);
}
