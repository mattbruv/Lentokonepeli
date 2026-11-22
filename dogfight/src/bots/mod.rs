mod pilot;
mod rng;
mod skill;
mod terrain;

#[cfg(test)]
mod tests;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{
    entities::{player::PlayerGuid, types::Team},
    input::{PlayerCommand, ServerInput},
    world::World,
};

use pilot::Bot;

#[derive(Serialize, Deserialize, Debug, TS, Clone, Copy, PartialEq, Eq)]
#[ts(export)]
pub enum BotDifficulty {
    Easy,
    Medium,
    Hard,
    Ace,
}

#[derive(Serialize, Deserialize, Debug, TS, Clone)]
#[ts(export)]
pub struct AddBotRequest {
    pub guid: PlayerGuid,
    pub name: String,
    pub team: Option<Team>,
    pub difficulty: BotDifficulty,
}

#[derive(Serialize, Deserialize, Debug, TS, Clone)]
#[ts(export)]
pub struct BotInfo {
    pub guid: PlayerGuid,
    pub name: String,
    pub team: Option<Team>,
    pub difficulty: BotDifficulty,
}

pub struct BotManager {
    bots: Vec<Bot>,
    pending: Vec<ServerInput>,
}

impl BotManager {
    pub fn new() -> Self {
        Self {
            bots: vec![],
            pending: vec![],
        }
    }

    pub fn add_bot(&mut self, request: AddBotRequest) -> bool {
        if self.bots.iter().any(|b| b.guid() == &request.guid) {
            return false;
        }
        self.bots.push(Bot::new(request));
        true
    }

    pub fn remove_bot(&mut self, guid: &PlayerGuid) -> bool {
        let before = self.bots.len();
        self.bots.retain(|b| b.guid() != guid);
        if self.bots.len() == before {
            return false;
        }
        self.pending.push(ServerInput {
            player_guid: guid.clone(),
            command: PlayerCommand::RemovePlayer,
        });
        true
    }

    pub fn bots(&self) -> Vec<BotInfo> {
        self.bots.iter().map(|b| b.info()).collect()
    }

    pub fn bots_json(&self) -> String {
        serde_json::to_string(&self.bots()).unwrap_or_else(|_| "[]".to_string())
    }

    pub fn tick(&mut self, world: &World) -> Vec<ServerInput> {
        let mut input: Vec<ServerInput> = self.pending.drain(..).collect();
        for bot in self.bots.iter_mut() {
            input.extend(bot.think(world));
        }
        input
    }
}

pub fn add_bot_request_from_string(json: &str) -> Option<AddBotRequest> {
    serde_json::from_str(json).ok()
}
