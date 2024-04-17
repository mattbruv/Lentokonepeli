use dogfight_macros::Networked;

use crate::network::{property::*, EntityProperties, NetworkedEntity};

use super::types::{BackgroundItemType, Facing};

#[derive(Networked)]
pub struct BackgroundItem {
    bg_item_type: Property<BackgroundItemType>,
    facing: Property<Facing>,
    client_x: Property<i16>,
    client_y: Property<i16>,
}

impl BackgroundItem {
    pub fn new(bg_item_type: BackgroundItemType, facing: Facing, x: i16, y: i16) -> Self {
        Self {
            bg_item_type: Property::new(bg_item_type),
            facing: Property::new(facing),
            client_x: Property::new(x),
            client_y: Property::new(y),
        }
    }
}
