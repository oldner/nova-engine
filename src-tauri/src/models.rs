use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub seasons: HashMap<String, Season>,
    pub characters: HashMap<String, Character>,
    #[serde(default)]
    pub script_graphs: HashMap<String, ScriptGraph>,
    // Navigation State
    pub active_season_id: Option<String>,
    pub active_episode_id: Option<String>,
    pub active_scene_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Season {
    pub id: String,
    pub name: String,
    pub episodes: HashMap<String, Episode>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Episode {
    pub id: String,
    pub name: String,
    pub scenes: HashMap<String, Scene>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    pub id: String,
    pub name: String,
    pub background: Option<String>,
    pub elements: Vec<SceneElement>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")] // Frontend sends "dialogue", "image" (SceneElement type)
pub enum ElementType {
    Text,
    Image,
    Choice,
    Dialogue, // "dialogue" type used in frontend for Dialogue Box
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SceneElement {
    pub id: String,
    #[serde(rename = "type")]
    pub element_type: ElementType,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub content: String,
    pub z_index: i32,
    #[serde(default)]
    pub properties: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Character {
    pub id: String,
    pub name: String,
    pub color: String,
    pub default_sprite: Option<String>,
}

// --- Scripting System Models ---

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScriptGraph {
    pub id: String,
    pub name: String,
    pub nodes: Vec<ScriptNode>,
    pub connections: Vec<ScriptConnection>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")] // Matches frontend: text, choice, change_scene, etc.
pub enum NodeType {
    Start,
    End,
    Text,
    Choice,
    SetVariable,
    CheckVariable,
    ChangeScene,
    Music,
    Character,
    SceneNode,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScriptNode {
    pub id: String,
    pub label: Option<String>,
    #[serde(rename = "type")]
    pub node_type: NodeType,
    pub x: f32,
    pub y: f32,
    pub data: serde_json::Value, // Flexible JSON data for node contents
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScriptConnection {
    pub id: String,
    pub from_node: String,
    pub from_port: String,
    pub to_node: String,
    pub to_port: String,
}

impl Default for Project {
    fn default() -> Self {
        let mut seasons = HashMap::new();
        let mut episodes = HashMap::new();
        let mut scenes = HashMap::new();

        // Create Default Content
        let scene_id = "scene_1".to_string();
        scenes.insert(
            scene_id.clone(),
            Scene {
                id: scene_id.clone(),
                name: "Scene 1".to_string(),
                background: None,
                elements: vec![],
            },
        );

        let episode_id = "ep_1".to_string();
        episodes.insert(
            episode_id.clone(),
            Episode {
                id: episode_id.clone(),
                name: "Episode 1".to_string(),
                scenes,
            },
        );

        let season_id = "s_1".to_string();
        seasons.insert(
            season_id.clone(),
            Season {
                id: season_id.clone(),
                name: "Season 1".to_string(),
                episodes,
            },
        );

        Self {
            name: "New Project".to_string(),
            width: 1920,
            height: 1080,
            seasons,
            characters: HashMap::new(),
            script_graphs: HashMap::new(),
            active_season_id: Some(season_id),
            active_episode_id: Some(episode_id),
            active_scene_id: Some(scene_id),
        }
    }
}
