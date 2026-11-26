mod tactics;

use std::f64::consts::{PI, TAU};

use crate::{
    collision::SolidEntity,
    entities::{
        container::{ManId, PlaneId, RunwayId},
        man::{Man, ManState},
        plane::{Plane, PlaneMode, PlaneType},
        player::{ControllingEntity, Player, PlayerGuid, PlayerState},
        types::{Facing, Team},
        world_info::{GameMode, WorldState},
    },
    input::{
        AddPlayerData, PlayerCommand, PlayerKeyboard, RunwaySelection, ServerInput, TeamSelection,
    },
    world::World,
};

use super::{rng::Rng, skill::BotSkill, terrain::Terrain, AddBotRequest, BotInfo};

const CEILING_Y: f64 = -460.0;
const CRUISE_Y: f64 = -280.0;
const ROUNDS_BOMBER_FACTOR: f64 = 0.2;
const ROUNDS_VISION_FACTOR: f64 = 1.5;

fn is_rounds(world: &World) -> bool {
    world.get_game_mode() == GameMode::Rounds
}

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
    BombTarget(Target),
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
    bomb_offset: f64,
    held_keys: PlayerKeyboard,
    evade_ticks: u32,
    evade_dir: f64,
    evade_cooldown: u32,
    approach: bool,
    turn_commit: Option<f64>,
    terrain: Option<Terrain>,
    pub(crate) force_land: bool,
    tracks: Vec<tactics::Track>,
    bail_wait: Option<u32>,
    bail_hold: u32,
    chute_wait: Option<u32>,
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

fn enemy_plane_within(world: &World, team: Team, x: f64, y: f64, range: f64) -> bool {
    world.planes.get_map().values().any(|p| {
        let (px, py) = plane_pos(p);
        p.get_team() != team
            && p.get_mode() != PlaneMode::Falling
            && ((px - x).powi(2) + (py - y).powi(2)).sqrt() < range
    })
}

fn incoming_fire(world: &World, team: Team, x: f64, y: f64, drop: f64) -> bool {
    let near_column = |px: f64, py: f64, margin: f64| {
        (px - x).abs() < margin && py > y - margin && py < y + drop + margin
    };

    let aimed_planes = world.planes.get_map().values().any(|p| {
        if p.get_team() == team || p.get_mode() == PlaneMode::Falling {
            return false;
        }
        let (px, py) = plane_pos(p);
        let (dx, dy) = (x - px, y + drop / 2.0 - py);
        let distance = (dx * dx + dy * dy).sqrt();
        if distance < 220.0 {
            return true;
        }
        if distance > 650.0 {
            return false;
        }
        let bearing = dy.atan2(dx);
        let spread = 0.12 + (drop / 2.0 + 40.0) / distance;
        wrap(bearing - p.get_angle()).abs() < spread
    });
    if aimed_planes {
        return true;
    }

    world.bullets.get_map().values().any(|b| {
        let shooter_team = world.players.get(b.player_id()).and_then(|p| *p.get_team());
        if shooter_team == Some(team) || b.remaining_ticks() <= 0 {
            return false;
        }
        let (vx, vy) = b.get_velocity();
        let (bx, by) = (b.get_x() as f64, b.get_y() as f64);
        (0..b.remaining_ticks().min(90))
            .step_by(2)
            .any(|t| near_column(bx + vx * t as f64, by + vy * t as f64, 30.0))
    })
}

fn landing_hazard(world: &World, team: Team, terrain: &Terrain, x: f64) -> bool {
    let overlaps = |b: crate::collision::BoundingBox| {
        x + 16.0 >= b.x as f64 && x - 16.0 <= (b.x + b.width) as f64
    };
    terrain.is_water(x)
        || world
            .coasts
            .get_map()
            .values()
            .any(|c| overlaps(c.get_collision_bounds()))
        || world
            .bunkers
            .get_map()
            .values()
            .any(|b| b.is_alive() && overlaps(b.get_collision_bounds()))
        || world
            .runways
            .get_map()
            .values()
            .any(|r| r.is_alive() && *r.get_team() != team && overlaps(r.get_collision_bounds()))
}

