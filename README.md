# Nova Engine

**Nova Engine** is a powerful, modern visual novel creation tool built with **Tauri**, **Vue 3**, and **TypeScript**. It combines a visual scene editor with a node-based scripting system to make storytelling interactive and easy.

## Features

- 🎭 **Visual Scene Editor**: Drag-and-drop elements to compose your scenes.
- 🔗 **Node-Based Scripting**: Create complex dialogue flows and logic visually.
- 📂 **Hierarchical Project Structure**: Organize content into Seasons, Episodes, and Pages.
- ⚡ **High Performance**: Built on Rust (Tauri) for native performance with a web-tech UI.
- 🎨 **Modern UI**: Sleek, glassmorphism-inspired interface.

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Vite
- **Backend/Shell**: Tauri (Rust)
- **State Management**: Vue Composables

## Getting Started

### Prerequisites

- Node.js (v16+)
- Rust (latest stable)
- WebView2 (pre-installed on Windows 11)

### Development

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/nova-engine.git
    cd nova-engine
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run in development mode:
    ```bash
    npm run tauri dev
    ```

## Building

To build the application for production:

```bash
npm run tauri build
```

## License

MIT
