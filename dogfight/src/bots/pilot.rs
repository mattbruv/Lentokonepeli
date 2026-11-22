use std::f64::consts::{PI, TAU};

use crate::{
    collision::SolidEntity,
    entities::{
        container::{ManId, PlaneId, RunwayId},
        man::{Man, ManState},
        plane::{Plane, PlaneMode, PlaneType},
        player::{ControllingEntity, Player, PlayerGuid, PlayerState},
        types::{Facing, Team},
        world_info::WorldState,
    },
    input::{
        AddPlayerData, PlayerCommand, PlayerKeyboard, RunwaySelection, ServerInput, TeamSelection,
    },
    world::World,
};

use super::{rng::Rng, skill::BotSkill, terrain::Terrain, AddBotRequest, BotInfo};

const CEILING_Y: f64 = -460.0;
const CRUISE_Y: f64 = -280.0;
const BOMB_Y: f64 = -230.0;

#[derive(Clone, Copy, PartialEq)]
enum Phase {
    Joining,
    Intermission,
    ChoosingTeam,
    ChoosingRunway,
    Parked,
    Flying,
    Man,
    Waiting,
}

#[derive(Clone, Copy)]
enum Target {
    Plane(PlaneId),
    Man(ManId),
}

#[derive(Clone, Copy)]
enum Goal {
    Patrol(f64, f64),
    Attack(Target),
    Bomb(f64, f64, f64),
    Land(RunwayId),
}

pub struct Bot {
    request: AddBotRequest,
    skill: BotSkill,
    rng: Rng,
    joined: bool,
    phase: Phase,
    wait_ticks: u32,
    goal: Goal,
    think_timer: u32,
    control_timer: u32,
    aim_offset: f64,
    held_keys: PlayerKeyboard,
    evade_ticks: u32,
    evade_dir: f64,
    evade_cooldown: u32,
    approach: bool,
    turn_commit: Option<f64>,
    terrain: Option<Terrain>,
    pub(crate) force_land: bool,
}

fn wrap(angle: f64) -> f64 {
    let mut a = angle % TAU;
    if a > PI {
        a -= TAU;
    } else if a < -PI {
        a += TAU;
    }
    a
}

fn positive(angle: f64) -> f64 {
    let a = angle % TAU;
    if a < 0.0 {
        a + TAU
    } else {
        a
    }
}

fn heading(direction: f64, pitch_up: f64) -> f64 {
    positive((-pitch_up.sin()).atan2(direction * pitch_up.cos()))
}

fn velocity(angle: f64, speed: f64) -> (f64, f64) {
    (angle.cos() * speed / 100.0, angle.sin() * speed / 100.0)
}

fn plane_pos(plane: &Plane) -> (f64, f64) {
    (plane.get_client_x() as f64, plane.get_client_y() as f64)
}

fn man_pos(man: &Man) -> (f64, f64) {
    let b = man.get_collision_bounds();
    (
        b.x as f64 + b.width as f64 / 2.0,
        b.y as f64 + b.height as f64 / 2.0,
    )
}

fn passes_through(from: f64, arc: f64, point: f64) -> bool {
    if arc >= 0.0 {
        positive(point - from) < arc
    } else {
        positive(from - point) < -arc
    }
}

impl Bot {
    pub fn new(request: AddBotRequest) -> Self {
        let skill = BotSkill::for_difficulty(request.difficulty);
        let rng = Rng::from_str(&format!("{:?}", request.guid));
        Bot {
            request,
            skill,
            rng,
            joined: false,
            phase: Phase::Joining,
            wait_ticks: 0,
            goal: Goal::Patrol(0.0, CRUISE_Y),
            think_timer: 0,
            control_timer: 0,
            aim_offset: 0.0,
            held_keys: PlayerKeyboard::new(),
            evade_ticks: 0,
            evade_dir: 1.0,
            evade_cooldown: 0,
            approach: false,
            turn_commit: None,
            terrain: None,
            force_land: false,
        }
    }

    pub fn guid(&self) -> &PlayerGuid {
        &self.request.guid
    }

    pub fn info(&self) -> BotInfo {
        BotInfo {
            guid: self.request.guid.clone(),
            name: self.request.name.clone(),
            team: self.request.team,
            difficulty: self.request.difficulty,
        }
    }

