use std::vec;

use crate::{
    entities::{
        coast::Coast,
        container::EntityContainer,
        flag::Flag,
        ground::Ground,
        man::Man,
        plane::{Plane, PlaneType},
        player::Player,
        runway::Runway,
        types::{EntityType, Facing, Team, Terrain},
    },
    network::EntityChange,
};

pub const RESOLUTION: i32 = 100;
pub const LEVEL_BORDER_X: i16 = 20_000;

pub struct World {
    players: EntityContainer<Player>,
    planes: EntityContainer<Plane>,
    flags: EntityContainer<Flag>,
    men: EntityContainer<Man>,
    grounds: EntityContainer<Ground>,
    coasts: EntityContainer<Coast>,
    runways: EntityContainer<Runway>,
}

impl World {
    pub fn new() -> Self {
        let mut w = World {
            men: EntityContainer::new(EntityType::Man),
            planes: EntityContainer::new(EntityType::Plane),
            players: EntityContainer::new(EntityType::Player),
            flags: EntityContainer::new(EntityType::Flag),
            grounds: EntityContainer::new(EntityType::Ground),
            coasts: EntityContainer::new(EntityType::Coast),
            runways: EntityContainer::new(EntityType::Runway),
        };

        w.players.insert(Player::new("matt".into()));

        w.men.insert(Man::new(Team::Allies));
        w.men.insert(Man::new(Team::Centrals));
        w.men.insert(Man::new(Team::Centrals));

        w.planes.insert(Plane::new(PlaneType::Albatros));
        w.coasts
            .insert(Coast::new(Terrain::Desert, Facing::Left, 10, 20));
        w.runways
            .insert(Runway::new(Team::Centrals, Facing::Right, 10, 20));

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
        state.extend(self.flags.get_all_full_state());
        state.extend(self.grounds.get_all_full_state());
        state.extend(self.coasts.get_all_full_state());
        state.extend(self.runways.get_all_full_state());
        state
    }

    pub fn get_changed_state(&mut self) -> Vec<EntityChange> {
        let mut state = vec![];
        state.extend(self.men.get_all_changed_state());
        state.extend(self.planes.get_all_changed_state());
        state.extend(self.players.get_all_changed_state());
        state.extend(self.flags.get_all_changed_state());
        state.extend(self.grounds.get_all_changed_state());
        state.extend(self.coasts.get_all_changed_state());
        state.extend(self.runways.get_all_changed_state());
        state
    }
}
