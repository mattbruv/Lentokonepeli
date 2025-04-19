mod utils;

use dogfight::{
    input::{game_input_from_string, is_valid_command},
    level::parse_level_to_json,
    network::{
        encoding::NetworkedBytes, game_events_from_bytes, game_events_to_binary,
        game_events_to_json, player_command_json_from_binary, player_command_json_to_binary,
    },
    output::ServerOutput,
    replay::{
        events::get_replay_summary,
        file::{get_build_version, get_commit_version, ReplayFile},
    },
    world::{self, World},
};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert();
}

#[wasm_bindgen]
pub struct DogfightWeb {
    world: World,
    replay: Option<ReplayFile>,
}

#[wasm_bindgen]
impl DogfightWeb {
    pub fn new() -> Self {
        utils::set_panic_hook();

        Self {
            world: World::new(),
            replay: None,
        }
    }

    pub fn load_level(&mut self, world: String) {
        self.world.load_level(&world);
    }

    pub fn load_replay(&mut self, bytes: Vec<u8>) -> () {
        if let Some((_, replay)) = ReplayFile::from_bytes(&bytes) {
            self.world = World::new();
            self.world.load_level(&replay.level_data);
            self.replay = Some(replay);
        }
    }

    pub fn init(&mut self) {
        self.world.init();
    }

    pub fn get_build_version(&self) -> String {
        get_build_version()
    }

    pub fn get_commit(&self) -> String {
        get_commit_version().to_string()
    }

    pub fn get_replay_summary(&self, bytes: Vec<u8>) -> String {
        get_replay_summary(bytes)
    }

    pub fn parse_level(&self, level_str: &str) -> String {
        parse_level_to_json(level_str)
    }

    pub fn get_replay_file(&self) -> Vec<u8> {
        self.world.get_replay_file_bytes()
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

    pub fn load_replay_until(&mut self, until_tick: u32) -> () {
        if let Some(replay) = &self.replay {
            self.world = World::new();
            self.world.load_level(&replay.level_data);
            self.world.simulate_until(replay, Some(until_tick), true);
        }
    }

    pub fn tick_replay(&mut self) -> () {
        if let Some(replay) = &self.replay {
            self.world
                .simulate_until(replay, Some(self.world.get_tick() + 1), false);
        }
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
