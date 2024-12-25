use crate::{
    collision::{DebugEntity, SolidEntity},
    entities::{
        background_item::BackgroundItem, bunker::Bunker, coast::Coast, container::EntityContainer,
        ground::Ground, man::Man, plane::Plane, player::Player, runway::Runway, types::EntityType,
        water::Water, world_info::WorldInfo, EntityId,
    },
    input::GameInput,
    output::GameOutput,
};

pub const RESOLUTION: i32 = 100;
pub const LEVEL_BORDER_X: i16 = 20_000;

pub struct World {
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
}

impl World {
    pub fn new() -> Self {
        let world = World {
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
        };

        world
    }

    pub fn init(&mut self) -> () {}

    pub fn tick(&mut self, input: Vec<GameInput>) -> Vec<GameOutput> {
        // process input data
        let mut game_output: Vec<GameOutput> = vec![];
        let input_events = self.handle_input(input);
        game_output.extend(input_events);

        self.tick_controlled_entities();

        // return the changed state
        let updated_state = self.get_changed_state();

        if updated_state.len() > 0 {
            game_output.push(GameOutput::EntityChanges(updated_state));
        }

        game_output
    }

    pub fn debug(&self) -> String {
        let mut debug_info: Vec<DebugEntity> = vec![];

        let man_bounds: Vec<DebugEntity> = self
            .men
            .get_map()
            .iter()
            .map(|(idx, man)| {
                let bounds = man.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Man,
                    bounding_box: bounds,
                }
            })
            .collect();

        let water_bounds: Vec<DebugEntity> = self
            .waters
            .get_map()
            .iter()
            .map(|(idx, water)| {
                let bounds = water.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Water,
                    bounding_box: bounds,
                }
            })
            .collect();

        let ground_bounds: Vec<DebugEntity> = self
            .grounds
            .get_map()
            .iter()
            .map(|(idx, ground)| {
                let bounds = ground.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Ground,
                    bounding_box: bounds,
                }
            })
            .collect();

        debug_info.extend(man_bounds);
        debug_info.extend(ground_bounds);
        debug_info.extend(water_bounds);

        serde_json::to_string(&debug_info).unwrap()
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
