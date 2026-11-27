use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

use crate::{
    bots::{AddBotRequest, BotDifficulty, BotManager},
    entities::{player::PlayerGuid, types::Team, world_info::GameMode},
    network::encoding::NetworkedBytes,
    replay::{events::get_replay_summary, file::ReplayFile},
    rules::GameRules,
    world::World,
};

const CLASSIC: &str = r#"classic
layer1=...H.....H.....H.....H.....H.....H.....H.....H...
layer2=...R.........................................l...
layer3=........R...............................l........
layer4=...F....T...............................t....f...
layer5=\<#############################################>/
designer=polofel"#;

const ISLANDS: &str = "islands\nlayer1=..FH...........H...........fH.\nlayer2=...R......................l...\nlayer3=....T....................t....\nlayer4=\\<###>//////////////////<###>/\ndesigner=polofel";

const CHECKPOINT_EVERY: u32 = 250;
const THOROUGH: bool = !cfg!(debug_assertions);

struct Scenario {
    name: String,
    rules_json: String,
    level: &'static str,
    mode: GameMode,
    game_time_minutes: u16,
    ticks: u32,
}

struct LiveRun {
    world: World,
    checkpoints: Vec<(u32, u64)>,
}

fn hash_state(world: &World) -> u64 {
    let mut hasher = DefaultHasher::new();
    world.get_full_state().to_bytes().hash(&mut hasher);
    hasher.finish()
}

fn new_world(level: &str, mode: GameMode, game_time_minutes: u16) -> World {
    let mut world = World::new();
    world.load_level(level);
    world.set_round_settings(game_time_minutes, 3);
    world.set_game_mode(mode);
    world
}

fn new_bots() -> BotManager {
    let mut bots = BotManager::new();
    let setups = [
        ("c1", Some(Team::Centrals), BotDifficulty::Ace),
        ("c2", Some(Team::Centrals), BotDifficulty::Hard),
        ("c3", Some(Team::Centrals), BotDifficulty::Easy),
        ("a1", Some(Team::Allies), BotDifficulty::Ace),
        ("a2", Some(Team::Allies), BotDifficulty::Medium),
        ("r1", None, BotDifficulty::Hard),
    ];
    for (guid, team, difficulty) in setups {
        bots.add_bot(AddBotRequest {
            guid: PlayerGuid::from(guid),
            name: guid.to_string(),
            team,
            difficulty,
        });
    }
    bots
}

fn play(world: &mut World, bots: &mut BotManager, ticks: u32, checkpoints: &mut Vec<(u32, u64)>) {
    for _ in 0..ticks {
        let input = bots.tick(world);
        world.tick(input);
        if world.get_tick() % 2 == 0 {
            world.flush_changed_state();
        }
        if world.get_tick() % CHECKPOINT_EVERY == 0 {
            checkpoints.push((world.get_tick(), hash_state(world)));
        }
    }
}

fn play_live(scenario: &Scenario) -> LiveRun {
    let mut world = new_world(scenario.level, scenario.mode, scenario.game_time_minutes);
    world.set_rules(GameRules::from_json(&scenario.rules_json).expect("rules json"));
    let mut bots = new_bots();
    let mut checkpoints = vec![];
    play(&mut world, &mut bots, scenario.ticks, &mut checkpoints);
    LiveRun { world, checkpoints }
}

fn replay_world(replay: &ReplayFile) -> World {
    let mut world = World::new();
    world.load_level(&replay.level_data);
    world.set_round_settings(replay.game_time_minutes, replay.intermission_seconds);
    world.set_game_mode(replay.game_mode);
    world.set_rules(replay.rules);
    world
}

