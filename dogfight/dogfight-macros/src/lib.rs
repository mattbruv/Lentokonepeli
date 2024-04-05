use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput, Fields, Ident};

#[proc_macro_derive(Networked)]
pub fn networked(input: TokenStream) -> TokenStream {
    // Parse the input tokens into a syntax tree
    let input = parse_macro_input!(input as DeriveInput);

    // Extract the name of the struct
    let struct_name = &input.ident;

    // Extract fields from the struct
    let fields = match input.data {
        Data::Struct(data_struct) => {
            if let Fields::Named(fields) = data_struct.fields {
                fields.named
            } else {
                panic!("OH SHit");
            }
        }
        _ => {
            return syn::Error::new_spanned(input, "Expected a struct with named fields")
                .to_compile_error()
                .into();
        }
    };

    // Iterate through the fields and collect identifiers and types
    let mut property_fields = Vec::new();
    for field in fields {
        if let Some((field_ident, property_type)) = extract_property_info(&field) {
            property_fields.push((field_ident, property_type));
        }
    }

    // Generate the new struct definition
    let properties_struct_name =
        Ident::new(&format!("{}Properties", struct_name), struct_name.span());
    let properties_fields = property_fields.iter().map(|(ident, ty)| {
        quote! {
            #ident: Option<#ty>
        }
    });

    // Generate the implementation of Networked trait for the original struct
    let mut expanded = quote! {
        use serde::Serialize;
        use ts_rs::TS;

        #[derive(Serialize, Debug, TS)]
        #[ts(export)]
        pub struct #properties_struct_name {
            #(#properties_fields),*
        }
    };

    let full_code = property_fields.iter().map(|(ident, _)| {
        quote! {
            #ident: self.#ident.get_full()
        }
    });

    let changed_code = property_fields.iter().map(|(ident, _)| {
        quote! {
            #ident: self.#ident.get_changed()
        }
    });

    // Implement default values for the properties
    let networked_impl = quote! {
        impl NetworkedEntity for #struct_name {
            fn get_full_properties(&self) -> EntityProperties {
                EntityProperties::#struct_name(#properties_struct_name {
                    #(#full_code),*
                })
            }

            fn get_changed_properties_and_reset(&mut self) -> EntityProperties {
                EntityProperties::#struct_name(#properties_struct_name {
                    #(#changed_code),*
                })
            }
        }
    };

    expanded.extend(networked_impl);

    let to_bytes = property_fields.iter().map(|(ident, _)| {
        quote! {
            is_set.push(self.#ident.is_some());
            if let Some(val) = self.#ident {
                bytes.extend(val.to_bytes());
            }
        }
    });

    let property_impl = quote! {
        use crate::network::NetworkedBytes;
        use crate::network::property_header_bytes;

        impl NetworkedBytes for #properties_struct_name {
            fn to_bytes(&self) -> Vec<u8> {
                let mut bytes = vec![];
                let mut is_set = vec![];

                #(#to_bytes)*

                let header_bytes = property_header_bytes(is_set);

                bytes
            }
        }
    };

    expanded.extend(property_impl);

    // Return the generated implementation
    TokenStream::from(expanded)
}

// Helper function to extract the type inside Property<T>
fn extract_property_type(field: &syn::Field) -> Option<syn::Type> {
    let ty = &field.ty;
    if let syn::Type::Path(type_path) = ty {
        if let Some(segment) = type_path.path.segments.first() {
            if segment.ident == "Property" {
                if let syn::PathArguments::AngleBracketed(args) = &segment.arguments {
                    if let Some(syn::GenericArgument::Type(inner_type)) = args.args.first() {
                        return Some(inner_type.clone());
                    }
                }
            }
        }
    }
    None
}

fn extract_property_info(field: &syn::Field) -> Option<(syn::Ident, syn::Type)> {
    if let Some(ident) = &field.ident {
        if let Some(t) = extract_property_type(field) {
            return Some((ident.clone(), t));
        }
    }
    None
}

// Helper function to extract the identifier and type inside Property<T>
