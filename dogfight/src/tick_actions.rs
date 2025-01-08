use crate::{
    entities::{types::EntityType, EntityId},
    output::GameOutput,
    world::World,
};

pub struct RemoveData {
    pub ent_id: EntityId,
    pub ent_type: EntityType,
}

pub struct ExplosionData {
    pub x: i16,
    pub y: i16,
}

pub enum Action {
    RemoveEntity(RemoveData),
    Explosion(ExplosionData),
}

impl World {
    pub fn process_actions(&mut self, actions: Vec<Action>) -> Vec<GameOutput> {
        let mut output = vec![];

        for action in actions {
            output.extend(self.process_action(action));
        }

        output
    }

    fn process_action(&mut self, action: Action) -> Vec<GameOutput> {
        match action {
            Action::RemoveEntity(remove) => self.remove_entity(remove),
            Action::Explosion(explosion_data) => self.explode(explosion_data),
        }
    }

    fn remove_entity(&mut self, remove_data: RemoveData) -> Vec<GameOutput> {
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
            EntityType::WorldInfo => {}
            EntityType::BackgroundItem => {}
            EntityType::Ground => {}
            EntityType::Coast => {}
            EntityType::Runway => {}
            EntityType::Player => {}
            EntityType::Water => {}
            EntityType::Bunker => {}
        };

        output
    }

    fn explode(&mut self, explosion_data: ExplosionData) -> Vec<GameOutput> {
        let mut output = vec![];

        output
    }
}
