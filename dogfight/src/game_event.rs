use crate::{
    entities::{container::PlayerId, types::Team},
    network::encoding::NetworkedBytes,
};
use dogfight_macros::EnumBytes;
use serde::Serialize;
use ts_rs::TS;

// Here we are defining anything related to game events
// such as players killing each other,
// chat messages,
// game ending events,
// player joins, etc.

#[derive(Serialize, Debug, Clone, TS, Copy, EnumBytes, PartialEq)]
#[ts(export)]
pub enum KillMethod {
    Plane,
    Man,
}

#[derive(Serialize, Debug, Clone, TS)]
#[ts(export)]
pub struct KillEvent {
    pub killer: PlayerId,
    pub victim: Option<PlayerId>,
    pub method: KillMethod,
}

impl KillEvent {
    pub fn new(killer: PlayerId, victim: Option<PlayerId>, method: KillMethod) -> Self {
        Self {
            killer,
            victim,
            method,
        }
    }
}

impl NetworkedBytes for KillEvent {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];
        bytes.extend(self.killer.to_bytes());
        bytes.extend(self.victim.to_bytes());
        bytes.extend(self.method.to_bytes());
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (bytes, killer) = PlayerId::from_bytes(bytes)?;
        let (bytes, victim) = Option::<PlayerId>::from_bytes(bytes)?;
        let (bytes, method) = KillMethod::from_bytes(bytes)?;

        Some((
            bytes,
            Self {
                killer,
                victim,
                method,
            },
        ))
    }
}

#[derive(Serialize, Debug, Clone, TS)]
#[ts(export)]
pub struct ChatMessage {
    pub sender: Option<PlayerId>,
    pub team: Option<Team>,
    pub private: bool,
    pub message: String,
}

impl NetworkedBytes for ChatMessage {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];
        bytes.extend(self.sender.to_bytes());
        bytes.extend(self.team.to_bytes());
        bytes.extend(self.private.to_bytes());
        bytes.extend(self.message.to_bytes());
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (bytes, sender) = Option::<PlayerId>::from_bytes(bytes)?;
        let (bytes, team) = Option::<Team>::from_bytes(bytes)?;
        let (bytes, private) = bool::from_bytes(bytes)?;
        let (bytes, message) = String::from_bytes(bytes)?;

        Some((
            bytes,
            Self {
                sender,
                team,
                private,
                message,
            },
        ))
    }
}