fn assert_replay_matches(name: &str, live: &LiveRun) {
    let bytes = live.world.get_replay_file_bytes();
    let (rest, replay) = ReplayFile::from_bytes(&bytes).expect("replay decodes");
    assert!(rest.is_empty(), "{name}: trailing replay bytes");
    assert_eq!(
        replay.rules, live.world.rules,
        "{name}: rules differ after replay round trip"
    );
    assert_eq!(
        replay.to_bytes(),
        bytes,
        "{name}: replay file is not byte stable"
    );

    let mut stepped = replay_world(&replay);
    for (tick, expected) in &live.checkpoints {
        stepped.simulate_until(&replay, Some(*tick), true);
        assert_eq!(
            hash_state(&stepped),
            *expected,
            "{name}: replay (with flushing) diverged from the live game by tick {tick}"
        );
    }

    let end = live.world.get_tick();
    for flush in [true, false] {
        let mut whole = replay_world(&replay);
        whole.simulate_until(&replay, Some(end), flush);
        assert_eq!(
            whole.get_tick(),
            end,
            "{name}: replay ended at the wrong tick"
        );
        assert_eq!(
            whole.get_full_state().to_bytes(),
            live.world.get_full_state().to_bytes(),
            "{name}: final replay state differs from the live game (flush={flush})"
        );
    }

    assert!(
        !get_replay_summary(bytes).is_empty(),
        "{name}: replay summary failed"
    );
}

fn check_scenario(scenario: &Scenario) {
    let first = play_live(scenario);
    let second = play_live(scenario);
    assert_eq!(
        first.checkpoints, second.checkpoints,
        "{}: two identical live games diverged",
        scenario.name
    );
    assert!(
        first.world.players.get_map().len() >= 6,
        "{}: bots did not join",
        scenario.name
    );
    assert_replay_matches(&scenario.name, &first);
}

fn rules_with(edit: impl FnOnce(&mut GameRules)) -> String {
    let mut rules = GameRules::default();
    edit(&mut rules);
    serde_json::to_string(&rules).unwrap()
}

