use crate::{
    collision::SolidEntity,
    entities::{bomb::Bomb, entity::Entity, man::ManState, types::EntityType, EntityId},
    output::GameOutput,
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
    pub fn tick_collision_entities(&mut self) -> Vec<GameOutput> {
        let mut output = vec![];

        let man_actions = self.collide_men();
        output.extend(self.process_actions(man_actions));

        let bomb_actions = self.collide_bombs();
        output.extend(self.process_actions(bomb_actions));

        let plane_actions = self.collide_planes();
        output.extend(self.process_actions(plane_actions));

        output
    }

    fn collide_men(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        'men: for (man_id, man) in self.men.get_map_mut() {
            // Man -> Ground
            for (_, ground) in self.grounds.get_map_mut() {
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

                    //web_sys::console::log_1(&format!("man collide ground!").into());
                    continue 'men;
                }
            }

            // Man -> Coast
            for (_, coast) in self.coasts.get_map_mut() {
                //
                if man.check_collision(coast) {
                    // just kill me
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                    //web_sys::console::log_1(&format!("man collide coast!").into());
                    continue 'men;
                }
            }

            // Man -> Water
            for (water_id, water) in self.waters.get_map_mut() {
                //
                if man.check_collision(water) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                    continue 'men;
                }
            }

            for (runway_id, runway) in self.runways.get_map_mut() {
                //
                if man.check_collision(runway) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                    // web_sys::console::log_1(&format!("man collide runway!").into());
                    continue 'men;
                }
            }

            for (_, explosion) in self.explosions.get_map_mut() {
                if man.check_collision(explosion) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                    // web_sys::console::log_1(&format!("man collide runway!").into());
                    continue 'men;
                }
            }
        }

        actions
    }

    fn collide_bombs(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        'bombs: for (bomb_id, bomb) in self.bombs.get_map_mut() {
            for (_, ground) in self.grounds.get_map_mut() {
                if bomb.check_collision(ground) {
                    blow_up(
                        &mut actions,
                        bomb_id,
                        bomb.get_type(),
                        bomb.get_x(),
                        bomb.get_y(),
                    );
                    //web_sys::console::log_1(&format!("bomb collide ground!").into());
                    continue 'bombs;
                }
            }

            for (_, coast) in self.coasts.get_map_mut() {
                if bomb.check_collision(coast) {
                    blow_up(
                        &mut actions,
                        bomb_id,
                        bomb.get_type(),
                        bomb.get_x(),
                        bomb.get_y(),
                    );
                    //web_sys::console::log_1(&format!("bomb collide coast!").into());
                    continue 'bombs;
                }
            }

            for (_, water) in self.waters.get_map_mut() {
                if bomb.check_collision(water) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *bomb_id,
                        ent_type: bomb.get_type(),
                    }));
                    //web_sys::console::log_1(&format!("bomb collide water!").into());
                    continue 'bombs;
                }
            }

            for (_, runway) in self.runways.get_map_mut() {
                if bomb.check_collision(runway) {
                    blow_up(
                        &mut actions,
                        bomb_id,
                        bomb.get_type(),
                        bomb.get_x(),
                        bomb.get_y(),
                    );
                    continue 'bombs;
                }
            }
        }

        actions
    }

    fn collide_planes(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        'planes: for (plane_id, plane) in self.planes.get_map_mut() {
            for (ground_id, ground) in self.grounds.get_map_mut() {
                if plane.check_collision(ground) {
                    blow_up(
                        &mut actions,
                        plane_id,
                        plane.get_type(),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );
                    continue 'planes;
                }
            }

            for (coast_id, coast) in self.coasts.get_map_mut() {
                if plane.check_collision(coast) {
                    blow_up(
                        &mut actions,
                        plane_id,
                        plane.get_type(),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );
                    continue 'planes;
                }
            }

            for (water_id, water) in self.waters.get_map_mut() {
                if plane.check_collision(water) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *plane_id,
                        ent_type: plane.get_type(),
                    }));
                    continue 'planes;
                }
            }

            for (runway_id, runway) in self.runways.get_map_mut() {
                if plane.check_collision(runway) {
                    blow_up(
                        &mut actions,
                        plane_id,
                        plane.get_type(),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );
                    continue 'planes;
                }
            }

            for (_, explosion) in self.explosions.get_map_mut() {
                if plane.check_collision(explosion) {
                    blow_up(
                        &mut actions,
                        plane_id,
                        plane.get_type(),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );
                    // web_sys::console::log_1(&format!("man collide runway!").into());
                    continue 'planes;
                }
            }
        }

        actions
    }

    // Get bounding boxes of all collidable objects
    //
}

pub fn blow_up(
    actions: &mut Vec<Action>,
    ent_id: &EntityId,
    ent_type: EntityType,
    x: i16,
    y: i16,
) -> () {
    actions.push(Action::RemoveEntity(RemoveData {
        ent_id: *ent_id,
        ent_type: ent_type,
    }));
    actions.push(Action::Explosion(ExplosionData {
        team: None,
        x: x,
        y: y,
    }));
}
