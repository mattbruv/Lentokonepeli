
use crate::{
    collision::{BoundingBox, SolidEntity},
    entities::{
        bomb::Bomb,
        bullet::Bullet,
        container::{BombId, BulletId, ExplosionId, ManId, PlaneId, PlayerId},
        explosion::Explosion,
        man::Man,
        player::{ControllingEntity, PlayerState},
        types::Team,
    },
    game_event::{KillEvent, KillMethod},
    input::PlayerKeyboard,
    output::ServerOutput,
    world::World,
};

pub enum RemoveData {
    Man(ManId),
    Plane(PlaneId),
    Bomb(BombId),
    Explosion(ExplosionId),
    Bullet(BulletId),
}

pub struct ExplosionData {
    pub explosion_owner: Option<PlayerId>,
    pub team: Option<Team>,
    pub client_x: i16,
    pub client_y: i16,
}

pub struct ManShootData {
    pub player_id: PlayerId,
    pub man_ent_id: ManId,
}

pub enum Action {
    RemoveEntity(RemoveData),
    Explosion(ExplosionData),
    SpawnMan(Man, Option<ControllingEntity>),
    SpawnBomb(Bomb),
    SpawnBullet(Bullet),
    RegisterKill(KillEvent),
    ManShootBullet(ManShootData),
}

impl World {
    pub fn process_actions(&mut self, actions: Vec<Action>) -> Vec<ServerOutput> {
        let mut output = vec![];

        for action in actions {
            output.extend(self.process_action(action));
        }

        output
    }

    fn process_action(&mut self, action: Action) -> Vec<ServerOutput> {
        match action {
            Action::RemoveEntity(remove) => self.remove_entity(remove),
            Action::Explosion(explosion_data) => self.explode(explosion_data),
            Action::SpawnMan(man, currently_controlling) => {
                self.spawn_man(man, currently_controlling)
            }
            Action::SpawnBomb(bomb) => self.spawn_bomb(bomb),
            Action::SpawnBullet(bullet) => self.spawn_bullet(bullet),
            Action::RegisterKill(kill_event) => self.register_kill(kill_event),
            Action::ManShootBullet(man_id) => self.man_shoot_bullet(man_id),
        }
    }

    fn remove_entity(&mut self, remove_controlling: RemoveData) -> Vec<ServerOutput> {
        let output = vec![];

        match remove_controlling {
            RemoveData::Man(man_id) => {
                self.men.remove(man_id);
            }
            RemoveData::Plane(plane_id) => {
                self.planes.remove(plane_id);
            }
            RemoveData::Bomb(bomb_id) => {
                self.bombs.remove(bomb_id);
            }
            RemoveData::Explosion(explosion_id) => {
                self.explosions.remove(explosion_id);
            }
            RemoveData::Bullet(bullet_id) => {
                self.bullets.remove(bullet_id);
            }
        };

        // If we're removing an entity that might be controlled,
        // we want to check to see if a player is indeed controlling it
        // and if so, remove that control.
        let control_test: Option<ControllingEntity> = match remove_controlling {
            RemoveData::Man(man_id) => Some(ControllingEntity::Man(man_id)),
            RemoveData::Plane(plane_id) => Some(ControllingEntity::Plane(plane_id)),
            RemoveData::Bomb(_) => None,
            RemoveData::Explosion(_) => None,
            RemoveData::Bullet(_) => None,
        };

        if let Some(controlled) = control_test {
            if let Some((_, player)) = self.players.get_player_controlling(controlled) {
                player.set_controlling(None);
                // TODO: show temporary death screen or something
                player.set_state(PlayerState::ChoosingRunway);
            }
        }

        output
    }

    fn explode(&mut self, data: ExplosionData) -> Vec<ServerOutput> {
        let output = vec![];

        let explosion = Explosion::new(
            data.explosion_owner,
            data.team,
            data.client_x,
            data.client_y,
        );
        self.explosions.insert(explosion);

        output
    }

    fn spawn_man(
        &mut self,
        man: Man,
        currently_controlling: Option<ControllingEntity>,
    ) -> Vec<ServerOutput> {
        if let Some((man_id, _man)) = self.men.insert(man) {
            if let Some(current) = currently_controlling {
                if let Some((_, p)) = self.players.get_player_controlling(current) {
                    // unset the space/jump key
                    let reset_keys = PlayerKeyboard::new();
                    p.set_keys(reset_keys);
                    p.set_controlling(Some(ControllingEntity::Man(man_id)));
                }
            }
        }

        vec![]
    }

    fn spawn_bomb(&mut self, bomb: Bomb) -> Vec<ServerOutput> {
        self.bombs.insert(bomb);
        vec![]
    }

    fn spawn_bullet(&mut self, bullet: Bullet) -> Vec<ServerOutput> {
        self.bullets.insert(bullet);
        vec![]
    }

    fn register_kill(&mut self, kill_event: KillEvent) -> Vec<ServerOutput> {
        // If the man was killed,
        // Adjust kills, deaths, and points
        if kill_event.method == KillMethod::Man {
            match kill_event.victim {
                // We killed someone else
                Some(victim) => {
                    if let Some(vict) = self.players.get_mut(victim) {
                        vict.set_deaths(vict.get_deaths() + 1);
                    }
                    match self.players.get(victim).and_then(|p| *p.get_team()) {
                        Some(vict_team) => {
                            if let Some(killer) = self.players.get_mut(kill_event.killer) {
                                match *killer.get_team() {
                                    Some(team) => {
                                        if team == vict_team {
                                            // If the victim was on our team, we teamkilled :(
                                            killer.adjust_score(-8);
                                        } else {
                                            killer.adjust_kills(1);
                                            killer.adjust_score(10);
                                        }
                                    }
                                    None => {}
                                }
                            }
                        }
                        None => {}
                    }
                }
                // If we killed ourselves
                None => {
                    if let Some(killer) = self.players.get_mut(kill_event.killer) {
                        killer.set_deaths(killer.get_deaths() + 1);
                        killer.adjust_score(-5);
                    }
                }
            }
        }

        vec![ServerOutput::KillEvent(kill_event)]
    }