    fn command(&self, command: PlayerCommand) -> ServerInput {
        ServerInput {
            player_guid: self.request.guid.clone(),
            command,
        }
    }

    fn enter_phase(&mut self, phase: Phase) {
        if self.phase == phase {
            return;
        }
        self.phase = phase;
        self.wait_ticks = match phase {
            Phase::ChoosingTeam => self.rng.range_u32(20, 60),
            Phase::ChoosingRunway => {
                let (low, high) = self.skill.respawn_delay;
                self.rng.range_u32(low, high)
            }
            Phase::Parked => {
                let (low, high) = self.skill.refuel_delay;
                self.rng.range_u32(low, high)
            }
            _ => 0,
        };
        self.think_timer = 0;
        self.control_timer = 0;
        self.goal = Goal::Patrol(0.0, CRUISE_Y);
        self.approach = false;
        self.turn_commit = None;
        self.evade_ticks = 0;
        self.held_keys = PlayerKeyboard::new();
    }

    fn countdown(&mut self, retry: u32) -> bool {
        if self.wait_ticks > 0 {
            self.wait_ticks -= 1;
            return false;
        }
        self.wait_ticks = retry;
        true
    }

    pub fn think(&mut self, world: &World) -> Vec<ServerInput> {
        let mut commands = vec![];

        if !self.joined {
            self.joined = true;
            commands.push(self.command(PlayerCommand::AddBot(AddPlayerData {
                guid: self.request.guid.clone(),
                name: self.request.name.clone(),
                clan: None,
            })));
            return commands;
        }

        if self.terrain.is_none() && !world.grounds.get_map().is_empty() {
            self.terrain = Some(Terrain::from_world(world));
        }

        let Some((_, player)) = world.get_player_from_guid(&self.request.guid) else {
            return commands;
        };

        let mut keys = PlayerKeyboard::new();

        if world.world_info.get_state() == WorldState::Intermission {
            self.enter_phase(Phase::Intermission);
            keys.enter = !player.is_ready();
        } else {
            match (
                player.get_state(),
                *player.get_team(),
                player.get_controlling(),
            ) {
                (_, Some(team), Some(ControllingEntity::Plane(plane_id))) => {
                    self.enter_phase(Phase::Flying);
                    keys = self.fly(world, team, plane_id);
                }
                (_, Some(team), Some(ControllingEntity::Man(man_id))) => {
                    self.enter_phase(Phase::Man);
                    keys = self.walk(world, team, man_id);
                }
                (_, Some(_), Some(ControllingEntity::Runway(runway_id, plane_type))) => {
                    self.enter_phase(Phase::Parked);
                    if self.countdown(30) {
                        commands.push(self.command(PlayerCommand::PlayerChooseRunway(
                            RunwaySelection {
                                runway_id,
                                plane_type,
                            },
                        )));
                    }
                }
                (PlayerState::ChoosingTeam, None, None) => {
                    self.enter_phase(Phase::ChoosingTeam);
                    if self.countdown(50) {
                        commands.push(self.command(PlayerCommand::PlayerChooseTeam(
                            TeamSelection {
                                team: self.request.team,
                            },
                        )));
                    }
                }
                (PlayerState::ChoosingRunway, Some(team), None) => {
                    self.enter_phase(Phase::ChoosingRunway);
                    if self.countdown(25) {
                        if let Some(selection) = self.choose_takeoff(world, player, team) {
                            commands
                                .push(self.command(PlayerCommand::PlayerChooseRunway(selection)));
                        }
                    }
                }
                _ => self.enter_phase(Phase::Waiting),
            }
        }

        if keys != *player.get_keys() {
            commands.insert(0, self.command(PlayerCommand::PlayerKeyboard(keys)));
        }

        commands
    }

