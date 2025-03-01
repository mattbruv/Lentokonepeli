fn main() {
    // Read the COMMIT environment variable set by your build script
    let commit = std::env::var("COMMIT").unwrap_or_else(|_| "UNKNOWN_COMMIT".to_string());

    // Inject the COMMIT variable as a compile-time environment variable
    println!("cargo:rustc-env=COMMIT={}", commit);

    // Ensure this script runs again if COMMIT changes
    println!("cargo:rerun-if-env-changed=COMMIT");
}
