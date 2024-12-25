use crate::{collision::SolidEntity, tick_actions::Action, world::World};

impl World {
    /*
        Collision entities:
            - Bomb
            - Coast
            - Ground
            - Bullet
            - Plane
            - Bunker
            - Water
            - Explosion
            - Man
            - Runway

        Active:
            - Bomb
            - Bullet
            - Plane
            - Explosion
            - Man

        We won't ever need to worry about checking bunker <-> ground collision
        or basically any combination of static objects against other static objects
        Static:
            - Runway
            - Bunker
            - Water
            - Ground
            - Coast
    */
    pub fn tick_collision_entities(&mut self) -> Vec<Action> {
        let collision_actions = vec![];
        let x = self
            .men
            .get_map()
            .iter()
            .map(|m| m.1.get_collision_bounds());

        /*
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
        */

        collision_actions
    }

    // Get bounding boxes of all collidable objects
    //
}
