use crate::{
    bots::{AddBotRequest, BotDifficulty, BotManager},
    entities::{player::PlayerGuid, types::Team, world_info::GameMode},
    network::encoding::NetworkedBytes,
    replay::file::ReplayFile,
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
    let mut world = new_world();
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
fn replay_files_are_byte_stable() {
    let live = play_live();
    let bytes = live.get_replay_file_bytes();
    let (_, replay) = ReplayFile::from_bytes(&bytes).unwrap();
    assert_eq!(replay.to_bytes(), bytes);
    assert_eq!(live.get_replay_file_bytes(), bytes);
}
