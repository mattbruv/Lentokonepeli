use crate::{
    bots::{AddBotRequest, BotDifficulty, BotManager},
    entities::{player::PlayerGuid, types::Team, world_info::GameMode},
    network::encoding::NetworkedBytes,
    replay::file::ReplayFile,
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

const TICKS: u32 = 3_000;

fn new_world() -> World {
    let mut world = World::new();
    world.load_level(CLASSIC);
    world.set_round_settings(0, 20);
    world.set_game_mode(GameMode::Normal);
    world
}

fn new_bots() -> BotManager {
    let mut bots = BotManager::new();
    let setups = [
        ("c1", Team::Centrals, BotDifficulty::Ace),
        ("c2", Team::Centrals, BotDifficulty::Medium),
        ("a1", Team::Allies, BotDifficulty::Hard),
        ("a2", Team::Allies, BotDifficulty::Easy),
    ];
    for (guid, team, difficulty) in setups {
        bots.add_bot(AddBotRequest {
            guid: PlayerGuid::from(guid),
            name: guid.to_string(),
            team: Some(team),
            difficulty,
        });
    }
    bots
}

fn state_bytes(world: &World) -> Vec<u8> {
    world.get_full_state().to_bytes()
}

fn play_live() -> World {
    play_live_with(GameRules::default())
}

fn custom_rules() -> GameRules {
    let mut rules = GameRules::default();
    rules.friendly_fire = false;
    rules.plane_collisions = false;
    rules.unlimited_ammo = true;
    rules.bullet_plane_damage = 90;
    rules.explosion_building_damage = 40;
    rules.runway_health = 400;
    rules.respawn_ticks = 100;
    rules.planes.junkers.allowed = false;
    rules.planes.sopwith.bombs = 3;
    rules.planes.fokker.turn_step = 0.07;
    rules.planes.albatros.acceleration = 6.5;
    rules
}

fn play_live_with(rules: GameRules) -> World {
    let mut world = new_world();
    world.set_rules(rules);
    let mut bots = new_bots();
    for tick in 1..=TICKS {
        let input = bots.tick(&world);
        world.tick(input);
        if tick % 2 == 0 {
            world.flush_changed_state();
        }
    }
    world
}

#[test]
fn identical_games_end_in_identical_state() {
    let first = play_live();
    let second = play_live();
    assert_eq!(first.players.get_map().len(), 4);
    assert_eq!(state_bytes(&first), state_bytes(&second));
}

#[test]
fn replay_matches_live_game_regardless_of_flush_timing() {
    let live = play_live();
    let (_, replay) = ReplayFile::from_bytes(&live.get_replay_file_bytes()).unwrap();

    for flush in [true, false] {
        let mut replayed = new_world();
        replayed.simulate_until(&replay, Some(live.get_tick()), flush);
        assert_eq!(replayed.get_tick(), live.get_tick());
        assert_eq!(state_bytes(&replayed), state_bytes(&live));
    }
}

#[test]
fn custom_rules_replay_matches_live_game() {
    let live = play_live_with(custom_rules());
    assert_ne!(state_bytes(&live), state_bytes(&play_live()));
    let (_, replay) = ReplayFile::from_bytes(&live.get_replay_file_bytes()).unwrap();
    assert_eq!(replay.rules, custom_rules());

    let mut replayed = new_world();
    replayed.set_rules(replay.rules);
    replayed.simulate_until(&replay, Some(live.get_tick()), false);
    assert_eq!(state_bytes(&replayed), state_bytes(&live));
    assert!(live
        .planes
        .get_map()
        .values()
        .all(|p| p.get_plane_type() != crate::entities::plane::PlaneType::Junkers));
}

#[test]
fn replay_files_are_byte_stable() {
    let live = play_live();
    let bytes = live.get_replay_file_bytes();
    let (_, replay) = ReplayFile::from_bytes(&bytes).unwrap();
    assert_eq!(replay.to_bytes(), bytes);
    assert_eq!(live.get_replay_file_bytes(), bytes);
}

#[test]
fn large_games_round_trip_through_network_encoding() {
    use crate::{
        network::encoding::{read_varint, write_varint},
        output::ServerOutput,
    };

    for value in [0u32, 1, 127, 128, 16_383, 16_384, u16::MAX as u32, u32::MAX] {
        let mut bytes = vec![];
        write_varint(value, &mut bytes);
        assert_eq!(read_varint(&bytes), Some((&[][..], value)));
    }

    let mut world = new_world();
    let mut bots = BotManager::new();
    for i in 0..1_000 {
        bots.add_bot(AddBotRequest {
            guid: PlayerGuid::from(format!("bot{i}").as_str()),
            name: format!("bot{i}"),
            team: None,
            difficulty: BotDifficulty::Easy,
        });
    }
    for _ in 0..200 {
        let input = bots.tick(&world);
        world.tick(input);
    }
    assert_eq!(world.players.get_map().len(), 1_000);

    let full_state = world.get_full_state();
    let bytes = ServerOutput::EntityChanges(full_state.clone()).to_bytes();
    match ServerOutput::from_bytes(&bytes) {
        Some((rest, ServerOutput::EntityChanges(decoded))) => {
            assert!(rest.is_empty());
            assert_eq!(decoded.len(), full_state.len());
            assert_eq!(ServerOutput::EntityChanges(decoded).to_bytes(), bytes);
        }
        _ => panic!("failed to decode entity changes"),
    }
}