    fn choose_takeoff(
        &mut self,
        world: &World,
        player: &Player,
        team: Team,
    ) -> Option<RunwaySelection> {
        let runways: Vec<RunwayId> = world
            .runways
            .get_map()
            .iter()
            .filter(|(_, r)| *r.get_team() == team && r.is_alive())
            .map(|(id, _)| *id)
            .collect();
        if runways.is_empty() {
            return None;
        }

        let runway_id = match player.get_last_runway() {
            Some(last) if runways.contains(&last) && self.rng.chance(0.5) => last,
            _ => {
                let mut sorted = runways.clone();
                sorted.sort_by_key(|id| world.runways.get(*id).map(|r| r.get_client_x()));
                sorted[(self.rng.next_u64() % sorted.len() as u64) as usize]
            }
        };

        let enemy_structures = world
            .runways
            .get_map()
            .values()
            .any(|r| *r.get_team() != team && r.is_alive());

        let index = if self.skill.bomber_chance <= 0.0 {
            (self.rng.next_u64() % 3) as u8
        } else if enemy_structures && self.rng.chance(self.skill.bomber_chance) {
            1
        } else if self.rng.chance(0.5) {
            0
        } else {
            2
        };

        Some(RunwaySelection {
            runway_id,
            plane_type: PlaneType::for_team(team, index),
        })
    }

    fn fly(&mut self, world: &World, team: Team, plane_id: PlaneId) -> PlayerKeyboard {
        let mut keys = PlayerKeyboard::new();
        let Some(plane) = world.planes.get(plane_id) else {
            return keys;
        };

        match plane.get_mode() {
            PlaneMode::Falling => {
                keys.space = true;
                keys
            }
            PlaneMode::Flying => {
                if self.control_timer > 0 {
                    self.control_timer -= 1;
                    return self.held_keys;
                }
                self.control_timer = self.skill.control_interval - 1;
                keys = self.pilot(world, team, plane);
                self.held_keys = keys;
                keys
            }
            _ => {
                self.approach = false;
                keys
            }
        }
    }

    fn enemy_structure(&self, world: &World, team: Team, from_x: f64) -> Option<(f64, f64, f64)> {
        let mut best: Option<(f64, (f64, f64, f64))> = None;
        let mut consider = |b: crate::collision::BoundingBox| {
            let center = b.x as f64 + b.width as f64 / 2.0;
            let d = (center - from_x).abs();
            if best.map(|(bd, _)| d < bd).unwrap_or(true) {
                best = Some((d, (center, b.y as f64, b.width as f64 * 0.3)));
            }
        };
        for runway in world.runways.get_map().values() {
            if *runway.get_team() != team && runway.is_alive() {
                consider(runway.get_collision_bounds());
            }
        }
        for bunker in world.bunkers.get_map().values() {
            if *bunker.get_team() != team && bunker.is_alive() {
                consider(bunker.get_collision_bounds());
            }
        }
        best.map(|(_, s)| s)
    }

    fn nearest_own_runway(&self, world: &World, team: Team, x: f64) -> Option<RunwayId> {
        world
            .runways
            .get_map()
            .iter()
            .filter(|(_, r)| *r.get_team() == team && r.is_alive())
            .min_by(|a, b| {
                let da = (a.1.get_start_x() as f64 - x).abs();
                let db = (b.1.get_start_x() as f64 - x).abs();
                da.total_cmp(&db)
            })
            .map(|(id, _)| *id)
    }

