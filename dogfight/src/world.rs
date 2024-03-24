use crate::entities::{container::EntityContainer, man::Man, plane::Plane};

pub const RESOLUTION: i32 = 100;

pub struct World {
    planes: EntityContainer<Plane>,
    men: EntityContainer<Man>,
}

impl World {
    pub fn new() -> Self {
        World {
            men: EntityContainer::new(),
            planes: EntityContainer::new(),
        }
    }
}
