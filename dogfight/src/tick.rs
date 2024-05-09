use std::f32::consts::E;

use crate::{
    collision::SolidEntity,
    entities::{
        container::EntityContainer,
        man::Man,
        plane::Plane,
        player::{ControllingEntity, Player},
        types::EntityType,
        EntityId,
    },
    input::PlayerKeyboard,
    world::World,
};

pub struct TickControlled<'a> {
    pub players: &'a mut EntityContainer<Player>,
    pub men: &'a mut EntityContainer<Man>,
    pub planes: &'a mut EntityContainer<Plane>,
}

pub fn tick_controlled_entities(ents: TickControlled) {
    for (_, player) in ents.players.get_map_mut() {
        if let Some(controlled) = player.get_controlling() {
            match controlled.entity_type {
                EntityType::Man => {
                    if let Some(man) = ents.men.get_mut(controlled.id) {
                        man.tick(player.get_keys());
                    }
                }
                _ => (),
            };
        }
    }
}