fn handpicked() -> Vec<(&'static str, String)> {
    vec![
        ("original", rules_with(|_| {})),
        (
            "no guns, unlimited bombs",
            rules_with(|r| {
                r.plane_guns = false;
                r.pilot_guns = false;
                r.unlimited_bombs = true;
                for p in [&mut r.planes.albatros, &mut r.planes.fokker, &mut r.planes.sopwith] {
                    p.bombs = 10;
                }
            }),
        ),
        (
            "no bombs, unlimited ammo and fuel",
            rules_with(|r| {
                r.bombs = false;
                r.unlimited_ammo = true;
                r.unlimited_fuel = true;
            }),
        ),
        (
            "no friendly fire, no collisions, no bail out",
            rules_with(|r| {
                r.friendly_fire = false;
                r.plane_collisions = false;
                r.bail_out = false;
            }),
        ),
        (
            "zero damage everywhere",
            rules_with(|r| {
                r.bullet_plane_damage = 0;
                r.bullet_runway_damage = 0;
                r.bullet_headquarters_damage = 0;
                r.bomb_building_damage = 0;
                r.explosion_plane_damage = 0;
                r.explosion_building_damage = 0;
                r.collision_damage = 0;
                r.crash_runway_damage = 0;
            }),
        ),
        (
            "maximum damage, fragile buildings",
            rules_with(|r| {
                r.bullet_plane_damage = 10_000;
                r.bullet_runway_damage = 500;
                r.bullet_headquarters_damage = 500;
                r.bomb_building_damage = 10_000;
                r.explosion_plane_damage = 10_000;
                r.explosion_building_damage = 10_000;
                r.collision_damage = 10_000;
                r.crash_runway_damage = 10_000;
                r.runway_health = 1;
                r.headquarters_health = 1;
                r.repair_ticks = 0;
            }),
        ),
        (
            "indestructible buildings, instant repair",
            rules_with(|r| {
                r.indestructible_buildings = true;
                r.repair_ticks = 1;
            }),
        ),
        (
            "only one plane per team",
            rules_with(|r| {
                r.planes.albatros.allowed = false;
                r.planes.junkers.allowed = false;
                r.planes.bristol.allowed = false;
                r.planes.sopwith.allowed = false;
            }),
        ),
        (
            "extreme plane tuning",
            rules_with(|r| {
                r.planes.fokker.turn_step = 0.3;
                r.planes.fokker.acceleration = 20.0;
                r.planes.fokker.health = 1;
                r.planes.junkers.turn_step = 0.005;
                r.planes.junkers.acceleration = 0.5;
                r.planes.junkers.bombs = 50;
                r.planes.junkers.bomb_delay_ms = 50;
                r.planes.bristol.shoot_delay_ms = 10;
                r.planes.bristol.ammo = 999;
                r.planes.salmson.fuel = 1;
                r.planes.sopwith.speed_bonus = 200;
                r.planes.albatros.ammo = 1;
            }),
        ),
        (
            "instant respawn, no runway delays, no spawn protection",
            rules_with(|r| {
                r.respawn_ticks = 0;
                r.suicide_respawn_ticks = 0;
                r.team_kill_respawn_ticks = 0;
                r.takeoff_after_takeoff_ms = 0;
                r.takeoff_after_landing_ms = 0;
                r.landing_after_landing_ms = 0;
                r.landing_after_takeoff_ms = 0;
                r.pilot_invulnerability_ms = 0;
                r.pilot_shoot_delay_ms = 100;
            }),
        ),
        (
            "slow respawn, long runway delays",
            rules_with(|r| {
                r.respawn_ticks = 6000;
                r.suicide_respawn_ticks = 6000;
                r.team_kill_respawn_ticks = 6000;
                r.takeoff_after_takeoff_ms = 10_000;
                r.takeoff_after_landing_ms = 10_000;
                r.pilot_shoot_delay_ms = 5000;
            }),
        ),
        (
            "floats as the browser sends them",
            r#"{"planes":{"fokker":{"turn_step":0.12131889481511933,"acceleration":6.25},"albatros":{"turn_step":0.055618067930058836},"bristol":{"turn_step":0.06108652381980153,"acceleration":4.850000000000001},"sopwith":{"acceleration":5.123456789012345}}}"#
                .to_string(),
        ),
        (
            "out of range values get clamped",
            r#"{"bullet_plane_damage":65535,"runway_health":0,"repair_ticks":65535,"respawn_ticks":65535,"planes":{"fokker":{"turn_step":9.0,"acceleration":-4.0,"health":0,"ammo":0,"fuel":0,"shoot_delay_ms":0}}}"#
                .to_string(),
        ),
        (
            "partial json from an older preset",
            r#"{"bombs":false,"damage_percent":250,"planes":{"junkers":{"turn_percent":150,"ammo":7}}}"#
                .to_string(),
        ),
    ]
}

struct Rng(u64);

impl Rng {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }

    fn bool(&mut self, chance_true: f64) -> bool {
        self.unit() < chance_true
    }

    fn unit(&mut self) -> f64 {
        (self.next() >> 11) as f64 / (1u64 << 53) as f64
    }

    fn range(&mut self, min: u16, max: u16) -> u16 {
        min + (self.next() % (max as u64 - min as u64 + 1)) as u16
    }

    fn float(&mut self, min: f64, max: f64) -> f64 {
        min + self.unit() * (max - min)
    }
}

