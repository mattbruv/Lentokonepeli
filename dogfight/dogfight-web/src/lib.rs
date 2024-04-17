mod utils;

use dogfight::network::{entity_changes_to_binary, entity_changes_to_json};
use dogfight::world::World;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
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

    pub fn get_changed_state(&mut self) -> String {
        let state = self.world.get_changed_state();
        entity_changes_to_json(state)
    }

    pub fn get_changed_state_binary(&mut self) -> Vec<u8> {
        entity_changes_to_binary(self.world.get_changed_state())
    }
}
