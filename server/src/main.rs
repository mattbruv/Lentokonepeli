use dogfight::{
    network::{encoding::NetworkedBytes, EntityChange},
    world::World,
};

fn main() {
    let world: World = World::new();

    let state = world.get_full_state();
    let bytes: Vec<u8> = state.iter().flat_map(|x| x.to_bytes()).collect();

    println!("{:?}", state);
    println!("{:?}", bytes);

    let mut bytes_copy = bytes.as_slice();
    let mut parsed: Vec<EntityChange> = vec![];
    println!("{:?}", bytes_copy);

    while bytes_copy.len() > 0 {
        let (new_slice, data) = EntityChange::from_bytes(&bytes_copy);
        parsed.push(data);
        bytes_copy = new_slice;
    }
}
