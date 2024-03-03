use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Attribute, DeriveInput};

#[proc_macro_attribute]
pub fn network(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}

#[proc_macro_attribute]
pub fn lento_test(attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as DeriveInput);
    // let attributes = parse_macro_input!(attr as Attribute);
    let x = input.ident.to_owned();

    let new_attrs = quote! {
        #[derive(TS)]
        #[ts(export)]
        #input
    };

    TokenStream::from(new_attrs)
}
