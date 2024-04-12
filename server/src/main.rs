use dogfight::{
    entities::{
        man::{Man, ManProperties},
        Team,
    },
    network::{EntityProperties, NetworkedBytes, NetworkedEntity},
};
use std::{time::Instant, vec};

use dogfight::{network::state_to_json, world::World};
use serde_json::to_string;

fn main() {
    let mut world: World = World::new();
    let time = Instant::now();

    let mut man: Man = Man::new(Team::Centrals);
    man.set_x(325900);
    man.set_y(-2311600);
    let props = man.get_full_properties();

    match props {
        EntityProperties::Man(man_props) => {
            println!("{:?}", man_props);
            let bytes = man_props.to_bytes();
            println!("{:?}", bytes);
            let (bytes, parsed) = ManProperties::from_bytes(&bytes);
            println!("{:?}", parsed);
            println!("{:?}", parsed == man_props);
            let json = serde_json::to_string(&parsed).unwrap();
            println!("{:?}", json);

            println!("{:?}", bytes);
        }
        _ => (),
    }
}
