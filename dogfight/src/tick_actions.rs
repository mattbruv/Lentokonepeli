use crate::{
    entities::{types::EntityType, EntityId},
    output::GameOutput,
    world::World,
};

pub struct KillData {
    ent_id: EntityId,
    ent_type: EntityType,
}

pub enum Action {
    Kill(KillData),
}

impl World {
    pub fn process_actions(&mut self, actions: Vec<Action>) -> Vec<GameOutput> {
        let output = vec![];

        output
    }
}
