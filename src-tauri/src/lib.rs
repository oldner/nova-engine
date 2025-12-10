use std::sync::Mutex;
use tauri::{Manager, State};
mod models;
use models::{Episode, Project, Scene, Season};


struct AppState {
    project: Mutex<Option<Project>>,
    current_path: Mutex<Option<String>>,
}

#[tauri::command]
fn create_project(name: String, state: State<AppState>) -> Project {
    let mut project = Project::default();
    project.name = name;
    *state.project.lock().unwrap() = Some(project.clone());
    *state.current_path.lock().unwrap() = None; // Reset path
    project
}

#[tauri::command]
fn get_current_project(state: State<AppState>) -> Option<Project> {
    state.project.lock().unwrap().clone()
}

#[tauri::command]
fn load_project(path: String, state: State<AppState>) -> Result<Project, String> {
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let project: Project = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    *state.project.lock().unwrap() = Some(project.clone());
    *state.current_path.lock().unwrap() = Some(path);
    
    Ok(project)
}

#[tauri::command]
fn save_project_as(path: String, project: Project, state: State<AppState>) -> Result<(), String> {
    // Update state with the new project data
    *state.project.lock().unwrap() = Some(project.clone());
    *state.current_path.lock().unwrap() = Some(path.clone());

    let json = serde_json::to_string_pretty(&project).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
fn save_scene(
    season_id: String,
    episode_id: String,
    scene: Scene,
    state: State<AppState>,
) -> Result<(), String> {
    let mut project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_mut() {
        if let Some(season) = project.seasons.get_mut(&season_id) {
            if let Some(episode) = season.episodes.get_mut(&episode_id) {
                episode.scenes.insert(scene.id.clone(), scene);
                return Ok(());
            }
        }
        Err("Season or Episode not found".to_string())
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
fn save_project(project: Project, state: State<AppState>) -> Result<String, String> {
    // Update state
    *state.project.lock().unwrap() = Some(project.clone());
    
    let path_guard = state.current_path.lock().unwrap();
    if let Some(path) = path_guard.as_ref() {
        let json = serde_json::to_string_pretty(&project).map_err(|e| e.to_string())?;
        std::fs::write(path, json).map_err(|e| e.to_string())?;
        println!("Project saved to {}", path);
        Ok(format!("Project saved to {}", path))
    } else {
        Err("Project has not been saved yet (Use Save As)".to_string())
    }
}

#[tauri::command]
fn delete_scene(
    season_id: String,
    episode_id: String,
    scene_id: String,
    state: State<AppState>,
) -> Result<(), String> {
    let mut project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_mut() {
        if let Some(season) = project.seasons.get_mut(&season_id) {
            if let Some(episode) = season.episodes.get_mut(&episode_id) {
                if episode.scenes.remove(&scene_id).is_some() {
                    return Ok(());
                }
            }
        }
        Err("Item not found".to_string())
    } else {
        Err("No active project".to_string())
    }
}

#[tauri::command]
fn delete_episode(
    season_id: String,
    episode_id: String,
    state: State<AppState>,
) -> Result<(), String> {
    let mut project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_mut() {
        if let Some(season) = project.seasons.get_mut(&season_id) {
            if season.episodes.remove(&episode_id).is_some() {
                return Ok(());
            }
        }
        Err("Item not found".to_string())
    } else {
        Err("No active project".to_string())
    }
}

#[tauri::command]
fn delete_season(season_id: String, state: State<AppState>) -> Result<(), String> {
    let mut project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_mut() {
        if project.seasons.remove(&season_id).is_some() {
            Ok(())
        } else {
            Err("Season not found".to_string())
        }
    } else {
        Err("No active project".to_string())
    }
}

#[tauri::command]
fn import_file(file_path: String, state: State<AppState>) -> Result<String, String> {
    let path_guard = state.current_path.lock().unwrap();
    if let Some(project_path_str) = path_guard.as_ref() {
        let project_path = std::path::Path::new(project_path_str);
        let project_dir = project_path.parent().ok_or("Invalid project path")?;
        let assets_dir = project_dir.join("assets");

        if !assets_dir.exists() {
            std::fs::create_dir(&assets_dir).map_err(|e| e.to_string())?;
        }

        let source_path = std::path::Path::new(&file_path);
        let filename = source_path.file_name().ok_or("Invalid source filename")?;
        let dest_path = assets_dir.join(filename);

        std::fs::copy(source_path, &dest_path).map_err(|e| e.to_string())?;

        // Return the asset protocol URL or relative path
        // For Tauri to load local files, we might need a custom protocol or just use absolute path for now.
        // Let's return the simplified name for internal reference, but we might need a way to resolved it in frontend.
        // Or return "asset://<filename>" if we configure that.
        // For dev, simple absolute path might be easiest, but less portable?
        // Let's stick to returning just the filename, and let frontend construct the URL using the tauri conversion API.
        
        Ok(filename.to_string_lossy().to_string())
    } else {
        Err("No active project".to_string())
    }
}

#[tauri::command]
fn get_project_assets(state: State<AppState>) -> Result<Vec<String>, String> {
    let path_guard = state.current_path.lock().unwrap();
    if let Some(project_path_str) = path_guard.as_ref() {
        let project_path = std::path::Path::new(project_path_str);
        let project_dir = project_path.parent().ok_or("Invalid project path")?;
        let assets_dir = project_dir.join("assets");

        if !assets_dir.exists() {
            return Ok(vec![]);
        }

        let mut assets = Vec::new();
        for entry in std::fs::read_dir(assets_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() {
                if let Some(name) = path.file_name() {
                    assets.push(name.to_string_lossy().to_string());
                }
            }
        }
        Ok(assets)
    } else {
        Err("No active project".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            project: Mutex::new(None),
            current_path: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            create_project,
            get_current_project,
            load_project,
            save_project_as,
            save_scene,
            save_script_graph,
            save_project,
            delete_scene,
            delete_episode,
            delete_season,
            import_file,
            get_project_assets
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
