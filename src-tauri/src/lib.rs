use std::sync::Mutex;
use tauri::{State, Manager};
mod models;
use models::{Project, Scene, SceneElement, ElementType};

struct AppState {
    project: Mutex<Option<Project>>,
}

#[tauri::command]
fn create_project(name: String, state: State<AppState>) -> Project {
    let mut project = Project::default();
    project.name = name;
    
    // Create a default start scene
    let start_scene = Scene {
        id: "start".to_string(),
        name: "Start Scene".to_string(),
        background: None,
        elements: vec![
            SceneElement {
                id: "welcome_text".to_string(),
                element_type: ElementType::Text,
                x: 100.0,
                y: 100.0,
                width: 400.0,
                height: 100.0,
                content: "Welcome to Nova Engine".to_string(),
                z_index: 0,
                properties: std::collections::HashMap::new(),
            }
        ],
    };
    
    project.scenes.insert(start_scene.id.clone(), start_scene);
    project.active_scene_id = Some("start".to_string());
    
    *state.project.lock().unwrap() = Some(project.clone());
    project
}

#[tauri::command]
fn get_current_project(state: State<AppState>) -> Option<Project> {
    state.project.lock().unwrap().clone()
}

#[tauri::command]
fn save_scene(scene: Scene, state: State<AppState>) -> Result<(), String> {
    let mut project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_mut() {
        project.scenes.insert(scene.id.clone(), scene);
        Ok(())
    } else {
        Err("No active project".to_string())
    }
}

#[tauri::command]
fn save_script_graph(graph: models::ScriptGraph, state: State<AppState>) -> Result<(), String> {
    let mut project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_mut() {
        project.script_graphs.insert(graph.id.clone(), graph);
        Ok(())
    } else {
        Err("No active project".to_string())
    }
}

#[tauri::command]
fn save_project(state: State<AppState>) -> Result<String, String> {
    let project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_ref() {
        let json = serde_json::to_string_pretty(project).map_err(|e| e.to_string())?;
        std::fs::write("project.json", json).map_err(|e| e.to_string())?;
        Ok("Project saved to project.json".to_string())
    } else {
        Err("No active project".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            project: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            create_project,
            get_current_project,
            save_scene,
            save_script_graph,
            save_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
