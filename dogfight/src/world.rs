use std::vec;

use crate::{
    entities::{
        container::EntityContainer, man::Man, plane::Plane, player::Player, EntityType, Team,
    },
    network::EntityChange,
};

pub const RESOLUTION: i32 = 100;

pub struct World {
    players: EntityContainer<Player>,
    planes: EntityContainer<Plane>,
    men: EntityContainer<Man>,
}

impl World {
    pub fn new() -> Self {
        let mut w = World {
            men: EntityContainer::new(EntityType::Man),
            planes: EntityContainer::new(EntityType::Plane),
            players: EntityContainer::new(EntityType::Player),
        };

        w.players.insert(Player::new("matt".into()));

        w.men.insert(Man::new(Team::Allies));
        w.men.insert(Man::new(Team::Centrals));
        w.men.insert(Man::new(Team::Centrals));

        w.planes.insert(Plane::new());

        w
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
        state
    }

    pub fn get_changed_state(&mut self) -> Vec<EntityChange> {
        let mut state = vec![];
        state.extend(self.men.get_all_changed_state());
        state.extend(self.planes.get_all_changed_state());
        state.extend(self.players.get_all_changed_state());
        state
    }
}
