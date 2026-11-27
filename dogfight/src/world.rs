use crate::rules::GameRules;
use std::collections::HashSet;

use crate::{
    entities::{
        background_item::BackgroundItem,
        bomb::Bomb,
        bullet::Bullet,
        bunker::Bunker,
        coast::Coast,
        container::{
            BackgroundItemId, BombId, BulletId, BunkerId, CoastId, EntityContainer, EntityId,
            ExplosionId, GroundId, HillId, ManId, PlaneId, PlayerId, RunwayId, WaterId,
        },
        explosion::Explosion,
        ground::Ground,
        hill::Hill,
        man::Man,
        plane::Plane,
        player::{Player, PlayerGuid},
        runway::Runway,
        types::{EntityType, Team},
        water::Water,
        world_info::{GameMode, WorldInfo},
    },
    input::{AddPlayerData, PlayerCommand, ServerInput},
    output::ServerOutput,
    replay::file::ReplayFile,
};

pub const DIRECTIONS: i32 = 256;
pub const RESOLUTION: i32 = 100;
pub const LEVEL_BORDER_X: i16 = 20_000;

pub struct World {
    game_tick: u32,
    pub sync_bullet_positions: bool,
    game_output: Vec<ServerOutput>,
    pub world_info: WorldInfo,
    pub players: EntityContainer<Player, PlayerId>,
    pub planes: EntityContainer<Plane, PlaneId>,
    pub background_items: EntityContainer<BackgroundItem, BackgroundItemId>,
    pub men: EntityContainer<Man, ManId>,
    pub grounds: EntityContainer<Ground, GroundId>,
    pub coasts: EntityContainer<Coast, CoastId>,
    pub runways: EntityContainer<Runway, RunwayId>,
    pub waters: EntityContainer<Water, WaterId>,
    pub bunkers: EntityContainer<Bunker, BunkerId>,
    pub bombs: EntityContainer<Bomb, BombId>,
    pub explosions: EntityContainer<Explosion, ExplosionId>,
    pub hills: EntityContainer<Hill, HillId>,
    pub bullets: EntityContainer<Bullet, BulletId>,

    pub replay_file: ReplayFile,
    pub rules: GameRules,
    pub team_balance: bool,
    pub(crate) game_time_ticks: u32,
    pub(crate) intermission_ticks: u32,
    pub(crate) time_winner: Option<Team>,
    pub(crate) round_ticks: u32,
    pub(crate) round_over_ticks: u32,
    pub(crate) game_mode: GameMode,
}

impl World {
    pub fn new() -> Self {
        let world = World {
            game_tick: 0,
            sync_bullet_positions: false,
            world_info: WorldInfo::new(),
            men: EntityContainer::new(EntityType::Man),
            planes: EntityContainer::new(EntityType::Plane),
            players: EntityContainer::new(EntityType::Player),
            background_items: EntityContainer::new(EntityType::BackgroundItem),
            grounds: EntityContainer::new(EntityType::Ground),
            coasts: EntityContainer::new(EntityType::Coast),
            runways: EntityContainer::new(EntityType::Runway),
            waters: EntityContainer::new(EntityType::Water),
            bunkers: EntityContainer::new(EntityType::Bunker),
            bombs: EntityContainer::new(EntityType::Bomb),
            explosions: EntityContainer::new(EntityType::Explosion),
            hills: EntityContainer::new(EntityType::Hill),
            bullets: EntityContainer::new(EntityType::Bullet),
            game_output: vec![],

            replay_file: ReplayFile::new(),
            rules: GameRules::default(),
            team_balance: true,
            game_time_ticks: 0,
            intermission_ticks: 2_000,
            time_winner: None,
            round_ticks: 0,
            round_over_ticks: 0,
            game_mode: GameMode::Normal,
        };

        world
    }

    pub fn init(&mut self) -> () {}

    pub fn init_debug(&mut self) -> () {
        /*
        let mut debug_plane = Plane::new(PlaneType::Fokker);
        debug_plane.set_position(-2490, -20);
        self.planes.insert(debug_plane);
        */
    }

    /*
    fn spawn_debug_bomb(&mut self) -> () {
        //for i in 0..2 {
        //let debug_bomb = Bomb::new(-2490 + i * 50, -300, 0.0, 0.0);
        //self.bombs.insert(debug_bomb);
        //}
    }
    */

    pub fn restarted(
        &self,
        level: &str,
        game_mode: GameMode,
        game_time_minutes: u16,
        intermission_seconds: u16,
        rules: GameRules,
    ) -> (World, Vec<ServerInput>) {
        let mut world = World::new();
        world.sync_bullet_positions = self.sync_bullet_positions;
        world.team_balance = self.team_balance;
        world.set_rules(rules);
        world.load_level(level);
        world.set_round_settings(game_time_minutes, intermission_seconds);
        world.set_game_mode(game_mode);
        world.init();

        let mut humans: Vec<(&PlayerId, &Player)> = self
            .players
            .get_map()
            .iter()
            .filter(|(_, p)| !p.is_bot())
            .collect();
        humans.sort_by_key(|(id, _)| id.raw_value());

        let rejoin = humans
            .into_iter()
            .map(|(_, p)| ServerInput {
                player_guid: p.get_guid().clone(),
                command: PlayerCommand::AddPlayer(AddPlayerData {
                    guid: p.get_guid().clone(),
                    name: p.get_name(),
                    clan: p.get_clan(),
                }),
            })
            .collect();

        (world, rejoin)
    }