    fn choose_goal(&mut self, world: &World, team: Team, plane: &Plane) -> Goal {
        let (x, y) = plane_pos(plane);

        let is_bomber = matches!(
            plane.get_plane_type(),
            PlaneType::Junkers | PlaneType::Salmson
        );
        let needs_service = self.force_land
            || plane.get_fuel_ratio() < 0.15
            || (self.skill.manage_resources
                && (plane.get_fuel_ratio() < 0.22
                    || plane.get_health_ratio() < 0.35
                    || (plane.get_ammo() == 0 && (plane.get_bombs() == 0 || !is_bomber))));
        if needs_service {
            if let Goal::Land(runway_id) = self.goal {
                if world
                    .runways
                    .get(runway_id)
                    .map(|r| r.is_alive())
                    .unwrap_or(false)
                {
                    return self.goal;
                }
            }
            if let Some(runway_id) = self.nearest_own_runway(world, team, x) {
                self.approach = false;
                return Goal::Land(runway_id);
            }
        }

        if plane.get_bombs() > 0 {
            if let Some((tx, ty, half)) = self.enemy_structure(world, team, x) {
                return Goal::Bomb(tx, ty, half);
            }
        }

        if plane.get_ammo() > 0 {
            let enemy_plane = world
                .planes
                .get_map()
                .iter()
                .filter(|(_, p)| p.get_team() != team && p.get_mode() != PlaneMode::Falling)
                .map(|(id, p)| {
                    let (px, py) = plane_pos(p);
                    (*id, ((px - x).powi(2) + (py - y).powi(2)).sqrt())
                })
                .filter(|(_, d)| *d < self.skill.vision)
                .min_by(|a, b| a.1.total_cmp(&b.1));
            if let Some((id, _)) = enemy_plane {
                return Goal::Attack(Target::Plane(id));
            }

            if self.skill.hunt_men {
                let enemy_man = world
                    .men
                    .get_map()
                    .iter()
                    .filter(|(_, m)| m.get_team() != team)
                    .map(|(id, m)| {
                        let (mx, my) = man_pos(m);
                        (*id, ((mx - x).powi(2) + (my - y).powi(2)).sqrt())
                    })
                    .filter(|(_, d)| *d < self.skill.vision * 0.6)
                    .min_by(|a, b| a.1.total_cmp(&b.1));
                if let Some((id, _)) = enemy_man {
                    return Goal::Attack(Target::Man(id));
                }
            }
        }

        let patrol_x = match self.goal {
            Goal::Patrol(px, _) if (px - x).abs() > 150.0 => px,
            _ => {
                let base = self
                    .enemy_structure(world, team, x)
                    .map(|s| s.0)
                    .unwrap_or(0.0);
                base + self.rng.range(-600.0, 600.0)
            }
        };
        Goal::Patrol(patrol_x, CRUISE_Y + self.rng.range(-80.0, 80.0))
    }

    fn target_state(&self, world: &World, target: Target) -> Option<(f64, f64, f64, f64)> {
        match target {
            Target::Plane(id) => world.planes.get(id).and_then(|p| {
                if p.get_mode() == PlaneMode::Falling {
                    return None;
                }
                let (x, y) = plane_pos(p);
                let (vx, vy) = match p.get_mode() {
                    PlaneMode::Flying | PlaneMode::Dodging | PlaneMode::TakingOff => {
                        velocity(p.get_angle(), p.get_speed())
                    }
                    _ => (0.0, 0.0),
                };
                Some((x, y, vx, vy))
            }),
            Target::Man(id) => world.men.get(id).map(|m| {
                let (x, y) = man_pos(m);
                let vy = match m.get_state() {
                    ManState::Parachuting => 1.0,
                    ManState::Falling => 2.0,
                    _ => 0.0,
                };
                (x, y, 0.0, vy)
            }),
        }
    }

    fn aim_at(&self, plane: &Plane, tx: f64, ty: f64, tvx: f64, tvy: f64) -> (f64, f64) {
        let (x, y) = plane_pos(plane);
        let bullet_speed = plane.get_speed() / 100.0 + 4.0;
        let mut px = tx;
        let mut py = ty;
        for _ in 0..3 {
            let distance = ((px - x).powi(2) + (py - y).powi(2)).sqrt();
            let t = distance / bullet_speed * self.skill.lead;
            px = tx + tvx * t;
            py = ty + tvy * t;
        }
        let distance = ((px - x).powi(2) + (py - y).powi(2)).sqrt();
        (positive((py - y).atan2(px - x)), distance)
    }

    fn should_fire(&self, world: &World, team: Team, plane: &Plane) -> bool {
        if plane.get_ammo() <= 0 {
            return false;
        }
        let angle = plane.get_angle();
        let mut targets: Vec<(f64, f64, f64, f64)> = world
            .planes
            .get_map()
            .values()
            .filter(|p| p.get_team() != team && p.get_mode() != PlaneMode::Falling)
            .map(|p| {
                let (x, y) = plane_pos(p);
                let (vx, vy) = velocity(p.get_angle(), p.get_speed());
                (x, y, vx, vy)
            })
            .collect();
        if self.skill.hunt_men {
            targets.extend(
                world
                    .men
                    .get_map()
                    .values()
                    .filter(|m| m.get_team() != team)
                    .map(|m| {
                        let (x, y) = man_pos(m);
                        (x, y, 0.0, 0.0)
                    }),
            );
        }
        targets.into_iter().any(|(tx, ty, tvx, tvy)| {
            let (aim, distance) = self.aim_at(plane, tx, ty, tvx, tvy);
            let error = wrap(aim + self.aim_offset - angle).abs();
            let miss = distance * error.min(PI / 2.0).sin();
            distance < self.skill.fire_range
                && error < PI / 2.0
                && miss < 14.0 + self.skill.fire_slack
        })
    }

