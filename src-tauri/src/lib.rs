use std::sync::Mutex;
use tauri::{State, Manager};
mod models;
use models::{Project, Page, Season, Episode};

struct AppState {
    project: Mutex<Option<Project>>,
}

#[tauri::command]
fn create_project(name: String, state: State<AppState>) -> Project {
    let mut project = Project::default();
    project.name = name;
    *state.project.lock().unwrap() = Some(project.clone());
    project
}

#[tauri::command]
fn get_current_project(state: State<AppState>) -> Option<Project> {
    state.project.lock().unwrap().clone()
}

#[tauri::command]
fn save_page(season_id: String, episode_id: String, page: Page, state: State<AppState>) -> Result<(), String> {
    let mut project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_mut() {
        if let Some(season) = project.seasons.get_mut(&season_id) {
            if let Some(episode) = season.episodes.get_mut(&episode_id) {
                episode.pages.insert(page.id.clone(), page);
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
fn save_project(state: State<AppState>) -> Result<String, String> {
    let project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_ref() {
        let json = serde_json::to_string_pretty(project).map_err(|e| e.to_string())?;
        std::fs::write("../project.json", json).map_err(|e| e.to_string())?;
        Ok("Project saved to ../project.json".to_string())
    } else {
        Err("No active project".to_string())
    }
}

#[tauri::command]
fn delete_page(season_id: String, episode_id: String, page_id: String, state: State<AppState>) -> Result<(), String> {
    let mut project_guard = state.project.lock().unwrap();
    if let Some(project) = project_guard.as_mut() {
        if let Some(season) = project.seasons.get_mut(&season_id) {
            if let Some(episode) = season.episodes.get_mut(&episode_id) {
                if episode.pages.remove(&page_id).is_some() {
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
fn delete_episode(season_id: String, episode_id: String, state: State<AppState>) -> Result<(), String> {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            project: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            create_project,
            get_current_project,
            save_page,
            save_script_graph,
            save_project,
            delete_page,
            delete_episode,
            delete_season
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
