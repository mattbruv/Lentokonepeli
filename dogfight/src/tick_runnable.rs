use crate::{entities::types::EntityType, tick_actions::Action, world::World};

/*

TODO:

Break this out into separate files to manage what I'm sure will be large blocks of code

1. Step to tick movable entities.
    - This will just basically move entities, or suicide/parachute in some instances.
    - To handle special events which affect the game world, we will return
      some enum describing the event, such as TickEvent::Suicide(...),
      or TickEvent::AbandonPlane(...), TickEvent::Shoot(...), TickEvent::CreateExplosion(...)

2. Loop over tick events and process each one afterwards

3. Process collisions.
    - Figure out how to handle this

*/

impl World {
    /*
        Runnable entities:
            - Bomb
            - Explosion
            - Plane
            - Ghost (?)
            - Runway
            - Bullet
            - Man
            - Bunker
    */
    pub fn tick_entities(&mut self) -> Vec<Action> {
        let mut run_actions = vec![];

        // Tick men
        for (_, player) in self.players.get_map_mut() {
            if let Some(controlled) = player.get_controlling() {
                match controlled.entity_type {
                    EntityType::Man => {
                        if let Some(man) = self.men.get_mut(controlled.id) {
                            man.tick(player.get_keys());
                        }
                    }
                    _ => (),
                };
            }
        }

        // Tick bombs
        for (_, bomb) in self.bombs.get_map_mut() {
            bomb.tick();
        }

        // Tick Explosions
        for (explosion_id, explosion) in self.explosions.get_map_mut() {
            run_actions.extend(explosion.tick(*explosion_id));
        }

        run_actions
    }
}