    fn threatened(&self, world: &World, team: Team, plane: &Plane) -> bool {
        let (x, y) = plane_pos(plane);
        let (hx, hy) = (plane.get_angle().cos(), plane.get_angle().sin());
        world.planes.get_map().values().any(|p| {
            if p.get_team() == team || p.get_mode() != PlaneMode::Flying {
                return false;
            }
            let (px, py) = plane_pos(p);
            let (dx, dy) = (x - px, y - py);
            let distance = (dx * dx + dy * dy).sqrt();
            if distance > 280.0 || distance < 1.0 {
                return false;
            }
            let behind = -(dx * hx + dy * hy) / distance > 0.3;
            let aimed = wrap(dy.atan2(dx) - p.get_angle()).abs() < 0.35;
            behind && aimed
        })
    }

    fn predict_bomb_x(&self, plane: &Plane, target_y: f64) -> f64 {
        let (mut x, mut y) = plane_pos(plane);
        let angle = plane.get_angle();
        let mut vx = angle.cos() * plane.get_speed() / 100.0;
        let mut vy = angle.sin() * plane.get_speed() / 100.0;
        for _ in 0..600 {
            if y >= target_y {
                break;
            }
            x += vx;
            y += vy;
            vx -= vx * 0.01;
            vy += 0.0333;
        }
        x
    }

