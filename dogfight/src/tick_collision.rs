use crate::{
    collision::SolidEntity,
    entities::{bomb::Bomb, entity::Entity, man::ManState, EntityId},
    tick_actions::{Action, ExplosionData, RemoveData},
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
        actions.extend(self.collide_bombs());

        actions
    }

    fn collide_men(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        'men: for (man_id, man) in self.men.get_map_mut() {
            // Man -> Ground
            for (ground_id, ground) in self.grounds.get_map() {
                if man.check_collision(ground) {
                    match man.get_state() {
                        // Update the state to walking only if we're not already doing it.
                        ManState::Falling | ManState::Parachuting => {
                            man.set_state(ManState::Standing);
                            let h = man.get_collision_image().unwrap().height();
                            man.set_client_y(ground.get_collision_bounds().y - h as i16);
                        }
                        _ => {}
                    };

                    web_sys::console::log_1(&format!("man collide ground!").into());
                    break 'men;
                }
            }

            // Man -> Coast
            for (coast_id, coast) in self.coasts.get_map() {
                //
                if man.check_collision(coast) {
                    match man.get_state() {
                        // Update the state to walking only if we're not already doing it.
                        ManState::Falling | ManState::Parachuting => {
                            man.set_state(ManState::Standing);
                        }
                        _ => {}
                    }
                    web_sys::console::log_1(&format!("man collide coast!").into());
                    break 'men;
                }
            }

            // Man -> Water
            for (water_id, water) in self.waters.get_map() {
                //
                if man.check_collision(water) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                    break 'men;
                }
            }

            for (runway_id, runway) in self.runways.get_map() {
                //
                if man.check_collision(runway) {
                    web_sys::console::log_1(&format!("man collide runway!").into());
                    break 'men;
                }
            }
        }

        actions
    }

    fn collide_bombs(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        let mut blow_up = |bomb_id: &EntityId, bomb: &Bomb, x: i16, y: i16| {
            actions.push(Action::RemoveEntity(RemoveData {
                ent_id: *bomb_id,
                ent_type: bomb.get_type(),
            }));
            actions.push(Action::Explosion(ExplosionData {
                team: None,
                x: x,
                y: y,
            }));
        };

        'bombs: for (bomb_id, bomb) in self.bombs.get_map_mut() {
            for (ground_id, ground) in self.grounds.get_map() {
                if bomb.check_collision(ground) {
                    blow_up(bomb_id, bomb, bomb.get_x(), bomb.get_y());
                    web_sys::console::log_1(&format!("bomb collide ground!").into());
                    break 'bombs;
                }
            }

            for (coast_id, coast) in self.coasts.get_map() {
                if bomb.check_collision(coast) {
                    web_sys::console::log_1(&format!("bomb collide coast!").into());
                    break 'bombs;
                }
            }

            for (water_id, water) in self.waters.get_map() {
                if bomb.check_collision(water) {
                    web_sys::console::log_1(&format!("bomb collide water!").into());
                    break 'bombs;
                }
            }

            for (runway_id, runway) in self.runways.get_map() {
                if bomb.check_collision(runway) {
                    web_sys::console::log_1(&format!("bomb collide runway!").into());
                    break 'bombs;
                }
            }
        }

        actions
    }

    // Get bounding boxes of all collidable objects
    //
}
