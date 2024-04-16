use serde::Serialize;
use ts_rs::TS;

#[derive(Debug, PartialEq, Eq, Clone, Copy, TS, Serialize)]
#[ts(export)]
pub enum Terrain {
    Normal = 0,
    Desert = 1,
}
