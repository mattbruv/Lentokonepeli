use std::f64::consts::PI;

use crate::{
    collision::SolidEntity,
    entities::{
        bomb::Bomb,
        entity::Entity,
        man::ManState,
        plane::PlaneMode,
        types::{EntityType, Facing},
        EntityId,
    },
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

        let bullet_actions = self.collide_bullets();
        output.extend(self.process_actions(bullet_actions));

        let bomb_actions = self.collide_bombs();
        output.extend(self.process_actions(bomb_actions));

        let plane_actions = self.collide_planes();
        output.extend(self.process_actions(plane_actions));

        let explosion_actions = self.collide_explosions();
        output.extend(self.process_actions(explosion_actions));

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

    fn collide_bullets(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        'bullets: for (bullet_id, bullet) in self.bullets.get_map_mut() {
            for (_, ground) in self.grounds.get_map_mut() {
                if bullet.check_collision(ground) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *bullet_id,
                        ent_type: bullet.get_type(),
                    }));
                    continue 'bullets;
                }
            }

            for (_, coast) in self.coasts.get_map_mut() {
                if bullet.check_collision(coast) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *bullet_id,
                        ent_type: bullet.get_type(),
                    }));
                    continue 'bullets;
                }
            }

            for (_, water) in self.waters.get_map_mut() {
                if bullet.check_collision(water) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *bullet_id,
                        ent_type: bullet.get_type(),
                    }));
                    continue 'bullets;
                }
            }

            for (_, runway) in self.runways.get_map_mut() {
                if bullet.check_collision(runway) {
                    blow_up(
                        &mut actions,
                        bullet_id,
                        bullet.get_type(),
                        bullet.get_x(),
                        bullet.get_y(),
                    );
                    continue 'bullets;
                }
            }
        }

        actions
    }

    fn collide_explosions(&mut self) -> Vec<Action> {
        let mut actions = vec![];
        //

        '_explosions: for (_, explosion) in self.explosions.get_map_mut() {
            for (plane_id, plane) in self.planes.get_map_mut() {
                if explosion.check_collision(plane) {
                    blow_up(
                        &mut actions,
                        plane_id,
                        plane.get_type(),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );
                }
            }

            for (man_id, man) in self.men.get_map_mut() {
                if explosion.check_collision(man) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                }
            }

            for (_, runway) in self.runways.get_map_mut() {
                if explosion.check_collision(runway) {
                    // damage runway
                    // TODO: check for team
                    runway.set_health(0);
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
                    let mode = plane.get_mode();
                    let runway_id_matches = match plane.get_runway() {
                        Some(rid) => rid == *runway_id,
                        None => false,
                    };

                    if (mode == PlaneMode::Landing
                        || mode == PlaneMode::Landed
                        || mode == PlaneMode::TakingOff)
                        && runway_id_matches
                    {
                        continue 'planes;
                    }

                    if plane.can_land_on_runway(runway) {
                        if plane.flipped() {
                            plane.set_angle(PI);
                        } else {
                            plane.set_angle(0.0);
                        }

                        web_sys::console::log_1(&format!("plane can land on runway").into());
                        plane.set_client_y(runway.get_landable_y() - plane.get_bottom_height());
                        if plane.is_facing_runway_correctly(runway) {
                            web_sys::console::log_1(
                                &format!("plane facing runway correctly").into(),
                            );
                            plane.set_mode(PlaneMode::Landing);
                            plane.set_runway(Some(*runway_id));
                        }
                    } else {
                        blow_up(
                            &mut actions,
                            plane_id,
                            plane.get_type(),
                            plane.get_client_x(),
                            plane.get_client_y(),
                        );
                    }
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
