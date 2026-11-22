use std::collections::HashMap;

use crate::{
    entities::{
        plane::PlaneType,
        player::{ControllingEntity, PlayerGuid},
        types::Team,
        world_info::GameMode,
    },
    network::encoding::NetworkedBytes,
    replay::file::ReplayFile,
    world::World,
};

use super::{AddBotRequest, BotDifficulty, BotManager};

fn level(name: &str) -> String {
    let levels: HashMap<String, String> =
        serde_json::from_str(include_str!("../../../client/src/assets/levels.json")).unwrap();
    levels.get(name).unwrap().clone()
}

fn guid(s: &str) -> PlayerGuid {
    s.into()
}

#[derive(Default, Debug)]
struct Stats {
    takeoffs: u32,
    landings: u32,
    kills: i32,
    deaths: u32,
}

fn simulate(
    level_name: &str,
    bots: &[(Option<Team>, BotDifficulty)],
    ticks: u32,
    force_land: bool,
) -> (World, HashMap<String, Stats>) {
    simulate_mode(level_name, bots, ticks, force_land, GameMode::Normal)
}

fn simulate_mode(
    level_name: &str,
    bots: &[(Option<Team>, BotDifficulty)],
    ticks: u32,
    force_land: bool,
    game_mode: GameMode,
) -> (World, HashMap<String, Stats>) {
    let mut world = World::new();
    world.load_level(&level(level_name));
    world.set_round_settings(0, 20);
    world.set_game_mode(game_mode);
    let mut manager = BotManager::new();
    for (i, (team, difficulty)) in bots.iter().enumerate() {
        manager.add_bot(AddBotRequest {
            guid: guid(&format!("bot{i}")),
            name: format!("Bot {i}"),
            team: *team,
            difficulty: *difficulty,
        });
    }
    for bot in manager.bots.iter_mut() {
        bot.force_land = force_land;
    }

    let mut stats: HashMap<String, Stats> = HashMap::new();
    let mut previous: HashMap<String, Option<ControllingEntity>> = HashMap::new();

    for _ in 0..ticks {
        let input = manager.tick(&world);
        world.tick(input);
        world.flush_changed_state();

        for player in world.players.get_map().values() {
            let name = player.get_name();
            let now = player.get_controlling();
            let before = previous.get(&name).cloned().flatten();
            let entry = stats.entry(name.clone()).or_default();
            match (before, now) {
                (Some(ControllingEntity::Plane(_)), Some(ControllingEntity::Runway(_, _))) => {
                    entry.landings += 1
                }
                (b, Some(ControllingEntity::Plane(_)))
                    if !matches!(b, Some(ControllingEntity::Plane(_))) =>
                {
                    entry.takeoffs += 1
                }
                _ => {}
            }
            entry.kills = player.get_kills() as i32;
            entry.deaths = player.get_deaths() as u32;
            previous.insert(name, now);
        }
    }

    (world, stats)
}

#[test]
fn bots_join_teams_and_take_off() {
    let bots = [
        (Some(Team::Centrals), BotDifficulty::Medium),
        (Some(Team::Centrals), BotDifficulty::Hard),
        (Some(Team::Centrals), BotDifficulty::Easy),
    ];
    let (world, stats) = simulate("classic", &bots, 3000, false);
    for player in world.players.get_map().values() {
        assert_eq!(*player.get_team(), Some(Team::Centrals));
        assert!(player.is_bot());
    }
    for (name, s) in &stats {
        println!("{name}: {s:?}");
        assert!(s.takeoffs >= 1, "{name} never took off");
    }
}

#[test]
fn bots_survive_flying_alone() {
    for difficulty in [
        BotDifficulty::Easy,
        BotDifficulty::Medium,
        BotDifficulty::Hard,
        BotDifficulty::Ace,
    ] {
        for level_name in [
            "classic", "islands", "katala", "london", "huge", "base", "divided", "long", "desert",
            "bunkers", "sahara", "jungle", "berlin", "africa", "classic2",
        ] {
            let (_, stats) = simulate(level_name, &[(Some(Team::Allies), difficulty)], 6000, false);
            let s = stats.values().next().unwrap();
            println!("{level_name} {difficulty:?}: {s:?}");
            assert!(
                s.deaths == 0,
                "{level_name} {difficulty:?} crashed {} times",
                s.deaths
            );
        }
    }
}

#[test]
fn bots_can_land() {
    for level_name in [
        "classic", "islands", "katala", "london", "huge", "base", "divided", "long", "desert",
        "bunkers", "sahara", "jungle", "berlin", "africa", "classic2",
    ] {
        for team in [Team::Centrals, Team::Allies] {
            let (_, stats) = simulate(level_name, &[(Some(team), BotDifficulty::Hard)], 8000, true);
            let s = stats.values().next().unwrap();
            println!("{level_name} {team:?}: {s:?}");
            assert!(s.landings >= 1, "{level_name} {team:?} never landed");
        }
    }
}

#[test]
fn bots_fight_each_other() {
    let bots = [
        (Some(Team::Centrals), BotDifficulty::Ace),
        (Some(Team::Centrals), BotDifficulty::Hard),
        (Some(Team::Allies), BotDifficulty::Easy),
        (Some(Team::Allies), BotDifficulty::Medium),
    ];
    let (world, stats) = simulate("classic", &bots, 20000, false);
    let mut total_kills = 0;
    for (name, s) in &stats {
        println!("{name}: {s:?}");
        total_kills += s.kills;
    }
    println!(
        "team scores: centrals {} allies {}",
        world.world_info.get_team_score(Team::Centrals),
        world.world_info.get_team_score(Team::Allies)
    );
    assert!(total_kills > 0);
}

