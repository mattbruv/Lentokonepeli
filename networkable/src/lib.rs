pub use networkable_derive::Networkable;

pub trait Networkable {
    fn name(&self) -> &'static str;
}