fn random_rules(rng: &mut Rng) -> String {
    let mut r = GameRules::default();
    r.plane_guns = rng.bool(0.85);
    r.bombs = rng.bool(0.8);
    r.pilot_guns = rng.bool(0.8);
    r.bail_out = rng.bool(0.8);
    r.friendly_fire = rng.bool(0.6);
    r.plane_collisions = rng.bool(0.7);
    r.unlimited_ammo = rng.bool(0.3);
    r.unlimited_fuel = rng.bool(0.3);
    r.unlimited_bombs = rng.bool(0.3);
    r.indestructible_buildings = rng.bool(0.2);
    r.bullet_plane_damage = rng.range(0, 200);
    r.bullet_runway_damage = rng.range(0, 40);
    r.bullet_headquarters_damage = rng.range(0, 40);
    r.bomb_building_damage = rng.range(0, 300);
    r.explosion_plane_damage = rng.range(0, 300);
    r.explosion_building_damage = rng.range(0, 200);
    r.collision_damage = rng.range(0, 200);
    r.crash_runway_damage = rng.range(0, 200);
    r.runway_health = rng.range(1, 4000);
    r.headquarters_health = rng.range(1, 2000);
    r.repair_ticks = rng.range(0, 200);
    r.takeoff_after_takeoff_ms = rng.range(0, 4000);
    r.takeoff_after_landing_ms = rng.range(0, 4000);
    r.landing_after_landing_ms = rng.range(0, 4000);
    r.landing_after_takeoff_ms = rng.range(0, 4000);
    r.respawn_ticks = rng.range(0, 1500);
    r.suicide_respawn_ticks = rng.range(0, 1500);
    r.team_kill_respawn_ticks = rng.range(0, 1500);
    r.pilot_invulnerability_ms = rng.range(0, 2000);
    r.pilot_shoot_delay_ms = rng.range(100, 2000);
    for plane in [
        &mut r.planes.albatros,
        &mut r.planes.junkers,
        &mut r.planes.fokker,
        &mut r.planes.bristol,
        &mut r.planes.salmson,
        &mut r.planes.sopwith,
    ] {
        plane.allowed = rng.bool(0.75);
        plane.health = rng.range(1, 600);
        plane.ammo = rng.range(1, 400);
        plane.fuel = rng.range(1, 400);
        plane.bombs = rng.range(0, 20) as u8;
        plane.shoot_delay_ms = rng.range(10, 500);
        plane.bomb_delay_ms = rng.range(50, 2000);
        plane.acceleration = rng.float(0.5, 20.0);
        plane.turn_step = rng.float(0.005, 0.3);
        plane.speed_bonus = rng.range(0, 200);
    }
    serde_json::to_string(&r).unwrap()
}

fn scenario(name: String, rules_json: String, index: usize) -> Scenario {
    let rounds = index % 2 == 1;
    Scenario {
        name,
        rules_json,
        level: if index % 3 == 2 { ISLANDS } else { CLASSIC },
        mode: if rounds {
            GameMode::Rounds
        } else {
            GameMode::Normal
        },
        game_time_minutes: if rounds { 1 } else { 0 },
        ticks: match (THOROUGH, rounds) {
            (true, true) => 7_500,
            (true, false) => 4_000,
            (false, true) => 1_200,
            (false, false) => 800,
        },
    }
}

#[test]
fn json_rules_round_trip_exactly() {
    let mut rng = Rng(0x2545F4914F6CDD1D);
    for _ in 0..2_000 {
        let json = random_rules(&mut rng);
        let rules = GameRules::from_json(&json).unwrap();
        let again = GameRules::from_json(&rules.to_json()).unwrap();
        assert_eq!(
            rules, again,
            "rules changed after a JSON round trip: {json}"
        );
    }
}

