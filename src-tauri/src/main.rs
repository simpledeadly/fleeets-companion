// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{GlobalShortcutManager, Manager};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            let mut shortcuts = app.global_shortcut_manager();

            // Register Option+Space (Alt+Space) to toggle visibility
            // Note: On Mac "Option" is mapped to "Alt" in accelerator string usually
            shortcuts
                .register("Alt+Space", move || {
                    let window = app_handle.get_window("main").unwrap();
                    if window.is_visible().unwrap() {
                        window.hide().unwrap();
                    } else {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                })
                .unwrap();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
