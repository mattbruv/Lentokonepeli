use crate::{
    entities::{
        background_item::BackgroundItem, bomb::Bomb, bullet::Bullet, bunker::Bunker, coast::Coast,
        container::EntityContainer, explosion::Explosion, ground::Ground, hill::Hill, man::Man,
        plane::Plane, player::Player, runway::Runway, types::EntityType, water::Water,
        world_info::WorldInfo, EntityId,
    },
    input::ServerInput,
    output::ServerOutput,
};

pub const DIRECTIONS: i32 = 256;
pub const RESOLUTION: i32 = 100;
pub const LEVEL_BORDER_X: i16 = 20_000;

pub struct World {
    game_tick: u32,
    game_output: Vec<ServerOutput>,
    pub world_info: WorldInfo,
    pub players: EntityContainer<Player>,
    pub planes: EntityContainer<Plane>,
    pub background_items: EntityContainer<BackgroundItem>,
    pub men: EntityContainer<Man>,
    pub grounds: EntityContainer<Ground>,
    pub coasts: EntityContainer<Coast>,
    pub runways: EntityContainer<Runway>,
    pub waters: EntityContainer<Water>,
    pub bunkers: EntityContainer<Bunker>,
    pub bombs: EntityContainer<Bomb>,
    pub explosions: EntityContainer<Explosion>,
    pub hills: EntityContainer<Hill>,
    pub bullets: EntityContainer<Bullet>,
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

    fn spawn_debug_bomb(&mut self) -> () {
        //for i in 0..2 {
        //let debug_bomb = Bomb::new(-2490 + i * 50, -300, 0.0, 0.0);
        //self.bombs.insert(debug_bomb);
        //}
    }

    pub fn tick(&mut self, input: Vec<ServerInput>) -> () {
        self.game_tick += 1;

        if self.game_tick == 50 {
            self.init_debug();
        }

        if self.bombs.get_map().len() == 0 {
            // self.spawn_bomb();
        }

        if let Some(p) = self.planes.get_mut(0) {
            // p.set_direction(p.get_direction() + 1);
        }

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

    pub(crate) fn get_player_from_name(
        &mut self,
        name: &String,
    ) -> Option<(&EntityId, &mut Player)> {
        self.players
            .get_map_mut()
            .iter_mut()
            .find(|(_, p)| p.get_name().eq(name))
    }

    pub(crate) fn get_player_id_from_name(&self, name: &String) -> Option<EntityId> {
        let player = self
            .players
            .get_map()
            .iter()
            .find(|(_, p)| p.get_name().eq(name));

        if let Some((id, _)) = player {
            return Some(*id);
        }
        None
    }
}
