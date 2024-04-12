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
            let t1 = Instant::now();
            for _ in 1..10000 {
                let _ = man_props.to_bytes();
            }
            let (_, parsed) = ManProperties::from_bytes(&bytes);
            let tserialize = t1.elapsed();
            println!("{:?}", bytes);
            let t2 = Instant::now();
            for _ in 1..10000 {
                let _ = ManProperties::from_bytes(&bytes);
            }
            let tdeser = t2.elapsed();
            println!("{:?}", parsed);
            println!("{:?}", parsed == man_props);
            let json = serde_json::to_string(&parsed).unwrap();
            println!("{:?}", json);

            println!("{:?}", bytes);
            println!("serialize: {:?} deserialize: {:?}", tserialize, tdeser);
        }
        _ => (),
    }
}
