use networkable::Networkable;

#[derive(Networkable)]
struct Foo {
    a: i32,
    b: bool,
    c: String,
}

fn main() {
    let foo: Foo = Foo {
        a: 4,
        b: false,
        c: "foo".to_string(),
    };

    println!("The name of the struct: {}", foo.name());
}
