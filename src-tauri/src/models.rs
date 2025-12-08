use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub scenes: HashMap<String, Scene>,
    pub characters: HashMap<String, Character>,
    #[serde(default)] // Allow loading old projects without this field
    pub script_graphs: HashMap<String, ScriptGraph>,
    pub active_scene_id: Option<String>,
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
#[serde(rename_all = "lowercase")]
pub enum ElementType {
    Text,
    Image,
    Choice,
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
    pub content: String, // Text content or image path
    pub z_index: i32,
    pub properties: HashMap<String, String>, // Flexible property storage
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
#[serde(rename_all = "kebab-case")] // e.g. "dialogue-node", "choice-node"
pub enum NodeType {
    Start,
    Dialogue,
    Choice,
    Jump,
    SetFlag,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScriptNode {
    pub id: String,
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
        Self {
            name: "New Project".to_string(),
            width: 1920,
            height: 1080,
            scenes: HashMap::new(),
            characters: HashMap::new(),
            script_graphs: HashMap::new(),
            active_scene_id: None,
        }
    }
}
