use crate::{
    entities::{entity::Entity, types::EntityType},
    input::PlayerKeyboard,
    tick_actions::Action,
    world::World,
};

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
        let mut actions = vec![];

        // Tick men
        // TODO: tick all men, not just men controlled by players
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

        // Tick bullets
        for (bullet_id, bullet) in self.bullets.get_map_mut() {
            actions.extend(bullet.tick(&bullet_id));
        }

        // Tick Explosions
        for (explosion_id, explosion) in self.explosions.get_map_mut() {
            actions.extend(explosion.tick(*explosion_id));
        }

        // Tick Runways
        for (_, runway) in self.runways.get_map_mut() {
            runway.tick();
        }

        // Tick Planes
        for (plane_id, plane) in self.planes.get_map_mut() {
            let keyboard: Option<&PlayerKeyboard> = match self
                .players
                .get_player_controlling(plane.get_type(), *plane_id)
            {
                Some(p) => Some(p.get_keys()),
                None => None,
            };

            let runway = match plane.get_runway() {
                Some(rid) => self.runways.get(rid),
                None => None,
            };

            actions.extend(plane.tick(plane_id, runway, keyboard));
        }

        actions
    }
}
