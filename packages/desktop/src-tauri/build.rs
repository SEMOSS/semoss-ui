use std::{env, fs, path::PathBuf};

fn compiled_profiles() -> Option<String> {
    println!("cargo:rerun-if-env-changed=VITE_DESKTOP_PROFILES");
    if let Ok(value) = env::var("VITE_DESKTOP_PROFILES") {
        return Some(value);
    }

    let env_path = PathBuf::from("../.env");
    println!("cargo:rerun-if-changed={}", env_path.display());

    let contents = fs::read_to_string(env_path).ok()?;
    contents.lines().find_map(|line| {
        line.strip_prefix("VITE_DESKTOP_PROFILES=")
            .map(str::trim)
            .map(str::to_owned)
    })
}

fn main() {
    if let Some(profiles) = compiled_profiles() {
        println!("cargo:rustc-env=SEMOSS_DESKTOP_PROFILES={profiles}");
    }
    tauri_build::build()
}
