use crate::{
    collision::{DebugEntity, SolidEntity},
    entities::types::EntityType,
    world::World,
};

impl World {
    pub fn debug(&mut self) -> String {
        let mut debug_info: Vec<DebugEntity> = vec![];

        let man_bounds: Vec<DebugEntity> = self
            .men
            .get_map_mut()
            .iter_mut()
            .map(|(idx, man)| {
                let bounds = man.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Man,
                    bounding_box: bounds,
                    pixels: man.get_debug_pixels(),
                }
            })
            .collect();

        let water_bounds: Vec<DebugEntity> = self
            .waters
            .get_map_mut()
            .iter_mut()
            .map(|(idx, water)| {
                let bounds = water.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Water,
                    bounding_box: bounds,
                    pixels: water.get_debug_pixels(),
                }
            })
            .collect();

        let plane_bounds: Vec<DebugEntity> = self
            .planes
            .get_map_mut()
            .iter_mut()
            .map(|(idx, plane)| {
                let bounds = plane.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Plane,
                    bounding_box: bounds,
                    pixels: plane.get_debug_pixels(),
                }
            })
            .collect();

        let ground_bounds: Vec<DebugEntity> = self
            .grounds
            .get_map_mut()
            .iter_mut()
            .map(|(idx, ground)| {
                let bounds = ground.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Ground,
                    bounding_box: bounds,
                    pixels: ground.get_debug_pixels(),
                }
            })
            .collect();

        let coast_bounds: Vec<DebugEntity> = self
            .coasts
            .get_map_mut()
            .iter_mut()
            .map(|(idx, coast)| {
                let bounds = coast.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Coast,
                    bounding_box: bounds,
                    pixels: coast.get_debug_pixels(),
                }
            })
            .collect();

        let runway_bounds: Vec<DebugEntity> = self
            .runways
            .get_map_mut()
            .iter_mut()
            .map(|(idx, runway)| {
                let bounds = runway.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Runway,
                    bounding_box: bounds,
                    pixels: runway.get_debug_pixels(),
                }
            })
            .collect();

        let landing_strips: Vec<DebugEntity> = self
            .runways
            .get_map()
            .iter()
            .map(|(idx, runway)| {
                let bounds = runway.get_landing_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Runway,
                    bounding_box: bounds,
                    pixels: None,
                }
            })
            .collect();

        let bomb_bounds: Vec<DebugEntity> = self
            .bombs
            .get_map_mut()
            .iter_mut()
            .map(|(idx, bomb)| {
                let bounds = bomb.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Bomb,
                    bounding_box: bounds,
                    pixels: bomb.get_debug_pixels(),
                }
            })
            .collect();

        let explosion_bounds: Vec<DebugEntity> = self
            .explosions
            .get_map_mut()
            .iter_mut()
            .map(|(idx, explosion)| {
                let bounds = explosion.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Explosion,
                    bounding_box: bounds,
                    pixels: explosion.get_debug_pixels(),
                }
            })
            .collect();

        let bullet_bounds: Vec<DebugEntity> = self
            .bullets
            .get_map_mut()
            .iter_mut()
            .map(|(idx, bullet)| {
                let bounds = bullet.get_collision_bounds();
                DebugEntity {
                    ent_id: *idx,
                    ent_type: EntityType::Bullet,
                    bounding_box: bounds,
                    pixels: bullet.get_debug_pixels(),
                }
            })
            .collect();

        debug_info.extend(man_bounds);
        debug_info.extend(ground_bounds);
        debug_info.extend(water_bounds);
        debug_info.extend(plane_bounds);
        debug_info.extend(coast_bounds);
        debug_info.extend(runway_bounds);
        debug_info.extend(landing_strips);
        debug_info.extend(bomb_bounds);
        debug_info.extend(explosion_bounds);
        debug_info.extend(bullet_bounds);

        serde_json::to_string(&debug_info).unwrap()
    }
}
