use crate::{
    entities::player::ControllingEntity, input::PlayerKeyboard, tick_actions::Action, world::World,
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

        for (player_id, player) in self.players.get_map_mut() {
            if let Some(controlled) = player.get_controlling() {
                match controlled {
                    // Tick men
                    ControllingEntity::Man(man_id) => {
                        if let Some(man) = self.men.get_mut(man_id) {
                            actions.extend(man.tick(*player_id, man_id, player.get_keys()));
                        }
                    }
                    // If the player has landed and is parked, process their takeoff requests
                    ControllingEntity::Runway(runway_id, plane_type) => {
                        if player.get_keys().enter {
                            actions.push(Action::ProcessTakeoff(*player_id, runway_id, plane_type));
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
            let player = self
                .players
                .get_player_controlling(ControllingEntity::Plane(*plane_id));

            let pid = player.as_ref().and_then(|x| Some(*x.0));

            let keyboard: Option<&PlayerKeyboard> = match &player {
                Some((_, p)) => Some(p.get_keys()),
                None => None,
            };

            let runway = match plane.get_runway() {
                Some(rid) => self.runways.get(rid).and_then(|r| Some((rid, r))),
                None => None,
            };

            actions.extend(plane.tick(plane_id, pid, runway, keyboard));
        }

        actions
    }
}
