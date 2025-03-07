use crate::{
    collision::{DebugEntity, DebugEntityType, SolidEntity},
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
                    ent_type: DebugEntityType::Man(*idx),
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
                    ent_type: DebugEntityType::Water(*idx),
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
                    ent_type: DebugEntityType::Plane(*idx),
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
                    ent_type: DebugEntityType::Ground(*idx),
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
                    ent_type: DebugEntityType::Coast(*idx),
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
                    ent_type: DebugEntityType::Runway(*idx),
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
                    ent_type: DebugEntityType::Runway(*idx),
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
                    ent_type: DebugEntityType::Bomb(*idx),
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
                    ent_type: DebugEntityType::Explosion(*idx),
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
                    ent_type: DebugEntityType::Bullet(*idx),
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

pub fn log(message: String) -> () {
    web_sys::console::log_1(&format!("{}", message).into());
}