    fn man_shoot_bullet(&mut self, shoot_data: ManShootData) -> Vec<ServerOutput> {
        let mut output: Vec<ServerOutput> = vec![];
        //log(format!("man shoot! {}", man_id));

        // Get all bounding boxes for planes, men, and runways that are alive
        // Only for objects on the enemy team
        let mut bounding_boxes: Vec<BoundingBox> = vec![];
        if let Some(man) = self.men.get(shoot_data.man_ent_id) {
            bounding_boxes.extend(
                self.men
                    .get_map()
                    .iter()
                    .filter(|x| x.1.get_team() != man.get_team())
                    .map(|m| m.1.get_collision_bounds()),
            );

            bounding_boxes.extend(
                self.planes
                    .get_map()
                    .iter()
                    .filter(|x| x.1.get_team() != man.get_team())
                    .map(|m| m.1.get_collision_bounds()),
            );

            // make sure to filter out dead runways
            bounding_boxes.extend(
                self.runways
                    .get_map()
                    .iter()
                    .filter(|(_, runway)| *runway.get_team() != man.get_team() && runway.is_alive())
                    .map(|m| m.1.get_collision_bounds()),
            );
        }

        //log(format!("bounds: {:?}", bounding_boxes));

        let mut angle: f64 = 4.71238898038469;
        let mut target: Option<BoundingBox> = None;
        let mut i: i32 = 250_000;

        if let Some(man) = self.men.get(shoot_data.man_ent_id) {
            let my_box = man.get_collision_bounds();

            // find the object which is the shortest distance away
            for bbox in bounding_boxes {
                let dist = count_distance(&my_box, &bbox);
                //log(format!("dist: {:?}", dist));
                if dist < i {
                    i = dist;
                    target = Some(bbox);
                }
            }

            if let Some(closest) = target {
                angle = count_angle(&my_box, &closest);
                // For some reason the rust version is returning negative angles with atan2
                // and the java version doesn't, maybe the java version y coords are flipped?
                // Either way, ChatGPT says this is the way to flip it and it seems to work
                if angle < 0.0 {
                    angle += std::f64::consts::TAU; // stop negative angle values
                }
                //
            }

            if (angle < 2.199114857512855) && (angle > 0.9424777960769379) {
                if let Some(closest) = target {
                    //System.out.println("Shooting down: " + localObject1 + " " + ((SolidEntity)localObject1).getCollisionBounds() + " " + d + " " + i);
                } else {
                    //System.out.println("Shooting down: " + localObject1 + " " + d + " " + i);
                }
            }

            //log(format!("ANGLE: {}", angle));

            let j = my_box.x + my_box.width / 2;
            let m = my_box.y + my_box.height - 10;
            output.extend(self.spawn_bullet(Bullet::new(shoot_data.player_id, j, m, angle, 0.0)));
        }

        /*
           int j = this.x / 100 + this.w / 2;
           int m = this.y / 100 + this.h - 10;
           this.toolkit.addEntity(new Bullet(j, m, d, 0.0D, this));
        */
        /*
           if ((d < 2.199114857512855D) && (d > 0.9424777960769379D)) {
           if (localObject1 != null) {
               System.out.println("Shooting down: " + localObject1 + " " + ((SolidEntity)localObject1).getCollisionBounds() + " " + d + " " + i);
           } else {
               System.out.println("Shooting down: " + localObject1 + " " + d + " " + i);
           }
           }
           int j = this.x / 100 + this.w / 2;
           int m = this.y / 100 + this.h - 10;
           this.toolkit.addEntity(new Bullet(j, m, d, 0.0D, this));
        */

        // log(format!("shortest dist: {:?}", target));

        output
    }
}

fn count_angle(my_box: &BoundingBox, bbox: &BoundingBox) -> f64 {
    let i = (bbox.x + bbox.width / 2) as i32;
    let j = (bbox.y + bbox.height / 2) as i32;
    let k = (my_box.x + my_box.width / 2) as i32;
    let m = (my_box.y + my_box.height / 2) as i32;
    ((j - m) as f64).atan2((i - k) as f64)
    /*
    int i = paramSolidEntity.getCollisionBounds().x + paramSolidEntity.getCollisionBounds().width / 2;
    int j = paramSolidEntity.getCollisionBounds().y + paramSolidEntity.getCollisionBounds().height / 2;
    int k = this.x / 100 + this.w / 2;
    int m = this.y / 100 + this.h / 2;
    return Math.atan2(j - m, i - k);
     */
}

fn count_distance(my_box: &BoundingBox, bbox: &BoundingBox) -> i32 {
    let i = (bbox.x + bbox.width / 2) as i32;
    let j = (bbox.y + bbox.height / 2) as i32;
    let k = (my_box.x + my_box.width / 2) as i32;
    let m = (my_box.y + my_box.height / 2) as i32;
    (i - k) * (i - k) + (j - m) * (j - m)
    /*
    int i = paramSolidEntity.getCollisionBounds().x + paramSolidEntity.getCollisionBounds().width / 2;
    int j = paramSolidEntity.getCollisionBounds().y + paramSolidEntity.getCollisionBounds().height / 2;
    int k = this.x / 100 + this.w / 2;
    int m = this.y / 100 + this.h / 2;
    return (i - k) * (i - k) + (j - m) * (j - m);
     */
}
