use crate::{
    entities::{
        bomb::Bomb,
        bullet::Bullet,
        entity::Entity,
        explosion::Explosion,
        man::Man,
        player::{ControllingEntity, PlayerState},
        types::{EntityType, Team},
        EntityId,
    },
    game_event::{KillEvent, KillMethod},
    input::PlayerKeyboard,
    output::ServerOutput,
    world::World,
};

pub struct RemoveData {
    pub ent_id: EntityId,
    pub ent_type: EntityType,
}

pub struct ExplosionData {
    pub explosion_owner: Option<EntityId>,
    pub team: Option<Team>,
    pub client_x: i16,
    pub client_y: i16,
}

pub enum Action {
    RemoveEntity(RemoveData),
    Explosion(ExplosionData),
    SpawnMan(Man, Option<ControllingEntity>),
    SpawnBomb(Bomb),
    SpawnBullet(Bullet),
    RegisterKill(KillEvent),
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
        }
    }

    fn remove_entity(&mut self, remove_data: RemoveData) -> Vec<ServerOutput> {
        let output = vec![];

        let id = remove_data.ent_id;
        match remove_data.ent_type {
            EntityType::Man => {
                self.men.remove(id);
            }
            EntityType::Plane => {
                self.planes.remove(id);
            }
            EntityType::Bomb => {
                self.bombs.remove(id);
            }
            EntityType::Explosion => {
                self.explosions.remove(id);
            }
            EntityType::Bullet => {
                self.bullets.remove(id);
            }
            EntityType::WorldInfo => {}
            EntityType::BackgroundItem => {}
            EntityType::Ground => {}
            EntityType::Coast => {}
            EntityType::Runway => {}
            EntityType::Player => {}
            EntityType::Water => {}
            EntityType::Bunker => {}
            EntityType::Hill => {}
        };

        if let Some((_, player)) = self
            .players
            .get_player_controlling(remove_data.ent_type, remove_data.ent_id)
        {
            player.set_controlling(None);
            // TODO: show temporary death screen or something
            player.set_state(PlayerState::ChoosingRunway);
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
        if let Some((man_id, man)) = self.men.insert(man) {
            if let Some(current) = currently_controlling {
                if let Some((_, p)) = self
                    .players
                    .get_player_controlling(current.entity_type, current.id)
                {
                    // unset the space/jump key
                    let reset_keys = PlayerKeyboard::new();
                    p.set_keys(reset_keys);

                    p.set_controlling(Some(ControllingEntity {
                        id: man_id,
                        entity_type: man.get_type(),
                    }));
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
}
