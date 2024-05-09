use euclid::Rect;

use crate::entities::types::Team;

pub struct WorldSpace;

pub trait SolidEntity {
    fn get_team(&self) -> Team;
    fn get_collision_bounds(&self) -> Rect<i32, WorldSpace>;
}
