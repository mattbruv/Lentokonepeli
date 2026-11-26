use std::{collections::HashSet, f64::consts::PI};

use crate::{
    collision::SolidEntity,
    entities::{
        bullet::BulletOrigin,
        container::{EntityContainer, ManId, PlaneId, PlayerId},
        man::ManState,
        plane::{Plane, PlaneMode},
        player::{self, ControllingEntity, Player},
        types::Team,
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
            let controller = controller_of(&mut self.players, ControllingEntity::Man(*man_id));

            for (runway_id, runway) in self.runways.get_map_mut() {
                if !man.check_collision(runway) {
                    continue;
                }
                let walking = matches!(
                    man.get_state(),
                    ManState::Standing | ManState::WalkingLeft | ManState::WalkingRight
                );
                let own_runway = *runway.get_team() == man.get_team();

                if walking && own_runway {
                    actions.push(Action::ManEnteredRunway(*man_id, *runway_id));
                    continue 'men;
                } else if walking {
                    man.set_to_previous_x();
                } else if !own_runway {
                    man_dies(&mut actions, *man_id, controller);
                    continue 'men;
                }
            }

            for (_, bunker) in self.bunkers.get_map_mut() {
                if !man.check_collision(bunker) {
                    continue;
                }
                match man.get_state() {
                    ManState::Standing | ManState::WalkingLeft | ManState::WalkingRight => {
                        man.set_to_previous_x();
                    }
                    _ => {
                        man_dies(&mut actions, *man_id, controller);
                        continue 'men;
                    }
                }
            }

            for (_, ground) in self.grounds.get_map_mut() {
                if !man.check_collision(ground) {
                    continue;
                }
                if let ManState::Falling | ManState::Parachuting = man.get_state() {
                    if man.die_from_fall() {
                        man_dies(&mut actions, *man_id, controller);
                        continue 'men;
                    }
                    man.set_state(ManState::Standing);
                    let h = man.get_collision_image().unwrap().height();
                    man.set_client_y(ground.get_collision_bounds().y - h as i16);
                }
            }

            for (_, coast) in self.coasts.get_map_mut() {
                if man.check_collision(coast) {
                    man_dies(&mut actions, *man_id, controller);
                    continue 'men;
                }
            }

            for (_, water) in self.waters.get_map_mut() {
                if man.check_collision(water) {
                    man_dies(&mut actions, *man_id, controller);
                    continue 'men;
                }
            }
        }

        actions
    }

    fn collide_bombs(&mut self) -> Vec<Action> {
        let mut actions = vec![];
        let mut removed_planes: HashSet<PlaneId> = HashSet::new();
        let mut removed_men: HashSet<ManId> = HashSet::new();
        let mut bombs: Vec<_> = self.bombs.get_map_mut().iter_mut().collect();

        for i in 0..bombs.len() {
            let (before, rest) = bombs.split_at_mut(i);
            let ((bomb_id, bomb), after) = rest.split_first_mut().unwrap();
            if !bomb.is_alive() {
                continue;
            }
            let bomb_id = **bomb_id;
            let owner = bomb.player_id();
            let origin = bomb.get_origin();
            let mut first_hit: Option<BombHit> = None;

            for (other_id, other) in before.iter_mut().chain(after.iter_mut()) {
                if !other.is_alive() || !bomb.check_collision(*other) {
                    continue;
                }
                first_hit.get_or_insert(BombHit::Explode);
                other.kill();
                blow_up(
                    &mut actions,
                    Some(other.player_id()),
                    RemoveData::Bomb(**other_id),
                    other.get_x(),
                    other.get_y(),
                );
            }

            for (plane_id, plane) in self.planes.get_map_mut() {
                if *plane_id == origin
                    || removed_planes.contains(plane_id)
                    || !bomb.check_collision(plane)
                {
                    continue;
                }
                first_hit.get_or_insert(BombHit::Explode);
                if plane.player_id() == owner {
                    continue;
                }
                let falling = plane.get_mode() == PlaneMode::Falling;
                if let Some(pilot) =
                    controller_of(&mut self.players, ControllingEntity::Plane(*plane_id))
                {
                    if !falling {
                        actions.push(Action::RegisterKill(KillEvent::new(
                            owner,
                            Some(pilot),
                            KillMethod::Plane,
                        )));
                    }
                    actions.push(Action::RegisterKill(KillEvent::new(
                        owner,
                        Some(pilot),
                        KillMethod::Man,
                    )));
                }
                removed_planes.insert(*plane_id);
                blow_up(
                    &mut actions,
                    Some(plane.player_id()),
                    RemoveData::Plane(*plane_id),
                    plane.get_center().0,
                    plane.get_center().1,
                );
            }

            for (man_id, man) in self.men.get_map_mut() {
                if removed_men.contains(man_id) || !bomb.check_collision(man) {
                    continue;
                }
                first_hit.get_or_insert(BombHit::Explode);
                if let Some(victim) =
                    controller_of(&mut self.players, ControllingEntity::Man(*man_id))
                {
                    actions.push(Action::RegisterKill(KillEvent::new(
                        owner,
                        (owner != victim).then_some(victim),
                        KillMethod::Man,
                    )));
                }
                removed_men.insert(*man_id);
                actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
            }

            for (runway_id, runway) in self.runways.get_map_mut() {
                if !bomb.check_collision(runway) {
                    continue;
                }
                first_hit.get_or_insert(BombHit::Structure(*runway.get_team()));
                if runway.subtract_health(30) {
                    actions.push(Action::RunwayDestroyed(*runway_id));
                }
            }

            for (bunker_id, bunker) in self.bunkers.get_map_mut() {
                if !bomb.check_collision(bunker) {
                    continue;
                }
                first_hit.get_or_insert(BombHit::Structure(*bunker.get_team()));
                if bunker.subtract_health(30) {
                    actions.push(Action::BunkerDestroyed(*bunker_id));
                }
            }

            if self
                .grounds
                .get_map_mut()
                .iter_mut()
                .any(|(_, g)| bomb.check_collision(g))
                || self
                    .coasts
                    .get_map_mut()
                    .iter_mut()
                    .any(|(_, c)| bomb.check_collision(c))
            {
                first_hit.get_or_insert(BombHit::Explode);
            }

            if self
                .waters
                .get_map_mut()
                .iter_mut()
                .any(|(_, w)| bomb.check_collision(w))
            {
                first_hit.get_or_insert(BombHit::Sink);
            }

            let Some(hit) = first_hit else {
                continue;
            };
            bomb.kill();
            match hit {
                BombHit::Sink => actions.push(Action::RemoveEntity(RemoveData::Bomb(bomb_id))),
                BombHit::Explode | BombHit::Structure(_) => {
                    if let BombHit::Structure(team) = hit {
                        actions.push(Action::BombHitStructure(owner, team));
                    }
                    blow_up(
                        &mut actions,
                        Some(owner),
                        RemoveData::Bomb(bomb_id),
                        bomb.get_x(),
                        bomb.get_y(),
                    );
                }
            }
        }

        actions
    }

    fn collide_bullets(&mut self) -> Vec<Action> {
        let mut actions = vec![];
        let mut removed_men: HashSet<ManId> = HashSet::new();
        let mut bullets: Vec<_> = self.bullets.get_map_mut().iter_mut().collect();

        for i in 0..bullets.len() {
            let (before, rest) = bullets.split_at_mut(i);
            let ((bullet_id, bullet), after) = rest.split_first_mut().unwrap();
            if !bullet.is_alive() {
                continue;
            }
            let bullet_id = **bullet_id;
            let shooter = bullet.player_id();
            let origin = bullet.get_origin();
            let shooter_team = team_of(&self.players, shooter);
            let mut hit = false;

            for (other_id, other) in before.iter_mut().chain(after.iter_mut()) {
                if !other.is_alive() || other.expired() || !bullet.check_collision(*other) {
                    continue;
                }
                hit = true;
                other.kill();
                if team_of(&self.players, other.player_id()) != shooter_team {
                    bullet.mark_hit_enemy();
                    other.mark_hit_enemy();
                }
                actions.push(Action::RemoveEntity(RemoveData::Bullet(**other_id)));
            }

            for (man_id, man) in self.men.get_map_mut() {
                if removed_men.contains(man_id)
                    || origin == BulletOrigin::Man(*man_id)
                    || !bullet.check_collision(man)
                {
                    continue;
                }
                hit = true;
                if shooter_team != Some(man.get_team()) {
                    bullet.mark_hit_enemy();
                }
                if let Some(victim) =
                    controller_of(&mut self.players, ControllingEntity::Man(*man_id))
                {
                    if victim != shooter {
                        actions.push(Action::RegisterKill(KillEvent::new(
                            shooter,
                            Some(victim),
                            KillMethod::Man,
                        )));
                        removed_men.insert(*man_id);
                        actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
                    }
                }
            }

            for (plane_id, plane) in self.planes.get_map_mut() {
                if origin == BulletOrigin::Plane(*plane_id) || !bullet.check_collision(plane) {
                    continue;
                }
                hit = true;
                if shooter_team != Some(plane.get_team()) {
                    bullet.mark_hit_enemy();
                }
                if plane.player_id() == shooter || plane.get_mode() == PlaneMode::Falling {
                    continue;
                }
                plane.subtract_health((30.0 * bullet.get_damage_factor()) as i32);

                if plane.health() <= 0 && plane.get_downed_by().is_none() {
                    if let Some(pilot) =
                        controller_of(&mut self.players, ControllingEntity::Plane(*plane_id))
                    {
                        plane.set_downed_by(Some(shooter));
                        actions.push(Action::RegisterKill(KillEvent::new(
                            shooter,
                            Some(pilot),
                            KillMethod::Plane,
                        )));
                    }
                }
            }

            for (bomb_id, bomb) in self.bombs.get_map_mut() {
                if !bomb.is_alive() || !bullet.check_collision(bomb) {
                    continue;
                }
                hit = true;
                if shooter_team != team_of(&self.players, bomb.player_id()) {
                    bullet.mark_hit_enemy();
                }
                bomb.kill();
                blow_up(
                    &mut actions,
                    Some(bomb.player_id()),
                    RemoveData::Bomb(*bomb_id),
                    bomb.get_x(),
                    bomb.get_y(),
                );
            }

            for (runway_id, runway) in self.runways.get_map_mut() {
                if !bullet.check_collision(runway) {
                    continue;
                }
                hit = true;
                if shooter_team != Some(*runway.get_team()) {
                    bullet.mark_hit_enemy();
                }
                if runway.subtract_health((4.0 * bullet.get_damage_factor()) as i32) {
                    actions.push(Action::RunwayDestroyed(*runway_id));
                }
            }

            for (bunker_id, bunker) in self.bunkers.get_map_mut() {
                if !bullet.check_collision(bunker) {
                    continue;
                }
                hit = true;
                if bunker.subtract_health((3.0 * bullet.get_damage_factor()) as i32) {
                    actions.push(Action::BunkerDestroyed(*bunker_id));
                }
            }

            hit |= self
                .grounds
                .get_map_mut()
                .iter_mut()
                .any(|(_, g)| bullet.check_collision(g))
                || self
                    .coasts
                    .get_map_mut()
                    .iter_mut()
                    .any(|(_, c)| bullet.check_collision(c))
                || self
                    .waters
                    .get_map_mut()
                    .iter_mut()
                    .any(|(_, w)| bullet.check_collision(w));

            if hit || bullet.expired() {
                bullet.kill();
                actions.push(Action::RemoveEntity(RemoveData::Bullet(bullet_id)));
            }
        }

        actions
    }

    fn collide_explosions(&mut self) -> Vec<Action> {
        let mut actions = vec![];
        let mut removed_planes: HashSet<PlaneId> = HashSet::new();
        let mut removed_men: HashSet<ManId> = HashSet::new();

        for (_, explosion) in self.explosions.get_map_mut() {
            let explosion_owner = explosion.player_id();

            for (plane_id, plane) in self.planes.get_map_mut() {
                if removed_planes.contains(plane_id) || !explosion.check_collision(plane) {
                    continue;
                }
                let falling = plane.get_mode() == PlaneMode::Falling;
                if falling && explosion_owner == Some(plane.player_id()) {
                    continue;
                }
                if !falling {
                    plane.subtract_health(50);
                    if plane.health() > 0 {
                        continue;
                    }
                }
                if let (Some(killer), Some(pilot)) = (
                    explosion_owner,
                    controller_of(&mut self.players, ControllingEntity::Plane(*plane_id)),
                ) {
                    if !falling {
                        plane.set_downed_by(Some(killer));
                        actions.push(Action::RegisterKill(KillEvent::new(
                            killer,
                            Some(pilot),
                            KillMethod::Plane,
                        )));
                    }
                    actions.push(Action::RegisterKill(KillEvent::new(
                        killer,
                        Some(pilot),
                        KillMethod::Man,
                    )));
                }
                removed_planes.insert(*plane_id);
                blow_up(
                    &mut actions,
                    Some(plane.player_id()),
                    RemoveData::Plane(*plane_id),
                    plane.get_center().0,
                    plane.get_center().1,
                );
            }

            for (bomb_id, bomb) in self.bombs.get_map_mut() {
                if bomb.is_alive() && explosion.check_collision(bomb) {
                    bomb.kill();
                    blow_up(
                        &mut actions,
                        Some(bomb.player_id()),
                        RemoveData::Bomb(*bomb_id),
                        bomb.get_x(),
                        bomb.get_y(),
                    );
                }
            }

            for (bullet_id, bullet) in self.bullets.get_map_mut() {
                if bullet.is_alive() && explosion.check_collision(bullet) {
                    bullet.kill();
                    actions.push(Action::RemoveEntity(RemoveData::Bullet(*bullet_id)));
                }
            }

            for (man_id, man) in self.men.get_map_mut() {
                if removed_men.contains(man_id) || !explosion.check_collision(man) {
                    continue;
                }
                if let (Some(killer), Some(victim)) = (
                    explosion_owner,
                    controller_of(&mut self.players, ControllingEntity::Man(*man_id)),
                ) {
                    actions.push(Action::RegisterKill(KillEvent::new(
                        killer,
                        (killer != victim).then_some(victim),
                        KillMethod::Man,
                    )));
                }
                removed_men.insert(*man_id);
                actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
            }

            for (runway_id, runway) in self.runways.get_map_mut() {
                if explosion.check_collision(runway) && runway.subtract_health(17) {
                    actions.push(Action::RunwayDestroyed(*runway_id));
                }
            }

            for (bunker_id, bunker) in self.bunkers.get_map_mut() {
                if explosion.check_collision(bunker) && bunker.subtract_health(17) {
                    actions.push(Action::BunkerDestroyed(*bunker_id));
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
                if plane.player_id() != other.player_id() && plane.check_collision(*other) {
                    let plane_hit = plane.do_plane_collision();
                    let other_hit = other.do_plane_collision();

                    if plane_hit && plane.health() <= 0 && plane.get_downed_by().is_none() {
                        plane.set_downed_by(Some(other.player_id()));
                        actions.push(Action::RegisterKill(KillEvent::new(
                            other.player_id(),
                            Some(plane.player_id()),
                            KillMethod::Plane,
                        )));
                    }
                    if other_hit && other.health() <= 0 && other.get_downed_by().is_none() {
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

        let mut removed_men: HashSet<ManId> = HashSet::new();

        'planes: for (plane_id, plane) in self.planes.get_map_mut() {
            for (man_id, man) in self.men.get_map_mut() {
                if removed_men.contains(man_id)
                    || !man.past_grace_period()
                    || !plane.check_collision(man)
                {
                    continue;
                }
                let killer = plane.player_id();
                let victim = controller_of(&mut self.players, ControllingEntity::Man(*man_id))
                    .filter(|victim| *victim != killer);
                actions.push(Action::RegisterKill(KillEvent::new(
                    killer,
                    victim,
                    KillMethod::Man,
                )));
                removed_men.insert(*man_id);
                actions.push(Action::RemoveEntity(RemoveData::Man(*man_id)));
            }

            let mode = plane.get_mode();
            if mode == PlaneMode::Landed {
                continue;
            }

            let controlling = self
                .players
                .get_player_controlling(ControllingEntity::Plane(*plane_id));

            for (runway_id, runway) in self.runways.get_map_mut() {
                if !plane.check_collision(runway) {
                    continue;
                }

                if mode != PlaneMode::Falling {
                    let on_own_runway = plane.get_runway() == Some(*runway_id)
                        && matches!(mode, PlaneMode::Landing | PlaneMode::TakingOff);
                    if on_own_runway {
                        continue;
                    }

                    if plane.can_land_on_runway(runway) {
                        if plane.flipped() {
                            plane.set_angle(PI);
                        } else {
                            plane.set_angle(0.0);
                        }
                        plane.set_client_y(runway.get_landable_y() - plane.get_bottom_height());

                        if plane.get_team() == *runway.get_team()
                            && plane.is_facing_runway_correctly(runway)
                        {
                            plane.set_mode(PlaneMode::Landing);
                            plane.set_runway(Some(*runway_id));
                        }
                        continue;
                    }

                    if runway.subtract_health(17) {
                        actions.push(Action::RunwayDestroyed(*runway_id));
                    }
                }

                kill_plane_and_give_credit(&mut actions, plane, &controlling);
                blow_up(
                    &mut actions,
                    Some(plane.player_id()),
                    RemoveData::Plane(*plane_id),
                    plane.get_center().0,
                    plane.get_center().1,
                );
                continue 'planes;
            }

            for (_, bunker) in self.bunkers.get_map_mut() {
                if plane.check_collision(bunker) {
                    kill_plane_and_give_credit(&mut actions, plane, &controlling);
                    blow_up(
                        &mut actions,
                        Some(plane.player_id()),
                        RemoveData::Plane(*plane_id),
                        plane.get_center().0,
                        plane.get_center().1,
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
                        plane.get_center().0,
                        plane.get_center().1,
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
                        plane.get_center().0,
                        plane.get_center().1,
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

enum BombHit {
    Explode,
    Structure(Team),
    Sink,
}

fn controller_of(
    players: &mut EntityContainer<Player, PlayerId>,
    entity: ControllingEntity,
) -> Option<PlayerId> {
    players.get_player_controlling(entity).map(|(id, _)| *id)
}

fn team_of(players: &EntityContainer<Player, PlayerId>, player_id: PlayerId) -> Option<Team> {
    players.get(player_id).and_then(|p| *p.get_team())
}

fn man_dies(actions: &mut Vec<Action>, man_id: ManId, controller: Option<PlayerId>) {
    if let Some(pid) = controller {
        actions.push(Action::RegisterKill(KillEvent::new(
            pid,
            None,
            KillMethod::Man,
        )));
    }
    actions.push(Action::RemoveEntity(RemoveData::Man(man_id)));
}
