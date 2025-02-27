mod utils;

use dogfight::{
    input::{game_input_from_string, is_valid_command},
    network::{
        game_events_from_bytes, game_events_to_binary, game_events_to_json,
        player_command_json_from_binary, player_command_json_to_binary,
    },
    output::ServerOutput,
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

    pub fn is_valid_command(&self, command_json: &str) -> bool {
        is_valid_command(command_json)
    }

    pub fn player_command_to_binary(&self, command_json: &str) -> Vec<u8> {
        player_command_json_to_binary(command_json)
    }

    pub fn player_command_from_binary(&self, binary: Vec<u8>) -> String {
        player_command_json_from_binary(&binary)
    }

    pub fn tick(&mut self, input_json: String) -> () {
        let input = game_input_from_string(input_json);
        self.world.tick(input);
    }

    pub fn flush_changed_state(&mut self) -> Vec<u8> {
        let changed_state = self.world.flush_changed_state();
        let binary = game_events_to_binary(&changed_state);
        binary
    }

    pub fn get_full_state(&self) -> Vec<u8> {
        let all_state = self.world.get_full_state();
        let out = vec![ServerOutput::EntityChanges(all_state)];
        game_events_to_binary(&out)
    }

    pub fn debug(&mut self) -> String {
        self.world.debug()
    }

    pub fn game_events_from_binary(&self, binary: Vec<u8>) -> String {
        let events = game_events_from_bytes(&binary);
        game_events_to_json(&events)
    }
}
