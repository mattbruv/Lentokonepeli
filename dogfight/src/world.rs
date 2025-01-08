use crate::{
    entities::{
        background_item::BackgroundItem,
        bomb::Bomb,
        bunker::Bunker,
        coast::Coast,
        container::EntityContainer,
        ground::Ground,
        man::Man,
        plane::{Plane, PlaneType},
        player::Player,
        runway::Runway,
        types::EntityType,
        water::Water,
        world_info::WorldInfo,
        EntityId,
    },
    input::GameInput,
    output::GameOutput,
};

pub const DIRECTIONS: i32 = 256;
pub const RESOLUTION: i32 = 100;
pub const LEVEL_BORDER_X: i16 = 20_000;

pub struct World {
    game_tick: u32,
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
        };

        world
    }

    pub fn init(&mut self) -> () {}

    pub fn init_debug(&mut self) -> () {
        let mut debug_plane = Plane::new(PlaneType::Fokker);
        let debug_bomb = Bomb::new(-2490, -200, 0, 1.0);

        debug_plane.set_position(-2490, -20);

        self.planes.insert(debug_plane);
        self.bombs.insert(debug_bomb);
    }

    pub fn tick(&mut self, input: Vec<GameInput>) -> Vec<GameOutput> {
        self.game_tick += 1;

        if self.game_tick == 50 {
            self.init_debug();
        }

        if let Some(p) = self.planes.get_mut(0) {
            p.set_direction(p.get_direction() + 1);
        }

        // process input data
        let mut game_output: Vec<GameOutput> = vec![];
        let input_events = self.handle_input(input);
        game_output.extend(input_events);

        // 1. Tick runnable entities and capture output actions
        let runnable_actions = self.tick_entities();

        // 2. Process runnable actions
        game_output.extend(self.process_actions(runnable_actions));

        // 3. Process collision
        let collision_actions = self.tick_collision_entities();

        // 4. Process collision actions
        game_output.extend(self.process_actions(collision_actions));

        // return the changed state
        let updated_state = self.get_changed_state();

        if updated_state.len() > 0 {
            game_output.push(GameOutput::EntityChanges(updated_state));
        }

        game_output
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
