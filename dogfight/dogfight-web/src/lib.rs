mod utils;

use dogfight::{
    input::game_input_from_string,
    network::{game_events_from_bytes, game_events_to_binary, game_events_to_json},
    world::World,
};
use wasm_bindgen::prelude::*;

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
        utils::set_panic_hook();

        Self {
            world: World::new(),
        }
    }

    pub fn load_level(&mut self, world: String) {
        self.world.load_level(&world);
    }

    pub fn init(&mut self) {
        self.world.init();
    }

    pub fn tick(&mut self, input_json: String) -> Vec<u8> {
        let input = game_input_from_string(input_json);
        let events = self.world.tick(input);
        let binary = game_events_to_binary(&events);
        binary
    }

    pub fn debug(&self) -> String {
        self.world.debug()
    }

    pub fn game_events_from_binary(&self, binary: Vec<u8>) -> String {
        let events = game_events_from_bytes(&binary);
        game_events_to_json(&events)
    }
}
