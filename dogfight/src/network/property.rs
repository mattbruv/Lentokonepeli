use std::fmt::Debug;

#[derive(Debug)]
pub struct Property<T: Eq + Debug> {
    value: T,
    dirty: bool,
}

impl<T> Property<T>
where
    T: Eq + Debug + Copy,
{
    pub fn new(value: T) -> Self {
        Self {
            value: value,
            dirty: true,
        }
    }
    pub fn set(&mut self, new_value: T) {
        if self.value != new_value {
            self.dirty = true;
            self.value = new_value;
        }
    }

    pub fn get(&self) -> &T {
        &self.value
    }

    pub fn is_dirty(&self) -> bool {
        self.dirty
    }

    fn get_and_reset(&mut self) -> T {
        self.dirty = false;
        self.value
    }

    pub fn get_full(&self) -> Option<T> {
        Some(self.value)
    }

    pub fn get_changed(&mut self) -> Option<T> {
        match self.dirty {
            true => Some(self.get_and_reset()),
            false => None,
        }
    }
}
