use crate::{
    entities::{types::EntityType, EntityId},
    output::GameOutput,
    world::World,
};

pub struct KillData {
    pub ent_id: EntityId,
    pub ent_type: EntityType,
}

pub enum Action {
    Kill(KillData),
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
            Action::Kill(kill_data) => self.kill_entity(kill_data),
        }
    }

    fn kill_entity(&mut self, kill_data: KillData) -> Vec<GameOutput> {
        let mut output = vec![];

        let id = kill_data.ent_id;
        match kill_data.ent_type {
            EntityType::WorldInfo => {}
            EntityType::Man => {
                self.men.remove(id);
                panic!("Not implemented yet");
                // self.men.remove(id);
            }
            EntityType::Plane => todo!(),
            EntityType::Player => todo!(),
            EntityType::BackgroundItem => todo!(),
            EntityType::Ground => todo!(),
            EntityType::Coast => todo!(),
            EntityType::Runway => todo!(),
            EntityType::Water => todo!(),
            EntityType::Bunker => todo!(),
            EntityType::Bomb => todo!(),
        };

        output
    }
}