#[test]
fn bot_games_replay_identically() {
    let bots = [
        (Some(Team::Centrals), BotDifficulty::Ace),
        (Some(Team::Allies), BotDifficulty::Hard),
        (None, BotDifficulty::Medium),
    ];
    let (world, _) = simulate("classic", &bots, 6000, false);
    let bytes = world.get_replay_file_bytes();
    let (_, replay) = ReplayFile::from_bytes(&bytes).unwrap();

    let mut replayed = World::new();
    replayed.load_level(&replay.level_data);
    replayed.set_round_settings(replay.game_time_minutes, replay.intermission_seconds);
    replayed.set_game_mode(replay.game_mode);
    replayed.simulate_until(&replay, Some(world.get_tick()), true);

    let summary = |w: &World| {
        let mut rows: Vec<(String, i16, u16, Option<Team>)> = w
            .players
            .get_map()
            .values()
            .map(|p| (p.get_name(), p.get_kills(), p.get_deaths(), *p.get_team()))
            .collect();
        rows.sort_by(|a, b| a.0.cmp(&b.0));
        rows
    };
    assert_eq!(summary(&world), summary(&replayed));
    assert!(replayed.players.get_map().values().all(|p| p.is_bot()));
}

#[test]
fn removing_a_bot_removes_its_player() {
    let mut world = World::new();
    world.load_level(&level("classic"));
    let mut manager = BotManager::new();
    manager.add_bot(AddBotRequest {
        guid: guid("a"),
        name: "A".into(),
        team: Some(Team::Allies),
        difficulty: BotDifficulty::Easy,
    });
    for _ in 0..10 {
        let input = manager.tick(&world);
        world.tick(input);
    }
    assert_eq!(world.players.get_map().len(), 1);
    assert!(manager.remove_bot(&guid("a")));
    let input = manager.tick(&world);
    world.tick(input);
    assert_eq!(world.players.get_map().len(), 0);
    assert!(manager.bots().is_empty());
}

fn duel(a: BotDifficulty, b: BotDifficulty, level_name: &str) -> (i32, i32) {
    let (world, _) = simulate(
        level_name,
        &[(Some(Team::Centrals), a), (Some(Team::Allies), b)],
        30000,
        false,
    );
    let kills = |name: &str| {
        world
            .players
            .get_map()
            .values()
            .find(|p| p.get_name() == name)
            .map(|p| p.get_kills() as i32)
            .unwrap_or(0)
    };
    (kills("Bot 0"), kills("Bot 1"))
}

#[test]
fn harder_bots_win_duels() {
    let mut stronger = 0;
    let mut weaker = 0;
    for level_name in ["classic", "london"] {
        for (a, b) in [
            (BotDifficulty::Hard, BotDifficulty::Easy),
            (BotDifficulty::Ace, BotDifficulty::Easy),
            (BotDifficulty::Ace, BotDifficulty::Medium),
        ] {
            let (ka, kb) = duel(a, b, level_name);
            println!("{level_name} {a:?} {ka} - {kb} {b:?}");
            stronger += ka;
            weaker += kb;
        }
    }
    assert!(stronger > weaker * 3 / 2, "{stronger} vs {weaker}");
}

fn bomber_picks(game_mode: GameMode) -> u32 {
    let mut world = World::new();
    world.load_level(&level("classic"));
    world.set_game_mode(game_mode);
    let mut manager = BotManager::new();
    manager.add_bot(AddBotRequest {
        guid: guid("bot"),
        name: "Bot".into(),
        team: Some(Team::Centrals),
        difficulty: BotDifficulty::Hard,
    });
    for _ in 0..10 {
        let input = manager.tick(&world);
        world.tick(input);
    }
    let (_, player) = world.get_player_from_guid(&guid("bot")).unwrap();
    let bot = &mut manager.bots[0];
    (0..2000)
        .filter_map(|_| bot.choose_takeoff(&world, player, Team::Centrals))
        .filter(|s| s.plane_type == PlaneType::Junkers)
        .count() as u32
}

#[test]
fn rounds_bots_rarely_pick_bombers() {
    let normal = bomber_picks(GameMode::Normal);
    let rounds = bomber_picks(GameMode::Rounds);
    println!("bomber picks: normal {normal}, rounds {rounds}");
    assert!(normal > 300);
    assert!(rounds * 3 < normal);
}

#[test]
fn rounds_bots_win_rounds_by_elimination() {
    let bots = [
        (Some(Team::Centrals), BotDifficulty::Hard),
        (Some(Team::Centrals), BotDifficulty::Hard),
        (Some(Team::Allies), BotDifficulty::Hard),
        (Some(Team::Allies), BotDifficulty::Hard),
    ];
    let (world, _) = simulate_mode("classic", &bots, 30_000, false, GameMode::Rounds);
    let wins = world.world_info.get_team_wins(Team::Centrals)
        + world.world_info.get_team_wins(Team::Allies);
    println!("round wins: {wins}");
    assert!(wins >= 1);
}
