use crate::{
    collision::{DebugEntity, DebugEntityType, SolidEntity},
    entities::{
        bomb::Bomb, bullet::Bullet, bunker::Bunker, explosion::Explosion, man::Man, plane::Plane,
        player::ControllingEntity, runway::Runway,
    },
    world::World,
};

macro_rules! collect_debug {
    ($world:ident, $field:ident, $variant:ident, $team:expr) => {
        $world
            .$field
            .get_map()
            .iter()
            .map(|(idx, entity)| {
                let (bounding_box, pixels) = entity.get_debug_shape();
                DebugEntity {
                    ent_type: DebugEntityType::$variant(*idx),
                    bounding_box,
                    pixels,
                    team: $team(entity),
                    abandoned: false,
                }
            })
            .collect::<Vec<DebugEntity>>()
    };
}

impl World {
    pub fn debug(&self, terrain: bool, dynamic: bool) -> String {
        let mut debug_info: Vec<DebugEntity> = vec![];
        let players = &self.players;

        if dynamic {
            debug_info.extend(collect_debug!(self, men, Man, |man: &Man| {
                Some(man.get_team())
            }));
        }

        if terrain {
            debug_info.extend(collect_debug!(self, grounds, Ground, |_| None));
            debug_info.extend(collect_debug!(self, waters, Water, |_| None));
        }

        if dynamic {
            let mut planes =
                collect_debug!(self, planes, Plane, |plane: &Plane| Some(plane.get_team()));
            for entry in planes.iter_mut() {
                if let DebugEntityType::Plane(id) = entry.ent_type {
                    entry.abandoned = !players
                        .get_map()
                        .values()
                        .any(|p| p.get_controlling() == Some(ControllingEntity::Plane(id)));
                }
            }
            debug_info.extend(planes);
        }

        if terrain {
            debug_info.extend(collect_debug!(self, coasts, Coast, |_| None));
            debug_info.extend(collect_debug!(self, runways, Runway, |runway: &Runway| {
                Some(*runway.get_team())
            }));
            debug_info.extend(collect_debug!(self, bunkers, Bunker, |bunker: &Bunker| {
                Some(*bunker.get_team())
            }));
            debug_info.extend(
                self.runways
                    .get_map()
                    .iter()
                    .map(|(idx, runway)| DebugEntity {
                        ent_type: DebugEntityType::Runway(*idx),
                        bounding_box: runway.get_landing_bounds(),
                        pixels: None,
                        team: Some(*runway.get_team()),
                        abandoned: false,
                    }),
            );
        }

        if dynamic {
            debug_info.extend(collect_debug!(self, bombs, Bomb, |bomb: &Bomb| players
                .get(bomb.player_id())
                .and_then(|p| *p.get_team())));
            debug_info.extend(collect_debug!(
                self,
                explosions,
                Explosion,
                |explosion: &Explosion| *explosion.get_team()
            ));
            debug_info.extend(collect_debug!(self, bullets, Bullet, |bullet: &Bullet| {
                players.get(bullet.player_id()).and_then(|p| *p.get_team())
            }));
        }

        serde_json::to_string(&debug_info).unwrap()
    }
}

pub fn log(message: String) -> () {
    #[cfg(target_arch = "wasm32")]
    web_sys::console::log_1(&format!("{}", message).into());
    #[cfg(not(target_arch = "wasm32"))]
    let _ = message;
}
