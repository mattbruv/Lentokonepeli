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

    #[inline]
    pub fn set(&mut self, new_value: T) {
        if self.value != new_value {
            self.dirty = true;
            self.value = new_value;
        }
    }

    #[inline]
    pub fn get(&self) -> &T {
        &self.value
    }

    #[inline]
    pub fn is_dirty(&self) -> bool {
        self.dirty
    }

    #[inline]
    fn get_and_reset(&mut self) -> T {
        self.dirty = false;
        self.value
    }

    #[inline]
    pub fn get_full(&self) -> Option<T> {
        Some(self.value)
    }

    #[inline]
    pub fn get_changed(&mut self) -> Option<T> {
        match self.dirty {
            true => Some(self.get_and_reset()),
            false => None,
        }
    }
}
