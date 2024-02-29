use core::panic;
use std::process::id;

use proc_macro::TokenStream;
use quote::quote;
use syn::{DeriveInput, Ident};

#[proc_macro_derive(Networkable)]
pub fn networkable_derive_macro(item: TokenStream) -> TokenStream {
    // parse
    let ast: DeriveInput = syn::parse(item).unwrap();

    // generate
    impl_networkable_trait(ast)
}

fn impl_networkable_trait(ast: DeriveInput) -> TokenStream {
    let ident = ast.ident;
    let ident_str = ident.to_string();

    let fields: Vec<Ident> = match ast.data {
        syn::Data::Struct(s) => s.fields.into_iter().filter_map(|f| f.ident).collect(),
        syn::Data::Enum(_) => panic!("No enums"),
        syn::Data::Union(_) => panic!("oh shit"),
    };

    let strs: Vec<String> = fields.iter().map(|i| i.to_string()).collect();

    // generate impl
    quote! {

        #[derive(Debug)]
        pub enum MacroEnum {
            Bar,
            Baz,
            Matt
        }

        impl Networkable for #ident {
            fn name(&self) -> &'static str {
                #ident_str
            }

            fn field_names(&self) -> Vec<&'static str> {
                vec![#(#strs),*]
            }
        }
    }
    .into()
}
