use std::f64::consts::PI;

use crate::{
    collision::SolidEntity,
    debug::log,
    entities::{entity::Entity, man::ManState, plane::PlaneMode, types::EntityType, EntityId},
    output::ServerOutput,
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
    pub fn tick_collision_entities(&mut self) -> Vec<ServerOutput> {
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
                            // If we're falling faster than a certain speed, kill player.
                            if man.die_from_fall() {
                                actions.push(Action::RemoveEntity(RemoveData {
                                    ent_id: *man_id,
                                    ent_type: man.get_type(),
                                }));
                            } else {
                                man.set_state(ManState::Standing);
                                let h = man.get_collision_image().unwrap().height();
                                man.set_client_y(ground.get_collision_bounds().y - h as i16);
                            }
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
            for (_water_id, water) in self.waters.get_map_mut() {
                //
                if man.check_collision(water) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                    continue 'men;
                }
            }

            for (_runway_id, runway) in self.runways.get_map_mut() {
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
                    log("Bomb collision ground!?".to_string());
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

            for (plane_id, plane) in self.planes.get_map_mut() {
                if bomb.player_id() != plane.player_id() && bomb.check_collision(plane) {
                    log("Bomb collision plane?".to_string());
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *plane_id,
                        ent_type: plane.get_type(),
                    }));
                    blow_up(
                        &mut actions,
                        bomb_id,
                        bomb.get_type(),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );
                    continue 'bombs;
                }
            }

            for (man_id, man) in self.men.get_map_mut() {
                if bomb.check_collision(man) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                    blow_up(
                        &mut actions,
                        bomb_id,
                        bomb.get_type(),
                        man.get_client_x(),
                        man.get_client_y(),
                    );
                    continue 'bombs;
                }
            }

            for (_, runway) in self.runways.get_map_mut() {
                if bomb.check_collision(runway) {
                    runway.subtract_health(30);
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
            for (man_id, man) in self.men.get_map_mut() {
                if bullet.check_collision(man) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *bullet_id,
                        ent_type: bullet.get_type(),
                    }));
                    // Kill man
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *man_id,
                        ent_type: man.get_type(),
                    }));
                    continue 'bullets;
                }
            }

            for (_, plane) in self.planes.get_map_mut() {
                // Don't collide our own bullet with our own plane
                if bullet.player_id() != plane.player_id() && bullet.check_collision(plane) {
                    let amount = (30.0 * bullet.get_damage_factor()) as i32;
                    plane.subtract_health(amount);
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *bullet_id,
                        ent_type: bullet.get_type(),
                    }));
                    continue 'bullets;
                }
            }

            for (bomb_id, bomb) in self.bombs.get_map_mut() {
                // Don't collide our own bullet with our own plane
                if bullet.check_collision(bomb) {
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *bullet_id,
                        ent_type: bullet.get_type(),
                    }));

                    blow_up(
                        &mut actions,
                        bomb_id,
                        bomb.get_type(),
                        bomb.get_x(),
                        bomb.get_y(),
                    );

                    continue 'bullets;
                }
            }

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
                    let amount = (4.0 * bullet.get_damage_factor()) as i32;
                    runway.subtract_health(amount);
                    actions.push(Action::RemoveEntity(RemoveData {
                        ent_id: *bullet_id,
                        ent_type: bullet.get_type(),
                    }));
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
                    // Do 50 damage, and if this kills the plane, blow it up
                    plane.subtract_health(50);
                    if plane.health() <= 0 {
                        blow_up(
                            &mut actions,
                            plane_id,
                            plane.get_type(),
                            plane.get_client_x(),
                            plane.get_client_y(),
                        );
                    }
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
                    // TODO: check for team
                    // damage runway
                    runway.subtract_health(17);
                }
            }
        }

        actions
    }

    fn collide_planes(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        // First let's check plane to plane collision
        // We need to iterate over the planes in a special way for this
        // To not have two mutable references to the same thing.
        let mut planes: Vec<_> = self.planes.get_map_mut().iter_mut().collect();

        // Thanks ChatGPT + clippy for helping me figure out I needed split_at_mut
        for i in 0..planes.len() {
            let (left, right) = planes.split_at_mut(i + 1);
            let (_, plane) = &mut left[i];

            for (_, other) in right.iter_mut() {
                if plane.check_collision(*other) {
                    plane.do_plane_collision();
                    other.do_plane_collision();
                }
            }
        }

        // Check plane collision against everything else
        'planes: for (plane_id, plane) in self.planes.get_map_mut() {
            for (man_id, man) in self.men.get_map_mut() {
                if plane.check_collision(man) {
                    // Only kill the man if the invincibility grace period has passed.
                    //log(format!("{}", man.age_ms));
                    if man.past_grace_period() {
                        actions.push(Action::RemoveEntity(RemoveData {
                            ent_id: *man_id,
                            ent_type: man.get_type(),
                        }));
                    }
                }
            }

            for (_, ground) in self.grounds.get_map_mut() {
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

            for (_, coast) in self.coasts.get_map_mut() {
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

            for (_, water) in self.waters.get_map_mut() {
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

                    let plane_has_player = self
                        .players
                        .get_player_controlling(plane.get_type(), *plane_id)
                        .is_some();

                    if plane_has_player && plane.can_land_on_runway(runway) {
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

    // Get bounding boxes of all collide-able objects
    //
}

pub fn blow_up(
    actions: &mut Vec<Action>,
    ent_id: &EntityId,
    ent_type: EntityType,
    explosion_x: i16,
    explosion_y: i16,
) -> () {
    actions.push(Action::RemoveEntity(RemoveData {
        ent_id: *ent_id,
        ent_type: ent_type,
    }));
    actions.push(Action::Explosion(ExplosionData {
        team: None,
        client_x: explosion_x,
        client_y: explosion_y,
    }));
}
