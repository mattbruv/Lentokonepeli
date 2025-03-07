use crate::{entities::container::PlayerId, network::encoding::NetworkedBytes};
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
