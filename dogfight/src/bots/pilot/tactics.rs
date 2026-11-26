use std::collections::HashMap;

use image::RgbaImage;

use crate::{
    collision::{BoundingBox, SolidEntity},
    entities::{
        bullet::{Bullet, BulletOrigin, BULLET_LIFETIME},
        container::PlaneId,
        man::ManState,
        plane::{Ghost, Plane, PlaneMode},
        player::ControllingEntity,
        types::Team,
    },
    input::PlayerKeyboard,
    math::radians_to_direction,
    world::{World, RESOLUTION},
};

use super::{plane_pos, positive, wrap, Bot};

const TAIL_RANGE: f64 = 360.0;
const HORIZON: usize = BULLET_LIFETIME as usize + 1;
const REACH: f64 = 1600.0;

fn within_reach(x: f64, y: f64, (px, py): (f64, f64)) -> bool {
    (px - x).abs() < REACH && (py - y).abs() < REACH
}

pub(super) struct Track {
    id: PlaneId,
    path: Vec<Ghost>,
}

fn keys_of(world: &World, entity: ControllingEntity) -> Option<&PlayerKeyboard> {
    world
        .players
        .get_map()
        .values()
        .find(|p| p.get_controlling() == Some(entity))
        .map(|p| p.get_keys())
}

fn ghost_center(g: &Ghost) -> (f64, f64) {
    (
        (g.state.x / RESOLUTION) as f64,
        (g.state.y / RESOLUTION) as f64,
    )
}

fn mask_hits(mask: &RgbaImage, mask_bounds: &BoundingBox, other: &BoundingBox) -> bool {
    let Some(i) = mask_bounds.intersection(other) else {
        return false;
    };
    (0..i.height).any(|dy| {
        (0..i.width).any(|dx| {
            let px = (i.x + dx - mask_bounds.x) as u32;
            let py = (i.y + dy - mask_bounds.y) as u32;
            px < mask.width() && py < mask.height() && mask.get_pixel(px, py)[3] != 0
        })
    })
}

impl Bot {
    pub(super) fn update_tracks(&mut self, world: &World, x: f64, y: f64) {
        self.tracks = world
            .planes
            .get_map()
            .iter()
            .filter(|(_, p)| within_reach(x, y, plane_pos(p)))
            .map(|(id, p)| Track {
                id: *id,
                path: p.predict(keys_of(world, ControllingEntity::Plane(*id)), HORIZON),
            })
            .collect();
    }

    fn path(&self, id: PlaneId) -> Option<&Vec<Ghost>> {
        self.tracks.iter().find(|t| t.id == id).map(|t| &t.path)
    }

    pub(super) fn tracked_aim(&self, shooter: &Plane, id: PlaneId, target: &Plane) -> (f64, f64) {
        let (sx, sy) = plane_pos(shooter);
        let bullet = shooter.get_bullet_speed();
        let at = |t: f64| -> (f64, f64) {
            match self.path(id) {
                Some(path) if !path.is_empty() => {
                    ghost_center(&path[(t.max(0.0) as usize).min(path.len() - 1)])
                }
                _ => plane_pos(target),
            }
        };
        let mut point = at(0.0);
        for _ in 0..8 {
            let t = ((point.0 - sx).powi(2) + (point.1 - sy).powi(2)).sqrt() / bullet;
            point = at(t);
        }
        let distance = ((point.0 - sx).powi(2) + (point.1 - sy).powi(2)).sqrt();
        (positive((point.1 - sy).atan2(point.0 - sx)), distance)
    }

    fn on_my_tail(&self, me: &Plane, other: &Plane) -> bool {
        let (x, y) = plane_pos(me);
        let (px, py) = plane_pos(other);
        let (dx, dy) = (x - px, y - py);
        let distance = (dx * dx + dy * dy).sqrt();
        if distance > TAIL_RANGE || distance < 1.0 {
            return false;
        }
        wrap(dy.atan2(dx) - other.get_angle()).abs() < 0.5
    }