    fn pilot(&mut self, world: &World, team: Team, plane: &Plane) -> PlayerKeyboard {
        let mut keys = PlayerKeyboard::new();
        let (x, y) = plane_pos(plane);
        let angle = plane.get_angle();
        let speed = plane.get_speed();
        let (vx, vy) = velocity(angle, speed);
        let h = if angle.cos() >= 0.0 { 1.0 } else { -1.0 };

        if self.think_timer == 0 {
            self.think_timer = self.skill.think_interval;
            self.goal = self.choose_goal(world, team, plane);
            self.aim_offset = self.rng.range(-self.skill.aim_noise, self.skill.aim_noise);
        } else {
            self.think_timer = self.think_timer.saturating_sub(self.skill.control_interval);
        }

        self.evade_cooldown = self
            .evade_cooldown
            .saturating_sub(self.skill.control_interval);
        if self.skill.evade
            && self.evade_ticks == 0
            && self.evade_cooldown == 0
            && !matches!(self.goal, Goal::Land(_))
            && self.threatened(world, team, plane)
        {
            self.evade_ticks = self.rng.range_u32(20, 40);
            self.evade_dir = if self.rng.chance(0.5) { 1.0 } else { -1.0 };
            self.evade_cooldown = 150;
        }

        let mut motor = true;
        let mut landing = false;
        let mut want_flipped = if plane.flipped() {
            angle.cos() < 0.2
        } else {
            angle.cos() < -0.2
        };

        let mut desired = match self.goal {
            Goal::Patrol(px, py) => positive((py - y).clamp(-200.0, 200.0).atan2(px - x)),
            Goal::Attack(target) => match self.target_state(world, target) {
                Some((tx, ty, tvx, tvy)) => {
                    let (aim, distance) = self.aim_at(plane, tx, ty, tvx, tvy);
                    let swerve = if self.skill.evade && distance < 80.0 {
                        0.6
                    } else {
                        0.0
                    };
                    positive(aim + self.aim_offset + swerve)
                }
                None => {
                    self.think_timer = 0;
                    heading(h, 0.0)
                }
            },
            Goal::Bomb(tx, ty, half) => {
                let impact = self.predict_bomb_x(plane, ty);
                if (impact - tx).abs() < half && plane.get_bombs() > 0 {
                    keys.shift = true;
                }
                let dx = tx - x;
                let toward = if dx.abs() < 40.0 { h } else { dx.signum() };
                positive((BOMB_Y - y).clamp(-120.0, 120.0).atan2(toward * 300.0))
            }
            Goal::Land(runway_id) => match self.landing_heading(world, plane, runway_id) {
                Some((d, m, flip, on_approach)) => {
                    motor = m;
                    landing = on_approach;
                    if let Some(f) = flip {
                        want_flipped = f;
                    }
                    d
                }
                None => {
                    self.think_timer = 0;
                    heading(h, 0.0)
                }
            },
        };

        if self.evade_ticks > 0 {
            self.evade_ticks = self.evade_ticks.saturating_sub(self.skill.control_interval);
            desired = positive(angle + self.evade_dir * 1.2);
        }

        let terrain_floor = self.terrain.as_ref().map(|t| {
            let look = self.skill.lookahead;
            let fx = x + vx * look;
            (t.surface(x - 40.0, fx + 40.0), t.min_x, t.max_x)
        });

        let mut low = false;
        if let Some((surface, min_x, max_x)) = terrain_floor {
            let floor = surface - self.skill.floor_margin;
            let future_y = y + vy * self.skill.lookahead;
            low = y > floor - 220.0;

            let margin = if matches!(self.goal, Goal::Land(_)) {
                -1500.0
            } else {
                250.0
            };
            if x < min_x + margin && h < 0.0 {
                desired = heading(1.0, 0.35);
            } else if x > max_x - margin && h > 0.0 {
                desired = heading(-1.0, 0.35);
            }

            if !landing {
                if y > floor || future_y > floor {
                    let pitch = if speed < 150.0 { 0.25 } else { 0.6 };
                    desired = heading(h, pitch);
                } else if speed < 110.0 && y < floor - 80.0 && vy < 0.5 {
                    desired = heading(h, -0.5);
                }
            }
        }

        if y < CEILING_Y && desired.sin() < 0.05 {
            let direction = if desired.cos() >= 0.0 { 1.0 } else { -1.0 };
            desired = heading(direction, -0.15);
        }

        let high = y < CEILING_Y + 60.0;
        let mut diff = wrap(desired - angle);
        let flip_arc = |d: f64| if d > 0.0 { d - TAU } else { d + TAU };
        if diff.abs() > 1.0 && !landing {
            match self.turn_commit {
                Some(sign) if sign * diff < 0.0 => diff = flip_arc(diff),
                Some(_) => {}
                None => {
                    if high && passes_through(angle, diff, 1.5 * PI) {
                        diff = flip_arc(diff);
                    }
                }
            }
            if low && passes_through(angle, diff, PI / 2.0) {
                diff = flip_arc(diff);
            }
            self.turn_commit = Some(diff.signum());
        } else if diff.abs() < 0.5 {
            self.turn_commit = None;
        }

        let deadband = 0.03;
        if diff > deadband {
            keys.right = true;
        } else if diff < -deadband {
            keys.left = true;
        }

        if plane.flipped() != want_flipped {
            keys.up = true;
        }

        if plane.get_motor_on() != motor {
            keys.down = true;
        }

        if !landing && self.should_fire(world, team, plane) {
            keys.ctrl = true;
        }

        keys
    }

