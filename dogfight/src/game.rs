use crate::world::World;

pub struct Game {
    world: World,
}

impl Game {
    pub fn new() -> Game {
        Game {
            world: World {
                name: "Foo bar baz".to_string(),
            },
        }
    }
    pub fn tick(&mut self) {
        println!("tick! {}", self.world.name)
    }
}
