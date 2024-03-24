use crate::{
    entities::{container::EntityContainer, man::Man, plane::Plane, EntityType, Team},
    network::EntityState,
};

pub const RESOLUTION: i32 = 100;

pub struct World {
    planes: EntityContainer<Plane>,
    men: EntityContainer<Man>,
}

impl World {
    pub fn new() -> Self {
        let mut w = World {
            men: EntityContainer::new(EntityType::Man),
            planes: EntityContainer::new(EntityType::Plane),
        };

        w.men.insert(Man::new(Team::Allies));
        //w.men.insert(Man::new(Team::Centrals));
        //w.men.insert(Man::new(Team::Centrals));

        w
    }

    pub fn get_state(&self) -> Vec<EntityState> {
        self.men.get_all_full_state()
    }
}
