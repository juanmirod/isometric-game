# Trees Module

This module provides a comprehensive tree management system for the isometric game. It handles tree positioning, tracking, and removal operations.

## Features

- **Tree Generation**: Automatically generates trees on appropriate terrain tiles
- **Tree Tracking**: Maintains a list of all trees with unique identifiers
- **Tree Removal**: Support for removing trees by ID or coordinates
- **Isometric Positioning**: Handles conversion from map coordinates to isometric screen coordinates
- **Configurable Spawn Rules**: Customizable tree spawn probability and tile restrictions
- **Multiple Tree Types**: Support for different tree textures

## API Reference

### TreeManager Class

#### Constructor

```javascript
new TreeManager(scene, config);
```

**Parameters:**

- `scene` (Phaser.Scene): The Phaser scene instance
- `config` (Object): Configuration options
  - `mapWidth` (number): Width of the map in tiles (default: 50)
  - `mapHeight` (number): Height of the map in tiles (default: 50)
  - `tileWidth` (number): Width of each tile in pixels (default: 128)
  - `tileHeight` (number): Height of each tile in pixels (default: 64)
  - `mapCenterX` (number): X center position of the map
  - `mapCenterY` (number): Y center position of the map

#### Methods

##### Tree Generation

- **`generateTrees(map)`**: Generates trees across the entire map based on terrain data
- **`spawnTree(mapX, mapY)`**: Spawns a single tree at specific map coordinates

##### Tree Removal

- **`removeTreeById(treeId)`**: Removes a tree by its unique ID
- **`removeTreeAt(mapX, mapY)`**: Removes a tree at specific map coordinates
- **`clearAllTrees()`**: Removes all trees from the map

##### Tree Querying

- **`getTreeAt(mapX, mapY)`**: Gets the tree object at specific coordinates
- **`getAllTrees()`**: Returns a copy of all tree objects
- **`getTreeCount()`**: Returns the total number of trees

##### Configuration

- **`setSpawnProbability(probability)`**: Sets the probability of tree spawning (0-1)
- **`addTreeType(treeType)`**: Adds a new tree texture type to the available types

##### Utility

- **`mapToIsometric(mapX, mapY)`**: Converts map coordinates to isometric screen coordinates
- **`canSpawnTreeOnTile(tileType)`**: Checks if a tree can spawn on a given tile type

## Tree Object Structure

Each tree is represented by an object with the following properties:

```javascript
{
  sprite: Phaser.GameObjects.Image,  // The Phaser sprite object
  mapX: number,                      // X coordinate on the map grid
  mapY: number,                      // Y coordinate on the map grid
  type: string,                      // Tree texture type (e.g., 'tree_1')
  id: string                         // Unique identifier
}
```

## Usage Example

```javascript
import { TreeManager } from "./trees/trees.js";

// Initialize tree manager
const treeManager = new TreeManager(this, {
  mapWidth: 50,
  mapHeight: 50,
  tileWidth: 128,
  tileHeight: 64,
});

// Generate trees based on terrain map
const terrainMap = generateMap(50, 50);
treeManager.generateTrees(terrainMap.map);

// Spawn a specific tree
const tree = treeManager.spawnTree(10, 15);

// Remove tree by coordinates
treeManager.removeTreeAt(10, 15);

// Remove tree by ID
treeManager.removeTreeById(tree.id);

// Get tree count
console.log(`Total trees: ${treeManager.getTreeCount()}`);
```

## Spawn Rules

- Trees can only spawn on `grass` tiles
- Default spawn probability is 20% (0.2)
- Tree types are randomly selected from available types
- Each tree gets a unique ID for tracking

## Testing

The module includes comprehensive unit tests covering all functionality. Run tests with:

```bash
npm test
```
