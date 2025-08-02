# Project Structure

This project is an isometric game built with Phaser.

## Files

- **`index.html`**: The main HTML file that serves as the entry point for the game. It sets up the basic HTML structure and includes the main JavaScript file.

- **`js/main.js`**: This is the core of the game. It initializes the Phaser game engine, sets up the game scene, and contains the main game loop. It handles rendering the map with height-based positioning and trees, implements proper depth sorting for isometric elevation, and manages camera controls for panning and zooming.

- **`js/const.js`**: Centralized constants file containing all global sizes, colors, and configuration values. This eliminates magic numbers and ensures consistent sizing across the entire codebase. Contains tile dimensions, tree/NPC sizes, colors, and terrain rendering constants.

- **`js/terrain/`**: This folder contains all terrain-related modules:

  - **`terrain.js`**: Advanced procedural terrain generation system with climate types, rivers, coastlines, sophisticated tile placement rules, and height representation (0-2 levels) for true isometric elevation. Also contains the TerrainRenderer class that handles all terrain rendering logic including tile texture generation and 3D isometric map rendering with proper depth sorting.
  - **`terrain.test.js`**: Comprehensive unit tests for both the terrain generation system and TerrainRenderer class, including height validation, rendering logic, depth calculations, and integration tests
  - **`README.md`**: Detailed documentation of the terrain generation features and API

- **`js/tree.js`**: This module generates textures for the trees in the game. It provides a function to create tree textures with customizable options, such as the shape and color of the leaves.

- **`js/trees/`**: This folder contains the advanced tree management system:

  - **`trees.js`**: Enhanced TreeManager class with climate-based generation, flexible positioning, multiple trees per tile, and radius-based operations
  - **`trees.test.js`**: Comprehensive unit tests covering climate configurations, tree positioning, and removal operations
  - **`README.md`**: Complete documentation of the climate-based tree generation API and features

- **`js/npcs/`**: This folder contains the NPC (Non-Player Character) system:

  - **`npcs.js`**: NPC and NPCManager classes implementing state machine behavior, intelligent spawning, and smooth, tween-based movement for NPCs that search for nice places near trees
  - **`npcs.test.js`**: Comprehensive unit tests covering NPC state transitions, movement validation, place evaluation, and manager functionality
  - **`README.md`**: Complete documentation of the NPC system API, state machines, and integration guide

- **`vite.config.js`**: This is the configuration file for Vite, a modern build tool that provides a faster and leaner development experience for web projects.

- **`package.json`**: This file manages the project's dependencies, such as Phaser and simplex-noise, and defines scripts for running and building the project.