#[test]
fn rule_floats_from_the_browser_are_parsed_exactly() {
    let samples: [f64; 10] = [
        0.12131889481511933,
        0.055618067930058836,
        0.013439035240356337,
        0.031415926535897934,
        0.028559933214452663,
        0.0483321946706122,
        0.036110260386089575,
        0.04487989505128276,
        4.85,
        4.65,
    ];
    for value in samples {
        let field = if value <= 0.3 {
            "turn_step"
        } else {
            "acceleration"
        };
        let json = format!(r#"{{"planes":{{"fokker":{{"{field}":{value}}}}}}}"#);
        let rules = GameRules::from_json(&json).unwrap();
        let parsed = if value <= 0.3 {
            rules.planes.fokker.turn_step
        } else {
            rules.planes.fokker.acceleration
        };
        assert_eq!(parsed.to_bits(), value.to_bits(), "{json}");
    }

    let mut rng = Rng(0xD1B54A32D192ED03);
    for _ in 0..200_000 {
        let value = rng.float(0.005, 0.3);
        let parsed: f64 = serde_json::from_str(&format!("{value}")).unwrap();
        assert_eq!(
            parsed.to_bits(),
            value.to_bits(),
            "{value} did not parse back exactly"
        );
    }
}

#[test]
fn original_rules_survive_the_browser_round_trip() {
    let defaults = GameRules::default();
    let from_browser = GameRules::from_json(&defaults.to_json()).unwrap();
    assert_eq!(from_browser, defaults);
    for plane in [
        crate::entities::plane::PlaneType::Albatros,
        crate::entities::plane::PlaneType::Junkers,
        crate::entities::plane::PlaneType::Fokker,
        crate::entities::plane::PlaneType::Bristol,
        crate::entities::plane::PlaneType::Salmson,
        crate::entities::plane::PlaneType::Sopwith,
    ] {
        assert_eq!(
            from_browser.plane(plane).turn_step.to_bits(),
            defaults.plane(plane).turn_step.to_bits()
        );
    }
}

fn check_handpicked(index: usize) {
    let (name, json) = handpicked().swap_remove(index);
    check_scenario(&scenario(name.to_string(), json, index));
}

macro_rules! handpicked_tests {
    ($($test:ident => $index:expr),* $(,)?) => {
        $(
            #[test]
            fn $test() {
                check_handpicked($index);
            }
        )*
    };
}

handpicked_tests! {
    custom_rules_replay_exactly_original => 0,
    custom_rules_replay_exactly_no_guns => 1,
    custom_rules_replay_exactly_no_bombs => 2,
    custom_rules_replay_exactly_no_friendly_fire => 3,
    custom_rules_replay_exactly_zero_damage => 4,
    custom_rules_replay_exactly_maximum_damage => 5,
    custom_rules_replay_exactly_indestructible_buildings => 6,
    custom_rules_replay_exactly_one_plane_per_team => 7,
    custom_rules_replay_exactly_extreme_plane_tuning => 8,
    custom_rules_replay_exactly_instant_respawn => 9,
    custom_rules_replay_exactly_slow_respawn => 10,
    custom_rules_replay_exactly_browser_floats => 11,
    custom_rules_replay_exactly_clamped_values => 12,
    custom_rules_replay_exactly_older_preset_json => 13,
}

#[test]
fn handpicked_scenarios_are_all_covered() {
    assert_eq!(handpicked().len(), 14);
}

#[test]
fn random_custom_rules_are_deterministic_and_replay_exactly() {
    let mut rng = Rng(0x9E3779B97F4A7C15);
    for index in 0..if THOROUGH { 16 } else { 3 } {
        let json = random_rules(&mut rng);
        check_scenario(&scenario(format!("random #{index}: {json}"), json, index));
    }
}

#[test]
fn restarting_with_different_rules_replays_exactly() {
    let first_rules = GameRules::from_json(&random_rules(&mut Rng(42))).unwrap();
    let second_rules = GameRules::from_json(&random_rules(&mut Rng(4242))).unwrap();

    let run = || {
        let mut world = new_world(CLASSIC, GameMode::Normal, 0);
        world.set_rules(first_rules);
        let mut bots = new_bots();
        let mut ignored = vec![];
        play(
            &mut world,
            &mut bots,
            if THOROUGH { 2_000 } else { 600 },
            &mut ignored,
        );

        let (mut next, rejoin) = world.restarted(ISLANDS, GameMode::Rounds, 1, 3, second_rules);
        bots.reset();
        next.tick(rejoin);
        let mut checkpoints = vec![];
        play(
            &mut next,
            &mut bots,
            if THOROUGH { 4_000 } else { 1_200 },
            &mut checkpoints,
        );
        LiveRun {
            world: next,
            checkpoints,
        }
    };

    let first = run();
    let second = run();
    assert_eq!(
        first.checkpoints, second.checkpoints,
        "restarted games diverged"
    );
    assert_eq!(first.world.rules, second_rules.sanitized());
    assert_replay_matches("restart with new rules", &first);
}
