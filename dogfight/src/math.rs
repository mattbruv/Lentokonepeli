use std::f64::consts::TAU;

use serde::Serialize;
use ts_rs::TS;

use crate::world::DIRECTIONS;

// Represents a 2D point in the game world
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

pub fn get_client_percentage(current_amount: i32, max_amount: i32) -> u8 {
    (255.0 * (current_amount as f64 / max_amount as f64)) as u8
}

pub fn radians_to_direction(angle_radians: f64) -> u8 {
    let direction = angle_radians * (DIRECTIONS as f64) / TAU;
    direction as u8
}