fn safe_landing(world: &World, team: Team, terrain: &Terrain, x: f64, reach: f64) -> Option<f64> {
    let safe = |candidate: f64| {
        candidate >= terrain.min_x
            && candidate <= terrain.max_x
            && !landing_hazard(world, team, terrain, candidate)
    };
    let mut offset = 0.0;
    while offset <= reach {
        for candidate in [x - offset, x + offset] {
            if safe(candidate) {
                if offset == 0.0 {
                    return Some(candidate);
                }
                let deeper = candidate + (candidate - x).signum() * 40.0;
                return Some(if safe(deeper) { deeper } else { candidate });
            }
        }
        offset += 20.0;
    }
    None
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
            bomb_offset: 0.0,
            held_keys: PlayerKeyboard::new(),
            evade_ticks: 0,
            evade_dir: 1.0,
            evade_cooldown: 0,
            approach: false,
            turn_commit: None,
            terrain: None,
            force_land: false,
            tracks: vec![],
            bail_wait: None,
            bail_hold: 0,
            chute_wait: None,
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
        self.bail_wait = None;
        self.bail_hold = 0;
        self.chute_wait = None;
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

    pub(super) fn choose_takeoff(
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

        let rounds = is_rounds(world);
        let bomber_chance = if rounds {
            self.skill.bomber_chance * ROUNDS_BOMBER_FACTOR
        } else {
            self.skill.bomber_chance
        };

        let index = if self.skill.bomber_chance <= 0.0 && !rounds {
            (self.rng.next_u64() % 3) as u8
        } else if enemy_structures && self.rng.chance(bomber_chance) {
            1
        } else if let Some((centrals, allies)) = self.skill.fighter {
            match team {
                Team::Centrals => centrals,
                Team::Allies => allies,
            }
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
                keys.space = self.should_bail(world, team, plane);
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

        let rounds = is_rounds(world);
        let has_bombs = plane.get_bombs() > 0;
        let bomb_player = if has_bombs {
            self.ground_bomb_target(world, team, x)
                .map(Goal::BombTarget)
        } else {
            None
        };
        let bomb_structure = if has_bombs {
            self.enemy_structure(world, team, x)
                .map(|(tx, ty, half)| Goal::Bomb(tx, ty, half))
        } else {
            None
        };

        if rounds {
            let vision = self.skill.vision * ROUNDS_VISION_FACTOR;
            if plane.get_ammo() > 0 {
                if let Some(id) = self.choose_enemy_plane(world, team, plane, vision) {
                    return Goal::Attack(Target::Plane(id));
                }
            }
            if let Some(goal) = bomb_player {
                return goal;
            }
            if let Some(goal) = self.combat_goal(world, team, x, y, plane, vision) {
                return goal;
            }
            if let Some(goal) = bomb_structure {
                return goal;
            }
        } else {
            let bomb_goals = if self.skill.prefer_player_bombs {
                [bomb_player, bomb_structure]
            } else {
                [bomb_structure, bomb_player]
            };
            if let Some(goal) = bomb_goals.into_iter().flatten().next() {
                return goal;
            }
            if let Some(goal) = self.combat_goal(world, team, x, y, plane, self.skill.vision) {
                return goal;
            }
        }

        let patrol_x = match self.goal {
            Goal::Patrol(px, _) if (px - x).abs() > 150.0 => px,
            _ => {
                let enemy_plane_x = if rounds {
                    self.nearest_enemy_plane(world, team, x, y, f64::INFINITY)
                        .and_then(|(id, _)| world.planes.get(id))
                        .map(|p| plane_pos(p).0)
                } else {
                    None
                };
                match enemy_plane_x {
                    Some(px) => px + self.rng.range(-200.0, 200.0),
                    None => {
                        let base = self
                            .enemy_structure(world, team, x)
                            .map(|s| s.0)
                            .unwrap_or(0.0);
                        base + self.rng.range(-600.0, 600.0)
                    }
                }
            }
        };
        Goal::Patrol(patrol_x, CRUISE_Y + self.rng.range(-80.0, 80.0))
    }

    fn ground_bomb_target(&self, world: &World, team: Team, x: f64) -> Option<Target> {
        let on_ground = |target: Target| match target {
            Target::Man(id) => world.men.get(id).is_some_and(|m| {
                matches!(
                    m.get_state(),
                    ManState::Standing | ManState::WalkingLeft | ManState::WalkingRight
                )
            }),
            Target::Plane(id) => world.planes.get(id).is_some_and(|p| {
                matches!(
                    p.get_mode(),
                    PlaneMode::Landing | PlaneMode::Landed | PlaneMode::TakingOff
                )
            }),
        };
        if let Goal::BombTarget(current) = self.goal {
            if on_ground(current) {
                return Some(current);
            }
        }

        let range = if is_rounds(world) {
            self.skill.bomb_player_range * ROUNDS_VISION_FACTOR
        } else {
            self.skill.bomb_player_range
        };
        let men = world
            .men
            .get_map()
            .iter()
            .filter(|(_, m)| {
                m.get_team() != team
                    && matches!(
                        m.get_state(),
                        ManState::Standing | ManState::WalkingLeft | ManState::WalkingRight
                    )
            })
            .map(|(id, m)| (Target::Man(*id), man_pos(m).0));
        let planes = world
            .planes
            .get_map()
            .iter()
            .filter(|(_, p)| {
                p.get_team() != team
                    && matches!(
                        p.get_mode(),
                        PlaneMode::Landing | PlaneMode::Landed | PlaneMode::TakingOff
                    )
            })
            .map(|(id, p)| (Target::Plane(*id), plane_pos(p).0));
        men.chain(planes)
            .map(|(target, tx)| (target, (tx - x).abs()))
            .filter(|(_, d)| *d < range)
            .min_by(|a, b| a.1.total_cmp(&b.1))
            .map(|(target, _)| target)
    }

    fn bomb_run(
        &self,
        plane: &Plane,
        keys: &mut PlayerKeyboard,
        h: f64,
        aim_x: f64,
        ty: f64,
        half: f64,
    ) -> f64 {
        let (x, y) = plane_pos(plane);
        let (impact, _) = self.predict_bomb(plane, ty);
        if (impact - aim_x).abs() < half && plane.get_bombs() > 0 {
            keys.shift = true;
        }
        let dx = aim_x - x;
        let toward = if dx.abs() < 40.0 { h } else { dx.signum() };
        positive(
            (self.skill.bomb_y - y)
                .clamp(-120.0, 120.0)
                .atan2(toward * 300.0),
        )
    }

    fn hunts_men(&self, world: &World) -> bool {
        self.skill.hunt_men || is_rounds(world)
    }

    fn nearest_enemy_plane(
        &self,
        world: &World,
        team: Team,
        x: f64,
        y: f64,
        range: f64,
    ) -> Option<(PlaneId, f64)> {
        world
            .planes
            .get_map()
            .iter()
            .filter(|(_, p)| p.get_team() != team && p.get_mode() != PlaneMode::Falling)
            .map(|(id, p)| {
                let (px, py) = plane_pos(p);
                (*id, ((px - x).powi(2) + (py - y).powi(2)).sqrt())
            })
            .filter(|(_, d)| *d < range)
            .min_by(|a, b| a.1.total_cmp(&b.1))
    }

    fn choose_enemy_plane(
        &self,
        world: &World,
        team: Team,
        plane: &Plane,
        range: f64,
    ) -> Option<PlaneId> {
        if self.skill.tactics {
            return self.pick_enemy_plane(world, team, plane, range);
        }
        let (x, y) = plane_pos(plane);
        self.nearest_enemy_plane(world, team, x, y, range)
            .map(|(id, _)| id)
    }

    fn combat_goal(
        &self,
        world: &World,
        team: Team,
        x: f64,
        y: f64,
        plane: &Plane,
        vision: f64,
    ) -> Option<Goal> {
        if plane.get_ammo() <= 0 {
            return None;
        }

        if let Some(id) = self.choose_enemy_plane(world, team, plane, vision) {
            return Some(Goal::Attack(Target::Plane(id)));
        }

        if self.hunts_men(world) {
            let enemy_man = world
                .men
                .get_map()
                .iter()
                .filter(|(_, m)| m.get_team() != team)
                .map(|(id, m)| {
                    let (mx, my) = man_pos(m);
                    (*id, ((mx - x).powi(2) + (my - y).powi(2)).sqrt())
                })
                .filter(|(_, d)| *d < vision * 0.6)
                .min_by(|a, b| a.1.total_cmp(&b.1));
            if let Some((id, _)) = enemy_man {
                return Some(Goal::Attack(Target::Man(id)));
            }
        }

        None
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
                let (vx, vy) = match m.get_state() {
                    ManState::Parachuting => (0.0, 1.0),
                    ManState::Falling => (0.0, 2.0),
                    ManState::WalkingLeft => (-1.0, 0.0),
                    ManState::WalkingRight => (1.0, 0.0),
                    ManState::Standing => (0.0, 0.0),
                };
                (x, y, vx, vy)
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
        if self.skill.tactics && self.tactical_fire(world, team, plane) {
            return true;
        }
        let angle = plane.get_angle();
        let mut targets: Vec<(f64, f64, f64, f64)> = world
            .planes
            .get_map()
            .values()
            .filter(|p| {
                !self.skill.tactics && p.get_team() != team && p.get_mode() != PlaneMode::Falling
            })
            .map(|p| {
                let (x, y) = plane_pos(p);
                let (vx, vy) = velocity(p.get_angle(), p.get_speed());
                (x, y, vx, vy)
            })
            .collect();
        if self.hunts_men(world) {
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

    fn predict_bomb(&self, plane: &Plane, target_y: f64) -> (f64, f64) {
        let (mut x, mut y) = plane_pos(plane);
        let angle = plane.get_angle();
        let mut vx = angle.cos() * plane.get_speed() / 100.0;
        let mut vy = angle.sin() * plane.get_speed() / 100.0;
        let mut ticks = 0.0;
        for _ in 0..600 {
            if y >= target_y {
                break;
            }
            x += vx;
            y += vy;
            vx -= vx * 0.01;
            vy += 0.0333;
            ticks += 1.0;
        }
        (x, ticks)
    }

    fn pilot(&mut self, world: &World, team: Team, plane: &Plane) -> PlayerKeyboard {
        let mut keys = PlayerKeyboard::new();
        let (x, y) = plane_pos(plane);
        let angle = plane.get_angle();
        let speed = plane.get_speed();
        let (vx, vy) = velocity(angle, speed);
        let h = if angle.cos() >= 0.0 { 1.0 } else { -1.0 };

        if self.skill.tactics {
            self.update_tracks(world, team);
        }

        if self.think_timer == 0 {
            self.think_timer = self.skill.think_interval;
            self.goal = self.choose_goal(world, team, plane);
            self.aim_offset = self.rng.range(-self.skill.aim_noise, self.skill.aim_noise);
            self.bomb_offset = self
                .rng
                .range(-self.skill.bomb_noise, self.skill.bomb_noise);
        } else {
            self.think_timer = self.think_timer.saturating_sub(self.skill.control_interval);
        }

        self.evade_cooldown = self
            .evade_cooldown
            .saturating_sub(self.skill.control_interval);
        if self.skill.evade
            && !self.skill.tactics
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
                    let (aim, distance) = match target {
                        Target::Plane(id) if self.skill.tactics => world
                            .planes
                            .get(id)
                            .map(|p| self.tracked_aim(plane, id, p))
                            .unwrap_or_else(|| self.aim_at(plane, tx, ty, tvx, tvy)),
                        _ => self.aim_at(plane, tx, ty, tvx, tvy),
                    };
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
            Goal::Bomb(tx, ty, half) => self.bomb_run(plane, &mut keys, h, tx, ty, half),
            Goal::BombTarget(target) => match self.target_state(world, target) {
                Some((tx, ty, tvx, _)) => {
                    let (_, fall_ticks) = self.predict_bomb(plane, ty);
                    let aim_x = tx + tvx * fall_ticks * self.skill.bomb_lead + self.bomb_offset;
                    self.bomb_run(plane, &mut keys, h, aim_x, ty, self.skill.bomb_window)
                }
                None => {
                    self.think_timer = 0;
                    heading(h, 0.0)
                }
            },
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

    fn height_above_ground(&self, x: f64, bottom: f64) -> f64 {
        self.terrain
            .as_ref()
            .map(|t| t.surface(x - 20.0, x + 20.0) - bottom)
            .unwrap_or(0.0)
    }

    fn own_wreck_impact(&self, world: &World) -> Option<f64> {
        let terrain = self.terrain.as_ref()?;
        let (me, _) = world.get_player_from_guid(&self.request.guid)?;
        world
            .planes
            .get_map()
            .values()
            .filter(|p| p.player_id() == *me && p.get_mode() == PlaneMode::Falling)
            .map(|p| {
                let (px, py) = plane_pos(p);
                let (vx, vy) = velocity(p.get_angle(), p.get_speed());
                let height = terrain.surface(px - 30.0, px + 30.0) - py;
                px + vx * (height / vy.max(0.5)).min(400.0)
            })
            .next()
    }

    fn should_bail(&mut self, world: &World, team: Team, plane: &Plane) -> bool {
        let Some(terrain) = self.terrain.as_ref() else {
            return true;
        };
        let (x, y) = plane_pos(plane);
        let (vx, vy) = velocity(plane.get_angle(), plane.get_speed());
        let height = terrain.surface(x - 30.0, x + 30.0) - y;
        let ahead_x = x + vx * 25.0;
        let ahead_height =
            terrain.surface(x.min(ahead_x) - 30.0, x.max(ahead_x) + 30.0) - (y + vy * 25.0);
        let ticks_to_impact = if vy > 0.05 {
            height / vy
        } else {
            f64::INFINITY
        };
        if height < 140.0 || ahead_height < 90.0 || ticks_to_impact < 45.0 {
            return true;
        }

        let wait = match self.bail_wait {
            Some(wait) => wait,
            None => {
                let (low, high) = self.skill.bail_reaction;
                self.rng.range_u32(low, high)
            }
        };
        if wait > 0 {
            self.bail_wait = Some(wait - 1);
            return false;
        }
        self.bail_wait = Some(0);

        if self.bail_hold < self.skill.bail_hold && incoming_fire(world, team, x, y, 80.0) {
            self.bail_hold += 1;
            return false;
        }

        let reach = (height - 40.0).max(0.0) * 0.8;
        if safe_landing(world, team, terrain, x, reach).is_some() {
            return true;
        }

        let Some(sx) = safe_landing(world, team, terrain, x, 4000.0) else {
            return true;
        };
        if (sx - x).signum() != vx.signum() {
            return true;
        }
        let ride_ticks = (height - 110.0).max(0.0) / (vy.max(0.0) + 0.6);
        let ride_reach = vx.abs() * ride_ticks + 55.0;
        ride_reach <= reach
    }

    fn should_open_chute(&mut self, world: &World, team: Team, man: &Man, x: f64, y: f64) -> bool {
        let height = self.height_above_ground(x, y + 17.0);
        let mut speed = man.get_y_speed() + 100 / 30;
        let mut braking = speed as f64 / 100.0;
        while speed >= 150 {
            speed = ((speed as f64 * 0.95) as i32).max(100);
            braking += speed as f64 / 100.0;
        }
        if height <= braking + 30.0 {
            return true;
        }

        let own_wreck_close = world
            .get_player_from_guid(&self.request.guid)
            .map(|(me, _)| {
                world.planes.get_map().values().any(|p| {
                    let (px, py) = plane_pos(p);
                    p.player_id() == *me
                        && p.get_mode() == PlaneMode::Falling
                        && (px - x).abs() < 160.0
                        && py > y - 60.0
                })
            })
            .unwrap_or(false);
        if own_wreck_close {
            return true;
        }

        let wait = match self.chute_wait {
            Some(wait) => wait,
            None => {
                let (low, high) = self.skill.chute_reaction;
                self.rng.range_u32(low, high)
            }
        };
        if wait > 0 {
            self.chute_wait = Some(wait - 1);
            return false;
        }
        self.chute_wait = Some(0);

        let needs_steering = self
            .terrain
            .as_ref()
            .map(|t| safe_landing(world, team, t, x, 0.0).is_none())
            .unwrap_or(false);
        if incoming_fire(world, team, x, y, height.min(160.0)) {
            return false;
        }
        needs_steering || !(self.skill.evade && enemy_plane_within(world, team, x, y, 400.0))
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
                keys.space = self.should_open_chute(world, team, man, x, y);
            }
            ManState::Parachuting => {
                let height = self.height_above_ground(x, y + 17.0);
                let goal = match self.own_wreck_impact(world) {
                    Some(impact_x) if (impact_x - x).abs() < 110.0 => {
                        Some(x + (x - impact_x).signum() * 200.0)
                    }
                    _ => match home {
                        Some(hx) if (hx - x).abs() <= height => Some(hx),
                        _ => self
                            .terrain
                            .as_ref()
                            .and_then(|t| safe_landing(world, team, t, x, height.max(3000.0)))
                            .or(home),
                    },
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
