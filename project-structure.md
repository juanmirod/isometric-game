# Project Structure

This project is an isometric game built with Phaser.

## Files

- **`index.html`**: The main HTML file that serves as the entry point for the game. It sets up the basic HTML structure and includes the main JavaScript file.

- **`js/main.js`**: This is the core of the game. It initializes the Phaser game engine, sets up the game scene, and contains the main game loop. It handles rendering the map and trees, and manages camera controls for panning and zooming.

- **`js/terrain/`**: This folder contains all terrain-related modules:

  - **`terrain.js`**: Advanced procedural terrain generation system with climate types, rivers, coastlines, and sophisticated tile placement rules
  - **`terrain.test.js`**: Comprehensive unit tests for the terrain generation system
  - **`README.md`**: Detailed documentation of the terrain generation features and API

- **`js/tree.js`**: This module generates textures for the trees in the game. It provides a function to create tree textures with customizable options, such as the shape and color of the leaves.

- **`vite.config.js`**: This is the configuration file for Vite, a modern build tool that provides a faster and leaner development experience for web projects.

- **`package.json`**: This file manages the project's dependencies, such as Phaser and simplex-noise, and defines scripts for running and building the project.
