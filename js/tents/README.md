# Tent System

The tent system manages static tent objects that NPCs create when they find a nice place to settle.

## Features

- **Static Objects**: Tents are static 60x60 yellow squares that don't move or change once created
- **NPC Placement**: NPCs automatically create tents when they transition to PLACE_FOUND state
- **Positioning**: Tents are placed to the right of the NPC's position in map coordinates
- **Visual Integration**: Proper isometric rendering and depth sorting with the terrain and other objects

## Classes

### Tent

Individual tent object with:

- Static positioning based on creation coordinates
- Yellow square visual representation (60x60 pixels)
- Proper isometric coordinate conversion
- Depth sorting for correct rendering order

### TentManager

Manages all tents in the game:

- Tracks all created tents with unique IDs
- Handles tent creation and destruction
- Provides methods to query tent positions and counts
- Integrates with the game's object management system

## API

### Tent Class Methods

- `constructor(id, scene, config)` - Creates a new tent
- `destroy()` - Removes the tent from the scene
- `getPosition()` - Returns tent's map coordinates
- `getId()` - Returns tent's unique identifier

### TentManager Class Methods

- `constructor(scene, config)` - Initializes the tent manager
- `createTent(mapX, mapY)` - Creates a new tent at specified coordinates
- `getAllTents()` - Returns array of all tents
- `getTentCount()` - Returns total number of tents
- `removeTent(tentId)` - Removes a specific tent
- `clearAllTents()` - Removes all tents
- `getTerrainAt(mapX, mapY)` - Gets tents at specific coordinates

## Integration

The tent system integrates with:

- **NPCs**: NPCs create tents when they settle
- **Terrain**: Tents use terrain height data for proper positioning
- **Main Scene**: TentManager is managed by the main game scene
