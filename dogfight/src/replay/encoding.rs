use std::collections::{BTreeMap, HashMap};

use crate::{input::PlayerCommand, network::encoding::NetworkedBytes};

use super::file::{ReplayFile, ReplayTick, ReplayTickCommand};

impl NetworkedBytes for ReplayTick {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];
        bytes.extend(u32::to_bytes(&self.tick_number));
        bytes.extend(Vec::<ReplayTickCommand>::to_bytes(&self.commands));
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (mut bytes, tick_number) = u32::from_bytes(bytes)?;
        let (slice, commands) = Vec::<ReplayTickCommand>::from_bytes(bytes)?;
        bytes = slice;
        Some((
            bytes,
            Self {
                tick_number,
                commands,
            },
        ))
    }
}

impl NetworkedBytes for ReplayFile {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];

        // Converting the hashmap into a vector because
        // I don't want to write code to serialize hashmaps,
        // and this keeps older replays compatible.
        let mut ticks_vec: Vec<ReplayTick> = vec![];
        for (tick, commands) in &self.ticks {
            ticks_vec.push(ReplayTick {
                tick_number: *tick,
                commands: commands.to_vec(),
            });
        }

        // look how pretty this is
        bytes.extend(self.player_guids.to_bytes());
        bytes.extend(ticks_vec.to_bytes());
        bytes.extend(self.level_name.to_bytes());
        bytes.extend(self.level_data.to_bytes());
        bytes.extend(self.build_version.to_bytes());
        bytes.extend(self.build_commit.to_bytes());

        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (bytes, player_guids) = BTreeMap::<String, u16>::from_bytes(bytes)?;
        let (bytes, ticks_vec) = Vec::<ReplayTick>::from_bytes(bytes)?;
        let (bytes, level_name) = String::from_bytes(bytes)?;
        let (bytes, level_data) = String::from_bytes(bytes)?;
        let (bytes, build_version) = String::from_bytes(bytes)?;
        let (bytes, build_commit) = String::from_bytes(bytes)?;

        // See note in to_bytes to understand why we're converting this
        let mut ticks: HashMap<u32, Vec<ReplayTickCommand>> = HashMap::new();
        for tick in ticks_vec {
            ticks.insert(tick.tick_number, tick.commands);
        }

        Some((
            bytes,
            Self {
                build_version,
                build_commit,
                level_name,
                level_data,
                player_guids,
                ticks,
            },
        ))
    }
}

impl NetworkedBytes for ReplayTickCommand {
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = vec![];
        bytes.extend(self.player_guid_index.to_bytes());
        bytes.extend(self.command.to_bytes());
        bytes
    }

    fn from_bytes(bytes: &[u8]) -> Option<(&[u8], Self)>
    where
        Self: Sized,
    {
        let (bytes, player_guid_index) = u16::from_bytes(bytes)?;
        let (bytes, command) = PlayerCommand::from_bytes(bytes)?;
        Some((
            bytes,
            Self {
                player_guid_index,
                command,
            },
        ))
    }
}
