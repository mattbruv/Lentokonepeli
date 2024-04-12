use dogfight::{
    network::{encoding::NetworkedBytes, EntityChange},
    world::World,
};

fn main() {
    let mut world: World = World::new();

    let _ = world.get_changed_state();
    let _ = world.get_changed_state();
    let _ = world.get_changed_state();
    let state = world.get_changed_state();
    let bytes: Vec<u8> = state.iter().flat_map(|x| x.to_bytes()).collect();

    println!("{:?}", state);
    println!("{:?}", bytes);

    let mut bytes_copy = bytes.as_slice();
    let mut parsed: Vec<EntityChange> = vec![];

    while bytes_copy.len() > 0 {
        let (new_slice, data) = EntityChange::from_bytes(&bytes_copy);
        parsed.push(data);
        bytes_copy = new_slice;
    }

    let a = format!("{:?}", state);
    let b = format!("{:?}", parsed);

    println!("{:?}", a == b);
}
