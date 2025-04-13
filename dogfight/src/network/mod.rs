pub mod encoding;
pub mod property;

use serde::Serialize;
use ts_rs::TS;

use crate::{
    entities::{
        background_item::BackgroundItemProperties, bomb::BombProperties, bullet::BulletProperties,
        bunker::BunkerProperties, coast::CoastProperties, container::EntityIdWrappedType,
        explosion::ExplosionProperties, ground::GroundProperties, hill::HillProperties,
        man::ManProperties, plane::PlaneProperties, player::PlayerProperties,
        runway::RunwayProperties, types::EntityType, water::WaterProperties,
        world_info::WorldInfoProperties,
    },
    input::PlayerCommand,
    output::ServerOutput,
    replay::file::{ReplayFile, ReplayTick},
};

use self::encoding::NetworkedBytes;

pub trait NetworkedEntity {
    fn get_full_properties(&self) -> EntityProperties;
    fn get_changed_properties_and_reset(&mut self) -> EntityProperties;
    fn has_changes(&self) -> bool;
}

/*
pub(crate) fn entity_changes_to_json(state: Vec<EntityChange>) -> String {
    serde_json::to_string(&state).unwrap()
}
*/

pub(crate) fn entity_changes_to_binary(state: &Vec<EntityChange>) -> Vec<u8> {
    //web_sys::console::log_1(&format!("{:?}", state).into());
    state.iter().flat_map(|x| x.to_bytes()).collect()
}

pub fn game_events_to_binary(events: &Vec<ServerOutput>) -> Vec<u8> {
    events.to_bytes()
}

pub fn player_command_json_from_binary(bytes: &Vec<u8>) -> String {
    match PlayerCommand::from_bytes(bytes) {
        Some((_, command)) => serde_json::to_string(&command).unwrap_or("".to_string()),
        None => "".to_string(),
    }
}

pub fn player_command_json_to_binary(command_json: &str) -> Vec<u8> {
    let command = player_command_from_json(command_json);
    command.to_bytes()
}

pub fn replay_file_json_to_binary(replay_file_json: &str) -> Vec<u8> {
    let input = serde_json::from_str::<ReplayFile>(&replay_file_json).unwrap();
    input.to_bytes()
}

pub fn replay_file_binary_to_json(bytes: Vec<u8>) -> String {
    match ReplayFile::from_bytes(&bytes) {
        Some((_, replay_file)) => serde_json::to_string(&replay_file).unwrap(),
        None => "".to_string(),
    }
}

pub fn replay_tick_json_to_binary(replay_tick_json: &str) -> Vec<u8> {
    let input = serde_json::from_str::<ReplayTick>(&replay_tick_json).unwrap();
    input.to_bytes()
}
pub fn replay_tick_binary_to_json(replay_tick_binary: Vec<u8>) -> String {
    let value = ReplayTick::from_bytes(&replay_tick_binary);
    match value {
        Some((_, replay_tick)) => serde_json::to_string(&replay_tick).unwrap(),
        None => "".to_string(),
    }
}

fn player_command_from_json(command_json: &str) -> PlayerCommand {
    serde_json::from_str::<PlayerCommand>(&command_json).unwrap()
}

pub fn game_events_from_bytes(bytes: &Vec<u8>) -> Vec<ServerOutput> {
    //web_sys::console::log_1(&format!("data: {:?}", bytes).into());
    match Vec::<ServerOutput>::from_bytes(bytes) {
        Some((_, events)) => events,
        None => vec![],
    }
}

pub fn game_events_to_json(events: &Vec<ServerOutput>) -> String {
    serde_json::to_string(&events).unwrap()
}

#[derive(Serialize, Debug, Clone, TS)]
#[ts(export)]
pub struct EntityChange {
    pub ent_type: EntityType,
    pub id: EntityIdWrappedType,
    pub update: EntityChangeType,
}

#[derive(Serialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(tag = "type", content = "data")]
pub enum EntityChangeType {
    Deleted,
    Properties(EntityProperties),
}

#[derive(Serialize, Debug, Clone, TS)]
#[ts(export)]
#[serde(tag = "type", content = "props")]
pub enum EntityProperties {
    WorldInfo(WorldInfoProperties),
    Man(ManProperties),
    Plane(PlaneProperties),
    Player(PlayerProperties),
    BackgroundItem(BackgroundItemProperties),
    Ground(GroundProperties),
    Coast(CoastProperties),
    Runway(RunwayProperties),
    Water(WaterProperties),
    Bunker(BunkerProperties),
    Bomb(BombProperties),
    Explosion(ExplosionProperties),
    Hill(HillProperties),
    Bullet(BulletProperties),
}
