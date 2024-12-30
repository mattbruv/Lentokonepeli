use crate::{
    collision::SolidEntity,
    entities::{entity::Entity, man::ManState},
    tick_actions::{Action, KillData},
    world::World,
};

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
        let mut actions = vec![];

        actions.extend(self.collide_men());

        actions
    }

    fn collide_men(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        'men: for (man_id, man) in self.men.get_map_mut() {
            // Man -> Ground
            for (ground_id, ground) in self.grounds.get_map() {
                if man.check_collision(ground) {
                    man.set_client_y(ground.get_y());
                    match man.get_state() {
                        // Update the state to walking only if we're not already doing it.
                        ManState::Falling | ManState::Parachuting => {
                            man.set_state(ManState::Standing);
                        }
                        _ => {}
                    }
                }
            }

            // Man -> Water
            for (water_id, water) in self.waters.get_map() {
                //
                if man.check_collision(water) {
                    actions.push(Action::Kill(KillData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                    break 'men;
                }
            }
        }

        actions
    }

    // Get bounding boxes of all collidable objects
    //
}
