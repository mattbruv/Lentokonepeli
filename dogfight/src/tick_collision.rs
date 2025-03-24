use std::f64::consts::PI;

use crate::{
    collision::SolidEntity,
    entities::{
        container::PlayerId,
        man::ManState,
        plane::{Plane, PlaneMode},
        player::{self, ControllingEntity},
    },
    game_event::{KillEvent, KillMethod},
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
            let controlling = self
                .players
                .get_player_controlling(ControllingEntity::Man(*man_id));

            for (_runway_id, runway) in self.runways.get_map_mut() {
                if man.check_collision(runway) {
                    // If we're landing on the correct runway, choose a plane
                    if *runway.get_team() == man.get_team() {
                        actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
                    }
                    // Otherwise, kill the man
                    else {
                        actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));

                        if let Some((pid, _)) = controlling {
                            actions.push(Action::RegisterKill(KillEvent::new(
                                *pid,
                                None,
                                KillMethod::Man,
                            )));
                        }
                    }
                    // web_sys::console::log_1(&format!("man collide runway!").into());
                    continue 'men;
                }
            }

            // Man -> Ground
            for (_, ground) in self.grounds.get_map_mut() {
                if man.check_collision(ground) {
                    match man.get_state() {
                        // Update the state to walking only if we're not already doing it.
                        ManState::Falling | ManState::Parachuting => {
                            // If we're falling faster than a certain speed, kill player.
                            if man.die_from_fall() {
                                if let Some((pid, _)) = controlling {
                                    actions.push(Action::RegisterKill(KillEvent::new(
                                        *pid,
                                        None,
                                        KillMethod::Man,
                                    )));
                                }
                                actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
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
                    if let Some((pid, _)) = controlling {
                        actions.push(Action::RegisterKill(KillEvent::new(
                            *pid,
                            None,
                            KillMethod::Man,
                        )));
                    }
                    // just kill me
                    actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
                    //web_sys::console::log_1(&format!("man collide coast!").into());
                    continue 'men;
                }
            }

            // Man -> Water
            for (_water_id, water) in self.waters.get_map_mut() {
                //
                if man.check_collision(water) {
                    if let Some((pid, _)) = controlling {
                        actions.push(Action::RegisterKill(KillEvent::new(
                            *pid,
                            None,
                            KillMethod::Man,
                        )));
                    }
                    actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
                    continue 'men;
                }
            }
        }

        actions
    }

    fn collide_bombs(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        // First let's check bomb to bomb collision
        // We need to iterate over the bomb in a special way for this
        // To not have two mutable references to the same thing.
        let mut bombs: Vec<_> = self.bombs.get_map_mut().iter_mut().collect();

        for i in 0..bombs.len() {
            let (left, right) = bombs.split_at_mut(i + 1);
            let (bomb_id, bomb) = &mut left[i];

            for (other_id, other) in right.iter_mut() {
                if !bomb.is_alive() || !other.is_alive() {
                    continue;
                }
                if bomb.check_collision(*other) {
                    // Remove these bombs from processing further on in the tick.
                    bomb.kill();
                    other.kill();

                    blow_up(
                        &mut actions,
                        Some(bomb.player_id()),
                        RemoveData::Bomb(**bomb_id),
                        bomb.get_x(),
                        bomb.get_y(),
                    );
                    blow_up(
                        &mut actions,
                        Some(other.player_id()),
                        RemoveData::Bomb(**other_id),
                        other.get_x(),
                        other.get_y(),
                    );
                }
            }
        }

        'bombs: for (bomb_id, bomb) in self.bombs.get_map_mut() {
            if !bomb.is_alive() {
                continue;
            }

            for (plane_id, plane) in self.planes.get_map_mut() {
                if bomb.player_id() != plane.player_id() && bomb.check_collision(plane) {
                    // log("Bomb collision plane?".to_string());

                    if let Some((owner_id, _)) = self
                        .players
                        .get_player_controlling(ControllingEntity::Plane(*plane_id))
                    {
                        // Draw plane death icon
                        actions.push(Action::RegisterKill(KillEvent::new(
                            bomb.player_id(),
                            Some(*owner_id),
                            KillMethod::Plane,
                        )));
                        // draw man death icon
                        actions.push(Action::RegisterKill(KillEvent::new(
                            bomb.player_id(),
                            Some(*owner_id),
                            KillMethod::Man,
                        )));
                    }
                    actions.push(Action::RemoveEntity(RemoveData::Plane(*plane_id)));

                    blow_up(
                        &mut actions,
                        Some(bomb.player_id()),
                        RemoveData::Bomb(*bomb_id),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );
                    continue 'bombs;
                }
            }

            for (man_id, man) in self.men.get_map_mut() {
                if bomb.check_collision(man) {
                    if let Some((owner_id, _)) = self
                        .players
                        .get_player_controlling(ControllingEntity::Man(*man_id))
                    {
                        let victim = (bomb.player_id() != *owner_id).then_some(*owner_id);

                        actions.push(Action::RegisterKill(KillEvent::new(
                            bomb.player_id(),
                            victim,
                            KillMethod::Man,
                        )));
                    }
                    actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
                    blow_up(
                        &mut actions,
                        Some(bomb.player_id()),
                        RemoveData::Bomb(*bomb_id),
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
                        Some(bomb.player_id()),
                        RemoveData::Bomb(*bomb_id),
                        bomb.get_x(),
                        bomb.get_y(),
                    );
                    continue 'bombs;
                }
            }

            for (_, bunker) in self.bunkers.get_map_mut() {
                if bomb.check_collision(bunker) {
                    bunker.subtract_health(30);
                    blow_up(
                        &mut actions,
                        Some(bomb.player_id()),
                        RemoveData::Bomb(*bomb_id),
                        bomb.get_x(),
                        bomb.get_y(),
                    );
                    continue 'bombs;
                }
            }

            for (_, ground) in self.grounds.get_map_mut() {
                if bomb.check_collision(ground) {
                    //log("Bomb collision ground!?".to_string());
                    blow_up(
                        &mut actions,
                        Some(bomb.player_id()),
                        RemoveData::Bomb(*bomb_id),
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
                        Some(bomb.player_id()),
                        RemoveData::Bomb(*bomb_id),
                        bomb.get_x(),
                        bomb.get_y(),
                    );
                    //web_sys::console::log_1(&format!("bomb collide coast!").into());
                    continue 'bombs;
                }
            }

            for (_, water) in self.waters.get_map_mut() {
                if bomb.check_collision(water) {
                    actions.push(Action::RemoveEntity(RemoveData::Bomb(*bomb_id)));
                    //web_sys::console::log_1(&format!("bomb collide water!").into());
                    continue 'bombs;
                }
            }
        }

        actions
    }

    fn collide_bullets(&mut self) -> Vec<Action> {
        let mut actions = vec![];

        // First let's check bullet to bullet collision
        // We need to iterate over the bullet in a special way for this
        // To not have two mutable references to the same thing.
        let mut bullets: Vec<_> = self.bullets.get_map_mut().iter_mut().collect();

        for i in 0..bullets.len() {
            let (left, right) = bullets.split_at_mut(i + 1);
            let (bullet_id, bullet) = &mut left[i];

            for (other_id, other) in right.iter_mut() {
                if !bullet.is_alive() || !other.is_alive() {
                    continue;
                }
                if bullet.check_collision(*other) {
                    // Remove these bullets from processing further on in the tick.
                    bullet.kill();
                    other.kill();

                    actions.push(Action::RemoveEntity(RemoveData::Bullet(**bullet_id)));
                    actions.push(Action::RemoveEntity(RemoveData::Bullet(**other_id)));
                }
            }
        }

        'bullets: for (bullet_id, bullet) in self.bullets.get_map_mut() {
            for (man_id, man) in self.men.get_map_mut() {
                if bullet.check_collision(man) {
                    if let Some((owner_id, _)) = self
                        .players
                        .get_player_controlling(ControllingEntity::Man(*man_id))
                    {
                        // Kill Man if the bullet owner isn't the man owner
                        if bullet.player_id() != *owner_id {
                            actions.push(Action::RegisterKill(KillEvent::new(
                                bullet.player_id(),
                                Some(*owner_id),
                                KillMethod::Man,
                            )));

                            actions.push(Action::RemoveEntity(RemoveData::Bullet(*bullet_id)));
                            actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
                        }
                    }
                    continue 'bullets;
                }
            }

            for (plane_id, plane) in self.planes.get_map_mut() {
                // Don't collide our own bullet with our own plane
                if bullet.player_id() != plane.player_id() && bullet.check_collision(plane) {
                    let amount = (30.0 * bullet.get_damage_factor()) as i32;
                    plane.subtract_health(amount);

                    if plane.health() <= 0 && plane.get_downed_by().is_none() {
                        if let Some((owner_id, _)) = self
                            .players
                            .get_player_controlling(ControllingEntity::Plane(*plane_id))
                        {
                            plane.set_downed_by(Some(bullet.player_id()));
                            actions.push(Action::RegisterKill(KillEvent::new(
                                bullet.player_id(),
                                Some(*owner_id),
                                KillMethod::Plane,
                            )));
                        }
                    }
                    actions.push(Action::RemoveEntity(RemoveData::Bullet(*bullet_id)));
                    continue 'bullets;
                }
            }

            for (bomb_id, bomb) in self.bombs.get_map_mut() {
                // Don't collide our own bullet with our own plane
                if bullet.check_collision(bomb) {
                    actions.push(Action::RemoveEntity(RemoveData::Bullet(*bullet_id)));

                    blow_up(
                        &mut actions,
                        Some(bomb.player_id()),
                        RemoveData::Bomb(*bomb_id),
                        bomb.get_x(),
                        bomb.get_y(),
                    );

                    continue 'bullets;
                }
            }

            for (_, runway) in self.runways.get_map_mut() {
                if bullet.check_collision(runway) {
                    let amount = (4.0 * bullet.get_damage_factor()) as i32;
                    runway.subtract_health(amount);
                    actions.push(Action::RemoveEntity(RemoveData::Bullet(*bullet_id)));
                    continue 'bullets;
                }
            }

            for (_, bunker) in self.bunkers.get_map_mut() {
                if bullet.check_collision(bunker) {
                    let amount = (4.0 * bullet.get_damage_factor()) as i32;
                    bunker.subtract_health(amount);
                    actions.push(Action::RemoveEntity(RemoveData::Bullet(*bullet_id)));
                    continue 'bullets;
                }
            }

            for (_, ground) in self.grounds.get_map_mut() {
                if bullet.check_collision(ground) {
                    actions.push(Action::RemoveEntity(RemoveData::Bullet(*bullet_id)));
                    continue 'bullets;
                }
            }

            for (_, coast) in self.coasts.get_map_mut() {
                if bullet.check_collision(coast) {
                    actions.push(Action::RemoveEntity(RemoveData::Bullet(*bullet_id)));
                    continue 'bullets;
                }
            }

            for (_, water) in self.waters.get_map_mut() {
                if bullet.check_collision(water) {
                    actions.push(Action::RemoveEntity(RemoveData::Bullet(*bullet_id)));
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
            let explosion_owner = explosion.player_id();

            for (plane_id, plane) in self.planes.get_map_mut() {
                if explosion.check_collision(plane) {
                    // Do 50 damage, and if this kills the plane, blow it up
                    plane.subtract_health(50);
                    if plane.health() <= 0 {
                        if let Some((owner_id, _)) = self
                            .players
                            .get_player_controlling(ControllingEntity::Plane(*plane_id))
                        {
                            if let Some(killer) = explosion_owner {
                                plane.set_downed_by(Some(killer));
                                // Draw kill plane icon and kill man icon
                                actions.push(Action::RegisterKill(KillEvent::new(
                                    killer,
                                    Some(*owner_id),
                                    KillMethod::Plane,
                                )));
                                actions.push(Action::RegisterKill(KillEvent::new(
                                    killer,
                                    Some(*owner_id),
                                    KillMethod::Man,
                                )));
                            }
                        }
                        blow_up(
                            &mut actions,
                            explosion.player_id(),
                            RemoveData::Plane(*plane_id),
                            plane.get_client_x(),
                            plane.get_client_y(),
                        );
                    }
                }
            }

            for (man_id, man) in self.men.get_map_mut() {
                if explosion.check_collision(man) {
                    if let Some(killer) = explosion_owner {
                        if let Some((owner_id, _)) = self
                            .players
                            .get_player_controlling(ControllingEntity::Man(*man_id))
                        {
                            let victim = (killer != *owner_id).then_some(*owner_id);
                            // Draw kill plane icon and kill man icon
                            actions.push(Action::RegisterKill(KillEvent::new(
                                killer,
                                victim,
                                KillMethod::Man,
                            )));
                        }
                    }
                    actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
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
        let mut actions: Vec<Action> = vec![];

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

                    if plane.health() <= 0 && plane.get_downed_by().is_none() {
                        plane.set_downed_by(Some(other.player_id()));
                        actions.push(Action::RegisterKill(KillEvent::new(
                            other.player_id(),
                            Some(plane.player_id()),
                            KillMethod::Plane,
                        )));
                    }
                    if other.health() <= 0 && other.get_downed_by().is_none() {
                        other.set_downed_by(Some(plane.player_id()));
                        actions.push(Action::RegisterKill(KillEvent::new(
                            plane.player_id(),
                            Some(other.player_id()),
                            KillMethod::Plane,
                        )));
                    }
                }
            }
        }

        // Check plane collision against everything else
        'planes: for (plane_id, plane) in self.planes.get_map_mut() {
            for (man_id, man) in self.men.get_map_mut() {
                if plane.check_collision(man) {
                    // Only kill the man if the invincibility grace period has passed.
                    //log(format!("{}", man.age_ms));
                    let controlling = self
                        .players
                        .get_player_controlling(ControllingEntity::Man(*man_id));
                    let killer = plane.player_id();

                    // we want to know if we hit ourselves or someone else
                    let victim: Option<PlayerId> = match controlling {
                        // If we hit ourselves, we shouldn't display a victim
                        Some((controlling_player_id, _)) => {
                            if killer == *controlling_player_id {
                                None
                            } else {
                                Some(*controlling_player_id)
                            }
                        }
                        None => None,
                    };

                    if man.past_grace_period() {
                        actions.push(Action::RegisterKill(KillEvent::new(
                            killer,
                            victim,
                            KillMethod::Man,
                        )));
                        actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
                    }
                }
            }

            let controlling = self
                .players
                .get_player_controlling(ControllingEntity::Plane(*plane_id));

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

                    if controlling.is_some() && plane.can_land_on_runway(runway) {
                        if plane.flipped() {
                            plane.set_angle(PI);
                        } else {
                            plane.set_angle(0.0);
                        }

                        web_sys::console::log_1(&format!("plane can land on runway").into());
                        plane.set_client_y(runway.get_landable_y() - plane.get_bottom_height());
                        if plane.is_facing_runway_correctly(runway)
                            && plane.get_team() == *runway.get_team()
                        {
                            web_sys::console::log_1(
                                &format!("plane facing runway correctly").into(),
                            );
                            plane.set_mode(PlaneMode::Landing);
                            plane.set_runway(Some(*runway_id));
                        }
                    } else {
                        kill_plane_and_give_credit(&mut actions, plane, &controlling);
                        blow_up(
                            &mut actions,
                            Some(plane.player_id()),
                            RemoveData::Plane(*plane_id),
                            plane.get_client_x(),
                            plane.get_client_y(),
                        );
                    }
                    continue 'planes;
                }
            }

            for (_, bunker) in self.bunkers.get_map_mut() {
                if plane.check_collision(bunker) {
                    kill_plane_and_give_credit(&mut actions, plane, &controlling);
                    blow_up(
                        &mut actions,
                        Some(plane.player_id()),
                        RemoveData::Plane(*plane_id),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );

                    continue 'planes;
                }
            }

            for (_, ground) in self.grounds.get_map_mut() {
                if plane.check_collision(ground) {
                    kill_plane_and_give_credit(&mut actions, plane, &controlling);
                    blow_up(
                        &mut actions,
                        Some(plane.player_id()),
                        RemoveData::Plane(*plane_id),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );
                    continue 'planes;
                }
            }

            for (_, coast) in self.coasts.get_map_mut() {
                if plane.check_collision(coast) {
                    kill_plane_and_give_credit(&mut actions, plane, &controlling);
                    blow_up(
                        &mut actions,
                        Some(plane.player_id()),
                        RemoveData::Plane(*plane_id),
                        plane.get_client_x(),
                        plane.get_client_y(),
                    );
                    continue 'planes;
                }
            }

            for (_, water) in self.waters.get_map_mut() {
                if plane.check_collision(water) {
                    kill_plane_and_give_credit(&mut actions, plane, &controlling);
                    actions.push(Action::RemoveEntity(RemoveData::Plane(*plane_id)));
                    continue 'planes;
                }
            }
        }

        actions
    }

    // Get bounding boxes of all collide-able objects
    //
}

