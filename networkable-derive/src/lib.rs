use std::process::id;

use proc_macro::TokenStream;
use quote::quote;
use syn::DeriveInput;

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

    // generate impl
    quote! {
        impl Networkable for #ident {
            fn name(&self) -> &'static str {
                #ident_str
            }
        }
    }
    .into()
}