    pub fn get_tick(&self) -> u32 {
        self.game_tick
    }

    pub fn tick(&mut self, input: Vec<ServerInput>) -> () {
        self.game_tick += 1;

        if self.game_tick == 50 {
            self.init_debug();
        }

        // add input to replay file
        self.add_replay_input(self.game_tick, &input);

        // process input data
        let input_events = self.handle_input(input);
        self.game_output.extend(input_events);

        let chooser_events = self.tick_choosers();
        self.game_output.extend(chooser_events);

        // 1. Tick runnable entities and capture output actions
        let runnable_actions = self.tick_entities();

        // 2. Process runnable actions
        let run_actions = self.process_actions(runnable_actions);
        self.game_output.extend(run_actions);

        // 3. Process collision and get output
        let tick_coll = self.tick_collision_entities();
        self.game_output.extend(tick_coll);

        self.tick_round();

        self.recycle_freed_ids();
    }

    fn recycle_freed_ids(&mut self) {
        let referenced: HashSet<PlayerId> = self
            .bullets
            .get_map()
            .values()
            .map(|b| b.player_id())
            .chain(self.bombs.get_map().values().map(|b| b.player_id()))
            .chain(
                self.explosions
                    .get_map()
                    .values()
                    .filter_map(|e| e.player_id()),
            )
            .collect();
        self.players
            .recycle_freed_ids_except(|id| referenced.contains(id));
        self.planes.recycle_freed_ids();
        self.men.recycle_freed_ids();
        self.background_items.recycle_freed_ids();
        self.grounds.recycle_freed_ids();
        self.coasts.recycle_freed_ids();
        self.runways.recycle_freed_ids();
        self.waters.recycle_freed_ids();
        self.bunkers.recycle_freed_ids();
        self.bombs.recycle_freed_ids();
        self.explosions.recycle_freed_ids();
        self.hills.recycle_freed_ids();
        self.bullets.recycle_freed_ids();
    }

    pub fn set_round_settings(&mut self, game_time_minutes: u16, intermission_seconds: u16) {
        let intermission_seconds = intermission_seconds.clamp(3, 600);
        self.game_time_ticks = game_time_minutes.min(999) as u32 * 60 * 100;
        self.intermission_ticks = intermission_seconds as u32 * 100;
        self.replay_file.game_time_minutes = game_time_minutes.min(999);
        self.replay_file.intermission_seconds = intermission_seconds;
    }

    pub fn set_game_mode(&mut self, mode: GameMode) {
        self.game_mode = mode;
        self.world_info.set_game_mode(mode);
        self.replay_file.game_mode = mode;
    }

    pub fn set_rules(&mut self, rules: GameRules) {
        let rules = rules.sanitized();
        self.rules = rules;
        self.replay_file.rules = rules;
        self.apply_rules_to_buildings();
    }

    pub(crate) fn apply_rules_to_buildings(&mut self) {
        let rules = self.rules;
        for (_, runway) in self.runways.get_map_mut() {
            runway.apply_rules(&rules);
        }
        for (_, bunker) in self.bunkers.get_map_mut() {
            bunker.apply_rules(&rules);
        }
    }

    pub fn set_replay_start_time(&mut self, start_time_ms: u64) {
        self.replay_file.start_time_ms = Some(start_time_ms);
    }

    pub fn get_game_mode(&self) -> GameMode {
        self.game_mode
    }

    pub fn flush_changed_state(&mut self) -> Vec<ServerOutput> {
        // pull the changed state
        let updated_state = self.get_changed_state();

        if updated_state.len() > 0 {
            // log(&format!("{:?}", updated_state).into());
            self.game_output
                .push(ServerOutput::EntityChanges(updated_state));
        }

        // Copy output to return it, then clear it going forward
        let output = self.game_output.clone();
        self.game_output.clear();
        output
    }

    pub(crate) fn get_player_from_name_mut(
        &mut self,
        name: &String,
    ) -> Option<(&PlayerId, &mut Player)> {
        self.players
            .get_map_mut()
            .iter_mut()
            .find(|(_, p)| p.get_name().eq(name))
    }

    pub(crate) fn get_player_from_name(&self, name: &String) -> Option<(&PlayerId, &Player)> {
        self.players
            .get_map()
            .iter()
            .find(|(_, p)| p.get_name().eq(name))
    }

    pub(crate) fn get_player_from_guid(&self, guid: &PlayerGuid) -> Option<(&PlayerId, &Player)> {
        self.players
            .get_map()
            .iter()
            .find(|(_, p)| p.get_guid().eq(guid))
    }

    pub(crate) fn get_player_from_guid_mut(
        &mut self,
        guid: &PlayerGuid,
    ) -> Option<(&PlayerId, &mut Player)> {
        self.players
            .get_map_mut()
            .iter_mut()
            .find(|(_, p)| p.get_guid().eq(guid))
    }
}
