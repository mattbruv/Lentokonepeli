use crate::{entities::types::EntityType, tick_actions::Action, world::World};

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
    */
    pub fn tick_collision_entities(&mut self) -> Vec<Action> {
        let collision_actions = vec![];

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
}
