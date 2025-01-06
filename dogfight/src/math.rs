use serde::Serialize;
use ts_rs::TS;

// Represents a 2D point in the game world
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}
