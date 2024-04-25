mod utils;

// use dogfight::network::{entity_changes_to_binary, entity_changes_to_json};
use dogfight::{
    network::{game_events_from_bytes, game_events_to_binary, game_events_to_json},
    world::World,
};
use wasm_bindgen::prelude::*;

use crate::utils::set_panic_hook;

#[wasm_bindgen]
extern "C" {
    fn alert();
}

#[wasm_bindgen]
pub struct DogfightWeb {
    world: World,
}

#[wasm_bindgen]
impl DogfightWeb {
    pub fn new() -> Self {
        Self {
            world: World::new(),
        }
    }

    /*
        pub fn get_full_state(&self) -> String {
            entity_changes_to_json(self.world.get_full_state())
        }

        pub fn get_full_state_binary(&self) -> Vec<u8> {
            entity_changes_to_binary(&self.world.get_full_state())
        }
    */

    pub fn load_level(&mut self, world: String) {
        self.world.load_level(&world);
    }

    pub fn init(&mut self) {
        self.world.init();
    }

    pub fn tick(&mut self) -> String {
        //set_panic_hook();
        let events = self.world.tick();
        let out = game_events_to_json(&events);
        let bin = game_events_to_binary(&events);
        let test = format!("{:?}", bin);
        let parsed = game_events_from_bytes(&bin);
        test
        //game_events_to_json(parsed)
    }
}