/**
 * We need to make sure the person who disabled this plane gets the kill.
 */
fn kill_plane_and_give_credit(
    actions: &mut Vec<Action>,
    plane: &mut Plane,
    controlling: &Option<(&PlayerId, &mut player::Player)>,
) {
    /*
    // If it was downed, that person should be the killer
    // Otherwise, it's a suicide
    let killer = match plane.get_downed_by() {
        Some(killer_id) => killer_id,
        None => plane.player_id(),
    };
    // If we were downed, we are the victim
    // otherwise, we killed ourself and there is no victim
    let victim = match plane.get_downed_by() {
        Some(_) => Some(plane.player_id()),
        None => None,
    };
    */
    // If the plane is occupied, show plane death and man death
    if let Some((pid, _player)) = controlling {
        // If the plane hasn't been downed yet, show this
        if plane.get_downed_by().is_none() {
            actions.push(Action::RegisterKill(KillEvent::new(
                **pid,
                None,
                KillMethod::Plane,
            )));
        }
        actions.push(Action::RegisterKill(KillEvent::new(
            **pid,
            None,
            KillMethod::Man,
        )));
    }

    /*
    if plane.get_downed_by().is_none() {
        actions.push(Action::RegisterKill(KillEvent::new(
            killer,
            victim,
            KillMethod::Plane,
        )));
    }
    if let Some(_) = *controlling {
        actions.push(Action::RegisterKill(KillEvent::new(
            killer,
            victim,
            KillMethod::Man,
        )));
    }
    */
}

pub fn blow_up(
    actions: &mut Vec<Action>,
    player_id: Option<PlayerId>,
    remove_ent: RemoveData,
    explosion_x: i16,
    explosion_y: i16,
) -> () {
    actions.push(Action::RemoveEntity(remove_ent));
    actions.push(Action::Explosion(ExplosionData {
        explosion_owner: player_id,
        team: None,
        client_x: explosion_x,
        client_y: explosion_y,
    }));
}
