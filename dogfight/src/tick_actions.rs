use imageproc::geometry::contour_area;

use crate::{
    entities::{
        bomb::Bomb,
        bullet::Bullet,
        entity::Entity,
        explosion::Explosion,
        man::Man,
        player::{self, ControllingEntity, PlayerState},
        types::{EntityType, Team},
        EntityId,
    },
    input::PlayerKeyboard,
    output::ServerOutput,
    world::World,
};

pub struct RemoveData {
    pub ent_id: EntityId,
    pub ent_type: EntityType,
}

pub struct ExplosionData {
    pub team: Option<Team>,
    pub x: i16,
    pub y: i16,
}

pub enum Action {
    RemoveEntity(RemoveData),
    Explosion(ExplosionData),
    SpawnMan(Man, Option<ControllingEntity>),
    SpawnBomb(Bomb),
    SpawnBullet(Bullet),
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
        }
    }

    fn remove_entity(&mut self, remove_data: RemoveData) -> Vec<ServerOutput> {
        let mut output = vec![];

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

        if let Some(player) = self
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
        let mut output = vec![];

        let explosion = Explosion::new(data.team, data.x, data.y);
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
                if let Some(p) = self
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
}
