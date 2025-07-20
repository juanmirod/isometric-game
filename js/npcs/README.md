# NPC System

This module provides a comprehensive NPC (Non-Player Character) system for the isometric game, featuring intelligent state machines and automatic spawning.

## Features

### NPC Behavior

- **State Machine**: NPCs have two states:
  - `SEARCHING`: NPCs wander around looking for a nice place
  - `PLACE_FOUND`: NPCs stay put when they find a suitable location (final state)

### Movement System

- NPCs enter from valid border positions (sand or grass tiles only)
- Random movement in 4 directions (North, East, South, West) every 2 seconds
- NPCs avoid water and elevated terrain (rock/snow)
- Pathfinding respects map boundaries

### Place Evaluation

- NPCs check their current position every second when searching
- A "nice place" is defined as:
  - Sand or grass tile
  - At least one tree nearby (current tile or adjacent tiles)

### Visual Representation

- Red rectangles (20x30 pixels, shorter than trees)
- Proper isometric positioning with height support
- Correct depth sorting (NPCs appear above terrain and trees)

### Automatic Spawning

- Configurable maximum NPCs and spawn intervals
- Intelligent entry point selection from map borders
- Only spawns on accessible terrain (no water/elevated tiles)

## API Reference

### NPC Class

```javascript
// Create a new NPC
const npc = new NPC(id, scene, config);
```

#### Configuration Options

- `mapX`, `mapY`: Starting position
- `width`, `height`: NPC dimensions (default: 20x30)
- `color`: NPC color (default: red 0xff0000)
- `moveSpeed`: Time between moves in ms (default: 2000)
- `mapData`: Reference to terrain map
- `treeManager`: Reference to tree manager

#### Methods

- `update(time)`: Updates NPC logic (call every frame)
- `getState()`: Returns current state
- `getPosition()`: Returns {x, y} position
- `destroy()`: Removes NPC sprite

### NPCManager Class

```javascript
// Create NPC manager
const npcManager = new NPCManager(scene, config);
```

#### Configuration Options

- `maxNpcs`: Maximum number of NPCs (default: 5)
- `spawnInterval`: Time between spawns in ms (default: 10000)
- `mapData`: Reference to terrain map
- `treeManager`: Reference to tree manager

#### Methods

- `update(time)`: Updates all NPCs and handles spawning
- `spawnNPC()`: Manually spawn an NPC
- `getAllNPCs()`: Get all NPCs
- `getNPCsByState(state)`: Filter NPCs by state
- `getNPCCount()`: Get total NPC count
- `getStateCounts()`: Get count of NPCs in each state
- `removeNPC(id)`: Remove NPC by ID
- `clearAllNPCs()`: Remove all NPCs
- `updateSpawnConfig(config)`: Update spawn settings

## Usage Example

```javascript
import { NPCManager } from './npcs/npcs.js';

// In your game scene
create() {
  this.npcManager = new NPCManager(this, {
    mapWidth: 50,
    mapHeight: 50,
    mapData: terrainData.map,
    treeManager: this.treeManager,
    maxNpcs: 3,
    spawnInterval: 8000
  });
}

update(time) {
  this.npcManager.update(time);
}
```

## Integration

The NPC system integrates seamlessly with:

- **Terrain System**: Uses terrain data for movement validation and place evaluation
- **Tree System**: Evaluates tree proximity for "nice place" detection
- **Phaser Scene**: Handles sprite creation and rendering

## State Machine Diagram

```
[SEARCHING] ──────> [PLACE_FOUND]
    │ ^                  │
    │ │                  │
    │ └─ move every 2s    │
    │                     │
    └─ check position ────┘
       every 1s
```

## Testing

Comprehensive unit tests cover:

- NPC state transitions
- Movement validation
- Place evaluation logic
- Spawning mechanisms
- Manager functionality

Run tests with:

```bash
npm test js/npcs/npcs.test.js
```
