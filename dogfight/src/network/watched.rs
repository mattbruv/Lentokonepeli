use std::fmt::Debug;

struct Test {
    a: Watched<i16>,
    b: Watched<bool>,
}

impl Foo for i16 {
    fn testing(&self) -> String {
        "i16_test".into()
    }
}
impl Foo for bool {
    fn testing(&self) -> String {
        "boolfoo".to_owned()
    }
}

impl Test {
    pub fn test(&self) {
        let items: Vec<&Watched<bool>> = vec![&self.b, &self.b];

        for x in items {
            println!("{:?}", x);
        }
    }
}

#[derive(Debug)]
struct Watched<T: Eq + Foo + Debug> {
    value: T,
    dirty: bool,
}

trait Foo {
    fn testing(&self) -> String;
}

impl<T> Watched<T>
where
    T: Eq + Foo + Debug,
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

    pub fn get_and_reset(&mut self) -> &T {
        self.dirty = false;
        &self.value
    }
}
