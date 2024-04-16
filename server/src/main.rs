use dogfight::{
    network::{encoding::NetworkedBytes, EntityChange},
    world::World,
};

fn main() {
    let mut world: World = World::new();

    let state = world.get_full_state();
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

    let test = Some("optional string test".to_string());
    let bytes = test.to_bytes();
    println!("{:?}", bytes);
    let read = Option::<String>::from_bytes(&bytes);
    println!("{:?}", read.1);
    println!("{:?}", read.0);
}
