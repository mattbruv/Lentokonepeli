use proc_macro::TokenStream;
use quote::quote;
use syn::{
    parse_macro_input, spanned::Spanned, AngleBracketedGenericArguments, Attribute, Data,
    DeriveInput, Fields, GenericArgument, Ident, PathArguments, Token, Type,
};

#[proc_macro_derive(Networkable, attributes(client))]
pub fn derive_networkable(input: TokenStream) -> TokenStream {
    quote!(
        pub enum hey {
            foo,
        }
    )
    .into()
}

#[proc_macro_derive(PartialState)]
pub fn partial_state(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);

    let name = &input.ident;
    let partial_name = Ident::new(&format!("Partial{}", name), name.span());

    let fields = match input.data {
        syn::Data::Struct(data_struct) => match data_struct.fields {
            Fields::Named(fields) => fields.named,
            Fields::Unnamed(_) => unimplemented!(),
            Fields::Unit => unimplemented!(),
        },
        _ => unimplemented!(),
    };

    let partial_fields = fields.into_iter().map(|mut field| {
        let original_type = field.ty.clone();
        field.ty = Type::Path(syn::TypePath {
            path: syn::Path::from(syn::PathSegment {
                ident: Ident::new("Option", field.ty.span()),
                arguments: PathArguments::AngleBracketed(AngleBracketedGenericArguments {
                    args: vec![GenericArgument::Type(original_type)]
                        .into_iter()
                        .collect(),
                    colon2_token: None,
                    lt_token: <Token![<]>::default(),
                    gt_token: <Token![>]>::default(),
                }),
            }),
            qself: None,
        });
        field
    });

    let output = quote! {
        struct #partial_name {
            #(#partial_fields),*
        }
    };

    TokenStream::from(output)
}
