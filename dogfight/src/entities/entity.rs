use super::types::EntityType;

pub trait Entity {
    fn get_type(&self) -> EntityType;
}
