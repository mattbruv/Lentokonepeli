use std::{
    borrow::{Borrow, BorrowMut},
    clone,
};

use proc_macro::TokenStream;
use quote::{quote, ToTokens};
use syn::{
    parse_macro_input, spanned::Spanned, DeriveInput, Field, Fields, FieldsNamed, Ident, Item,
    ItemStruct,
};

#[proc_macro_attribute]
pub fn networkable(_attr: TokenStream, input: TokenStream) -> TokenStream {
    let mut input = parse_macro_input!(input as ItemStruct);

    match &input.vis {
        syn::Visibility::Inherited => (),
        _ => panic!("Must not be a public struct"),
    }

    let mut fields = match &mut input.fields {
        Fields::Named(f) => f.clone(),
        _ => panic!("Doesn't work with anything but named fields"),
    };

    fields.named.push_value(Field {
        attrs: fields.named[0].attrs.clone(),
        colon_token: fields.named[0].colon_token,
        vis: fields.named[0].vis.clone(),
        mutability: syn::FieldMutability::None,
        ident: Some(Ident::new("test", fields.named[0].ident.span())),
        ty: fields.named[0].ty.clone(),
    });

    input.fields = Fields::Named(fields);

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
