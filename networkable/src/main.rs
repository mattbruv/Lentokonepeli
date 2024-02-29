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

    println!("my generated enum: {:?}", MacroEnum::Matt);

    println!("The name of the struct: {}", foo.name());
    println!("The fields of the struct: {:?}", foo.field_names());
}
