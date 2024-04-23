use std::vec;

use crate::{
    entities::{
        background_item::BackgroundItem,
        bunker::Bunker,
        coast::Coast,
        container::EntityContainer,
        ground::Ground,
        man::Man,
        plane::Plane,
        player::Player,
        runway::Runway,
        types::{EntityType, Team},
        water::Water,
    },
    network::EntityChange,
};

pub const RESOLUTION: i32 = 100;
pub const LEVEL_BORDER_X: i16 = 20_000;

pub struct World {
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

    pub fn init(&mut self) -> () {
        let mut m = Man::new(Team::Centrals);
        m.set_client_x(100);
        m.set_client_y(-150);
        self.men.insert(m);
    }

    pub fn test(&mut self) -> () {
        if let Some(m) = self.men.get_mut(0) {
            m.set_x(m.get_x() + 100);
            m.set_x(m.get_x() + 100);
            m.set_x(m.get_x() + 100);
            m.set_x(m.get_x() + 100);
            m.set_x(m.get_x() + 100);
            m.set_x(m.get_x() + 100);
            m.set_x(m.get_x() + 100);
        }
    }

    pub fn get_full_state(&self) -> Vec<EntityChange> {
        let mut state = vec![];
        state.extend(self.men.get_all_full_state());
        state.extend(self.planes.get_all_full_state());
        state.extend(self.players.get_all_full_state());
        state.extend(self.background_items.get_all_full_state());
        state.extend(self.grounds.get_all_full_state());
        state.extend(self.coasts.get_all_full_state());
        state.extend(self.runways.get_all_full_state());
        state.extend(self.waters.get_all_full_state());
        state.extend(self.bunkers.get_all_full_state());
        state
    }

    pub fn get_changed_state(&mut self) -> Vec<EntityChange> {
        let mut state = vec![];
        state.extend(self.men.get_all_changed_state());
        state.extend(self.planes.get_all_changed_state());
        state.extend(self.players.get_all_changed_state());
        state.extend(self.background_items.get_all_changed_state());
        state.extend(self.grounds.get_all_changed_state());
        state.extend(self.coasts.get_all_changed_state());
        state.extend(self.runways.get_all_changed_state());
        state.extend(self.waters.get_all_changed_state());
        state.extend(self.bunkers.get_all_changed_state());
        state
    }
}