    pub(super) fn pick_enemy_plane(
        &self,
        world: &World,
        team: Team,
        me: &Plane,
        range: f64,
    ) -> Option<PlaneId> {
        let (x, y) = plane_pos(me);
        let angle = me.get_angle();
        world
            .planes
            .get_map()
            .iter()
            .filter(|(_, p)| p.get_team() != team && p.get_mode() != PlaneMode::Falling)
            .filter_map(|(id, p)| {
                let (px, py) = plane_pos(p);
                let distance = ((px - x).powi(2) + (py - y).powi(2)).sqrt();
                if distance > range {
                    return None;
                }
                let (aim, _) = self.tracked_aim(me, *id, p);
                let turn = wrap(aim - angle).abs();
                let mut score = distance + turn * 220.0;
                if self.on_my_tail(me, p) {
                    score -= 600.0;
                }
                let hunting_teammate = world.planes.get_map().values().any(|mate| {
                    mate.get_team() == team
                        && mate.player_id() != me.player_id()
                        && mate.get_mode() == PlaneMode::Flying
                        && self.on_my_tail(mate, p)
                });
                if hunting_teammate {
                    score -= 300.0;
                }
                score -= (1.0 - p.get_health_ratio()) * 250.0;
                if p.get_mode() != PlaneMode::Flying {
                    score -= 150.0;
                }
                Some((*id, score))
            })
            .min_by(|a, b| a.1.total_cmp(&b.1))
            .map(|(id, _)| id)
    }

    pub(super) fn exact_fire(
        &self,
        world: &World,
        team: Team,
        my_id: PlaneId,
        me: &Plane,
        keys: &PlayerKeyboard,
    ) -> bool {
        let (mx, my) = plane_pos(me);
        let hunts_men = self.hunts_men(world);
        let enemy_in_reach = self.tracks.iter().any(|t| {
            world
                .planes
                .get(t.id)
                .is_some_and(|p| p.get_team() != team && p.get_mode() != PlaneMode::Falling)
        }) || (hunts_men
            && world
                .men
                .get_map()
                .values()
                .any(|m| m.get_team() != team && within_reach(mx, my, super::man_pos(m))));
        if !enemy_in_reach {
            return false;
        }

        let next = me.predict(Some(keys), 1)[0].state;
        let (sx, sy) = me.bullet_spawn(&next);
        let mut bullet = Bullet::new(
            me.player_id(),
            BulletOrigin::Plane(my_id),
            sx,
            sy,
            next.angle,
            next.speed / 100.0,
        );
        let men: Vec<(bool, BoundingBox, &RgbaImage, Vec<(i32, i32)>)> = world
            .men
            .get_map()
            .iter()
            .filter(|(_, m)| within_reach(mx, my, super::man_pos(m)))
            .filter_map(|(id, m)| {
                let keys = keys_of(world, ControllingEntity::Man(*id))
                    .copied()
                    .unwrap_or_else(PlayerKeyboard::new);
                let mut offsets = Vec::with_capacity(HORIZON);
                let (mut ox, mut oy) = (0i32, 0i32);
                let mut y_speed = m.get_y_speed();
                for _ in 0..HORIZON {
                    match m.get_state() {
                        ManState::Falling => {
                            oy += y_speed / 100;
                            y_speed += 100 / 30;
                        }
                        ManState::Parachuting => {
                            y_speed = ((y_speed as f64 * 0.95) as i32).max(100);
                            oy += y_speed / 100;
                            ox += keys.right as i32 - keys.left as i32;
                        }
                        _ => {
                            ox += keys.right as i32 - keys.left as i32;
                        }
                    }
                    offsets.push((ox, oy));
                }
                Some((
                    m.get_team() != team,
                    m.get_collision_bounds(),
                    m.get_collision_image()?,
                    offsets,
                ))
            })
            .collect();

        let mut masks: HashMap<(PlaneId, u8, bool), RgbaImage> = HashMap::new();

        for k in 0..HORIZON {
            if k > 0 {
                bullet.move_bullet();
            }
            let b = bullet.get_collision_bounds();

            if let Some(terrain) = self.terrain.as_ref() {
                if (b.y + b.height) as f64 > terrain.surface(b.x as f64, (b.x + b.width) as f64) {
                    return false;
                }
            }

            for track in &self.tracks {
                if track.id == my_id {
                    continue;
                }
                let Some(plane) = world.planes.get(track.id) else {
                    continue;
                };
                let Some(ghost) = track.path.get(k) else {
                    continue;
                };
                let bounds = plane.ghost_bounds(ghost);
                if !bounds.intersects(&b) {
                    continue;
                }
                let key = (
                    track.id,
                    radians_to_direction(ghost.state.angle),
                    ghost.flipped,
                );
                let mask = masks.entry(key).or_insert_with(|| plane.ghost_mask(ghost));
                if mask_hits(mask, &bounds, &b) {
                    return plane.get_team() != team && plane.get_mode() != PlaneMode::Falling;
                }
            }

            for (enemy, bounds, mask, offsets) in &men {
                let (ox, oy) = offsets[k];
                let moved = BoundingBox {
                    x: bounds.x + ox as i16,
                    y: bounds.y + oy as i16,
                    ..*bounds
                };
                if moved.intersects(&b) && mask_hits(mask, &moved, &b) {
                    return *enemy && hunts_men;
                }
            }
        }
        false
    }
}
