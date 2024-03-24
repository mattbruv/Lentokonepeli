use crate::{entities::container::EntityContainer, world::World};

pub struct Game {
    world: World,
}

impl Game {
    pub fn new() -> Game {
        Game {
            world: World::new(),
        }
    }
    pub fn tick(&mut self) {
        println!("tick!")
    }
}
