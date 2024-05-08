use std::f32::consts::E;

use crate::{
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
    pub player: &'a mut EntityContainer<Player>,
    pub men: &'a mut EntityContainer<Man>,
    pub planes: &'a mut EntityContainer<Plane>,
}

pub fn tick_controlled_entities(ents: TickControlled) {
    for (pid, player) in ents.player.get_map_mut() {
        if let Some(controlled) = player.get_controlling() {
            match controlled.entity_type {
                EntityType::Man => {
                    if let Some(man) = ents.men.get_mut(controlled.id) {
                        //
                        if let Some(plane) = ents.planes.get_mut(0) {
                            man.tick(plane, player.get_keys());
                        }
                    }
                }
                _ => (),
            };
        }
    }
}
