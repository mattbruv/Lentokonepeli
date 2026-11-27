mod utils;

use dogfight::{
    bots::{add_bot_request_from_string, BotManager},
    entities::world_info::GameMode,
    input::{game_input_from_string, is_valid_command, ServerInput},
    level::parse_level_to_json,
    network::{
        encoding::NetworkedBytes, game_events_from_bytes, game_events_to_binary,
        game_events_to_json, player_command_json_from_binary, player_command_json_to_binary,
    },
    output::ServerOutput,
    replay::{
        events::get_replay_summary,
        file::{get_build_version, get_commit_version, get_replay_version, ReplayFile},
    },
    rules::{default_rules_json, sanitize_rules_json, GameRules},
    world::{self, World},
};
use wasm_bindgen::prelude::*;

fn parse_game_mode(mode: &str) -> GameMode {
    match mode {
        "Rounds" => GameMode::Rounds,
        _ => GameMode::Normal,
    }
}

#[wasm_bindgen]
extern "C" {
    fn alert();

    #[wasm_bindgen(js_namespace = Date)]
    fn now() -> f64;
}

#[wasm_bindgen]
pub struct DogfightWeb {
    world: World,
    replay: Option<ReplayFile>,
    bots: BotManager,
    pending_input: Vec<ServerInput>,
}

#[wasm_bindgen]
impl DogfightWeb {
    pub fn new() -> Self {
        utils::set_panic_hook();

        Self {
            world: World::new(),
            replay: None,
            bots: BotManager::new(),
            pending_input: vec![],
        }
    }

    pub fn load_level(&mut self, world: String) {
        self.world.load_level(&world);
    }

    pub fn load_replay(&mut self, bytes: Vec<u8>) -> () {
        if let Some((_, replay)) = ReplayFile::from_bytes(&bytes) {
            self.world = World::new();
            self.world.sync_bullet_positions = true;
            self.bots = BotManager::new();
            self.world.load_level(&replay.level_data);
            self.world
                .set_round_settings(replay.game_time_minutes, replay.intermission_seconds);
            self.world.set_game_mode(replay.game_mode);
            self.world.set_rules(replay.rules);
            self.replay = Some(replay);
        }
    }

    pub fn set_round_settings(&mut self, game_time_minutes: u16, intermission_seconds: u16) {
        self.world
            .set_round_settings(game_time_minutes, intermission_seconds);
    }

    pub fn set_game_mode(&mut self, mode: &str) {
        self.world.set_game_mode(parse_game_mode(mode));
    }

    pub fn set_rules(&mut self, rules_json: &str) {
        self.world
            .set_rules(GameRules::from_json(rules_json).unwrap_or_default());
    }

    pub fn get_rules(&self) -> String {
        self.world.rules.to_json()
    }

    pub fn default_rules(&self) -> String {
        default_rules_json()
    }

    pub fn sanitize_rules(&self, rules_json: &str) -> String {
        sanitize_rules_json(rules_json)
    }

    pub fn change_game(
        &mut self,
        level: String,
        mode: &str,
        game_time_minutes: u16,
        intermission_seconds: u16,
        rules_json: &str,
    ) {
        let (world, rejoin) = self.world.restarted(
            &level,
            parse_game_mode(mode),
            game_time_minutes,
            intermission_seconds,
            GameRules::from_json(rules_json).unwrap_or_default(),
        );
        self.world = world;
        self.world.set_replay_start_time(now() as u64);
        self.bots.reset();
        self.pending_input = rejoin;
    }

    pub fn init(&mut self) {
        self.world.init();
        self.world.set_replay_start_time(now() as u64);
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

    pub fn get_replay_version(&self, bytes: Vec<u8>) -> String {
        get_replay_version(bytes)
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
        let mut input: Vec<ServerInput> = self.pending_input.drain(..).collect();
        input.extend(game_input_from_string(input_json));
        input.extend(self.bots.tick(&self.world));
        self.world.tick(input);
    }

    pub fn add_bot(&mut self, request_json: &str) -> bool {
        match add_bot_request_from_string(request_json) {
            Some(request) => self.bots.add_bot(request),
            None => false,
        }
    }

    pub fn remove_bot(&mut self, guid: &str) -> bool {
        self.bots.remove_bot(&guid.into())
    }

    pub fn get_bots(&self) -> String {
        self.bots.bots_json()
    }

    pub fn load_replay_until(&mut self, until_tick: u32) -> () {
        if let Some(replay) = &self.replay {
            self.world = World::new();
            self.world.sync_bullet_positions = true;
            self.world.load_level(&replay.level_data);
            self.world
                .set_round_settings(replay.game_time_minutes, replay.intermission_seconds);
            self.world.set_game_mode(replay.game_mode);
            self.world.set_rules(replay.rules);
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

    pub fn inspect(&self, x: i16, y: i16, radius: i16) -> String {
        self.world.inspect_json(x, y, radius)
    }

    pub fn debug_terrain(&self) -> String {
        self.world.debug(true, false)
    }

    pub fn debug_dynamic(&self) -> String {
        self.world.debug(false, true)
    }

    pub fn game_events_from_binary(&self, binary: Vec<u8>) -> String {
        let events = game_events_from_bytes(&binary);
        game_events_to_json(&events)
    }
}