    fn landing_heading(
        &mut self,
        world: &World,
        plane: &Plane,
        runway_id: RunwayId,
    ) -> Option<(f64, bool, Option<bool>, bool)> {
        let runway = world.runways.get(runway_id)?;
        if !runway.is_alive() {
            return None;
        }

        let (x, y) = plane_pos(plane);
        let angle = plane.get_angle();
        let dir = match runway.get_facing() {
            Facing::Right => -1.0,
            Facing::Left => 1.0,
        };
        let lx = runway.get_landable_x() as f64;
        let lw = runway.get_landable_width() as f64;
        let width = plane.get_width() as f64;
        let span = (lw - width).max(10.0);
        let touchdown = lx + span * 0.5;
        let surface = runway.get_landable_y() as f64 - plane.get_bottom_height() as f64;
        let s = (touchdown - x) * dir;
        let glide = |s: f64| surface - (s * 0.12 - 6.0).clamp(-8.0, 220.0);
        let aligned = angle.cos() * dir;
        let speed = plane.get_speed();
        let limit = plane.get_landing_speed_limit();

        if self.approach {
            let too_high = y < glide(s) - 120.0;
            let too_fast = s < 200.0 && speed > limit - 15.0;
            if s < -span * 0.5 + 4.0 || aligned < 0.5 || too_high || too_fast {
                self.approach = false;
            }
        } else if (250.0..1500.0).contains(&s) && aligned > 0.8 && (y - glide(s)).abs() < 70.0 {
            self.approach = true;
        }

        if self.approach {
            let look = if s < 300.0 { 60.0 } else { 120.0 };
            let target_y = glide(s - look);
            let pitch = ((target_y - y) / look).atan().clamp(-0.3, 0.35);
            let desired = heading(dir, -pitch);
            let motor = s > 300.0 && speed < 200.0;
            return Some((desired, motor, Some(dir < 0.0), true));
        }

        let gate = 1000.0;
        let error = y - glide(s);
        let reachable = error.abs() < 40.0 + 0.3 * (s - 250.0);
        if s > 250.0 && aligned > 0.5 && reachable {
            let look = 200.0;
            let target_y = glide((s - look).max(0.0));
            let pitch = ((target_y - y) / look).atan().clamp(-0.3, 0.5);
            return Some((heading(dir, -pitch), speed < 240.0, None, false));
        }

        if s >= gate {
            let target_y = glide(gate);
            let pitch = ((target_y - y) / 300.0).atan().clamp(-0.45, 0.4);
            return Some((heading(dir, -pitch), speed < 280.0, None, false));
        }

        let gate_x = touchdown - dir * (gate + 250.0);
        let gate_y = glide(gate) - 40.0;
        let desired = positive((gate_y - y).clamp(-250.0, 250.0).atan2(gate_x - x));
        Some((desired, true, None, false))
    }

    fn walk(&mut self, world: &World, team: Team, man_id: ManId) -> PlayerKeyboard {
        let mut keys = PlayerKeyboard::new();
        let Some(man) = world.men.get(man_id) else {
            return keys;
        };
        let (x, y) = man_pos(man);

        let home = world
            .runways
            .get_map()
            .values()
            .filter(|r| *r.get_team() == team && r.is_alive())
            .map(|r| {
                let b = r.get_collision_bounds();
                b.x as f64 + b.width as f64 / 2.0
            })
            .min_by(|a, b| (a - x).abs().total_cmp(&(b - x).abs()));

        let threat_range = 420.0;
        let enemy_near = world.planes.get_map().values().any(|p| {
            let (px, py) = plane_pos(p);
            p.get_team() != team && ((px - x).powi(2) + (py - y).powi(2)).sqrt() < threat_range
        }) || world.men.get_map().values().any(|m| {
            let (mx, my) = man_pos(m);
            m.get_team() != team && ((mx - x).powi(2) + (my - y).powi(2)).sqrt() < threat_range
        });

        match man.get_state() {
            ManState::Falling => {
                keys.space = true;
            }
            ManState::Parachuting => {
                let over_water = self
                    .terrain
                    .as_ref()
                    .map(|t| t.is_water(x))
                    .unwrap_or(false);
                let goal = match home {
                    Some(hx) => Some(hx),
                    None if over_water => self.terrain.as_ref().map(|t| (t.min_x + t.max_x) / 2.0),
                    None => None,
                };
                if let Some(gx) = goal {
                    if gx < x - 4.0 {
                        keys.left = true;
                    } else if gx > x + 4.0 {
                        keys.right = true;
                    }
                }
                keys.ctrl = enemy_near;
            }
            _ => {
                let distance = home.map(|hx| (hx - x).abs()).unwrap_or(f64::INFINITY);
                if distance > self.skill.max_walk && !enemy_near {
                    keys.shift = true;
                    return keys;
                }
                if let Some(hx) = home {
                    if hx < x - 4.0 {
                        keys.left = true;
                    } else if hx > x + 4.0 {
                        keys.right = true;
                    }
                }
                keys.ctrl = enemy_near;
            }
        }

        keys
    }
}
