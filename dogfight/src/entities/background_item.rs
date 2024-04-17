use dogfight_macros::Networked;

use crate::network::{property::*, EntityProperties, NetworkedEntity};

use super::types::{BackgroundItemType, Team};

#[derive(Networked)]
pub struct BackgroundItem {
    bg_item_type: Property<BackgroundItemType>,
    client_x: Property<i16>,
    client_y: Property<i16>,
}

impl BackgroundItem {
    pub fn new(bg_item_type: BackgroundItemType, x: i16, y: i16) -> Self {
        Self {
            bg_item_type: Property::new(bg_item_type),
            client_x: Property::new(x),
            client_y: Property::new(y),
        }
    }
}
