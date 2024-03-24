use serde::Serialize;
use std::time::Instant;

use bincode::{config, Decode, Encode};
use dogfight::game::Game;
use ts_rs::TS;

#[derive(Encode, Decode, Debug, Serialize, TS)]
#[ts(export)]
pub struct Test {
    x: i16,
    y: i16,
}

#[derive(Encode, Decode, Debug, TS, Serialize)]
#[ts(export)]
pub struct Bar {
    a: Option<String>,
    b: Option<i16>,
    c: Option<i16>,
    d: Option<i16>,
    e: Option<i16>,
    f: Option<i16>,
}

#[derive(Encode, Decode, Debug, Serialize, TS)]
#[ts(export)]
pub enum Combo {
    A(Test),
    B(Bar),
}

fn main() {
    let t: Combo = Combo::B(Bar {
        a: None, //Some("AAíAA".to_string()),
        b: Some(10),
        c: None,
        d: None,
        e: None,
        f: Some(30),
    });

    let config = config::standard();

    let mut start = Instant::now();
    let mut encoded = vec![];
    for i in 1..1000 {
        encoded = bincode::encode_to_vec(&t, config).unwrap();
    }

    println!("encode: {:?}", start.elapsed());
    println!("{:?}", encoded);

    let (decoded, len): (Combo, usize) = bincode::decode_from_slice(&encoded[..], config).unwrap();

    println!("{:?}", decoded);
    start = Instant::now();
    println!("{:?}", serde_json::to_string(&t));
    println!("encode: {:?}", start.elapsed());
}
