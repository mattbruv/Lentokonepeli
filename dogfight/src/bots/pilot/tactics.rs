use crate::{
    entities::{
        container::PlaneId,
        plane::{Plane, PlaneMode},
        types::Team,
    },
    math::{direction_to_radians, radians_to_direction},
    world::World,
};

use super::{plane_pos, positive, wrap, Bot};

const TAIL_RANGE: f64 = 360.0;
const FIRE_HORIZON: f64 = 120.0;

#[derive(Clone, Copy)]
pub(super) struct Track {
    id: PlaneId,
    angle: f64,
    omega: f64,
    tick: u32,
}

struct Kinematics {
    x: f64,
    y: f64,
    angle: f64,
    speed: f64,
    omega: f64,
}

impl Kinematics {
    fn at(&self, t: f64) -> (f64, f64) {
        if self.omega.abs() < 1e-4 {
            let d = self.speed / 100.0 * t;
            return (self.x + self.angle.cos() * d, self.y + self.angle.sin() * d);
        }
        let r = self.speed / 100.0 / self.omega;
        let a = self.angle + self.omega * t;
        (
            self.x + r * (a.sin() - self.angle.sin()),
            self.y - r * (a.cos() - self.angle.cos()),
        )
    }
}

fn fired_angle(angle: f64) -> f64 {
    direction_to_radians(radians_to_direction(angle))
}

impl Bot {
    pub(super) fn update_tracks(&mut self, world: &World, team: Team) {
        let tick = world.get_tick();
        let mut next = Vec::with_capacity(self.tracks.len());
        for (id, p) in world.planes.get_map() {
            if p.get_team() == team || p.get_mode() != PlaneMode::Flying {
                continue;
            }
            let angle = p.get_angle();
            let omega = match self.tracks.iter().find(|t| t.id == *id) {
                Some(prev) if tick > prev.tick => {
                    let measured = wrap(angle - prev.angle) / (tick - prev.tick) as f64;
                    let limit = p.get_turn_rate() * 1.5 + 0.02;
                    0.5 * prev.omega + 0.5 * measured.clamp(-limit, limit)
                }
                Some(prev) => prev.omega,
                None => 0.0,
            };
            next.push(Track {
                id: *id,
                angle,
                omega,
                tick,
            });
        }
        self.tracks = next;
    }

    fn kinematics(&self, id: PlaneId, p: &Plane) -> Kinematics {
        let (x, y) = plane_pos(p);
        let omega = self
            .tracks
            .iter()
            .find(|t| t.id == id)
            .map(|t| t.omega)
            .unwrap_or(0.0);
        let flying = matches!(p.get_mode(), PlaneMode::Flying | PlaneMode::Dodging);
        Kinematics {
            x,
            y,
            angle: p.get_angle(),
            speed: if flying { p.get_speed() } else { 0.0 },
            omega: if flying { omega } else { 0.0 },
        }
    }

    pub(super) fn tracked_aim(&self, shooter: &Plane, id: PlaneId, target: &Plane) -> (f64, f64) {
        let (sx, sy) = plane_pos(shooter);
        let k = self.kinematics(id, target);
        let bullet = shooter.get_bullet_speed();
        let mut t = ((k.x - sx).powi(2) + (k.y - sy).powi(2)).sqrt() / bullet;
        let mut point = (k.x, k.y);
        for _ in 0..6 {
            point = k.at(t.min(175.0));
            t = ((point.0 - sx).powi(2) + (point.1 - sy).powi(2)).sqrt() / bullet;
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

    pub(super) fn tactical_fire(&self, world: &World, team: Team, me: &Plane) -> bool {
        if me.get_ammo() <= 0 {
            return false;
        }
        let (x, y) = plane_pos(me);
        let heading = fired_angle(me.get_angle());
        let bullet = me.get_bullet_speed();
        world
            .planes
            .get_map()
            .iter()
            .filter(|(_, p)| p.get_team() != team && p.get_mode() != PlaneMode::Falling)
            .any(|(id, p)| {
                let k = self.kinematics(*id, p);
                let mut best = f64::INFINITY;
                let mut t = 0.0;
                while t < FIRE_HORIZON {
                    let (px, py) = k.at(t);
                    let bx = x + heading.cos() * bullet * t;
                    let by = y + heading.sin() * bullet * t;
                    best = best.min(((px - bx).powi(2) + (py - by).powi(2)).sqrt());
                    t += 2.0;
                }
                best < 9.0 + self.skill.fire_slack * 0.5
            })
    }
}
