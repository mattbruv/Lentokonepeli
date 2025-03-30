use crate::{
    entities::{
        background_item::BackgroundItem,
        bomb::Bomb,
        bullet::Bullet,
        bunker::Bunker,
        coast::Coast,
        container::{
            BackgroundItemId, BombId, BulletId, BunkerId, CoastId, EntityContainer, ExplosionId,
            GroundId, HillId, ManId, PlaneId, PlayerId, RunwayId, WaterId,
        },
        explosion::Explosion,
        ground::Ground,
        hill::Hill,
        man::Man,
        plane::Plane,
        player::Player,
        runway::{self, Runway},
        types::EntityType,
        water::Water,
        world_info::WorldInfo,
    },
    input::ServerInput,
    output::ServerOutput,
    replay::ReplayFile,
};

pub const DIRECTIONS: i32 = 256;
pub const RESOLUTION: i32 = 100;
pub const LEVEL_BORDER_X: i16 = 20_000;

pub struct World {
    game_tick: u32,
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
}

impl World {
    pub fn new() -> Self {
        let world = World {
            game_tick: 0,
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

    pub(crate) fn get_tick(&self) -> u32 {
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

        // 1. Tick runnable entities and capture output actions
        let runnable_actions = self.tick_entities();

        // 2. Process runnable actions
        let run_actions = self.process_actions(runnable_actions);
        self.game_output.extend(run_actions);

        // 3. Process collision and get output
        let tick_coll = self.tick_collision_entities();
        self.game_output.extend(tick_coll);
    }

    pub fn flush_changed_state(&mut self) -> Vec<ServerOutput> {
        // pull the changed state
        let updated_state = self.get_changed_state();

        if updated_state.len() > 0 {
            // web_sys::console::log_1(&format!("{:?}", updated_state).into());
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

    pub(crate) fn get_player_from_guid(&self, guid: &String) -> Option<(&PlayerId, &Player)> {
        self.players
            .get_map()
            .iter()
            .find(|(_, p)| p.get_guid().eq(guid))
    }

    pub(crate) fn get_player_from_guid_mut(
        &mut self,
        guid: &String,
    ) -> Option<(&PlayerId, &mut Player)> {
        self.players
            .get_map_mut()
            .iter_mut()
            .find(|(_, p)| p.get_guid().eq(guid))
    }
}
