use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_attribute]
pub fn networkable(_attr: TokenStream, input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident; // e.g., Man
    let struct_name = format!("{}State", name);
    let struct_ident = syn::Ident::new(&struct_name, name.span());

    let generated = quote! {
        #input
    };

    /*
    let generated = quote! {
        struct #struct_ident {
            #(#new_fields)*
        }

        impl #struct_ident {
            #(#set_functions)*
        }
    };
    */

    TokenStream::from(generated)
}
