use proc_macro::TokenStream;
use quote::quote;
use syn::{
    parse_macro_input, spanned::Spanned, AngleBracketedGenericArguments, Attribute, Data,
    DeriveInput, Fields, GenericArgument, Ident, PathArguments, Token, Type,
};

#[proc_macro_derive(Networked)]
pub fn partial_state(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let name = &input.ident;
    let partial_name = Ident::new(&format!("Partial{}", name), name.span());

    let output = quote! {
        hello
    };

    TokenStream::from(output)
}
