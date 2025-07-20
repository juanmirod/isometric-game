## 26/06/2025

Design problem: The project structure was not documented.
Design solution: Reviewed the project and added a `project-structure.md` file with a description of the project and the most important files.

## 29/06/2025

Design problem: The terrain generation was too simple (only using 2D noise) and all terrain-related code was in a single file without proper organization.
Design solution:

1. Enhanced terrain generation with sophisticated procedural generation including:
   - 5 climate types (desert, prairie, sparse forest, dense forest, high mountain)
   - River generation with 60% probability
   - Coastline generation with 30% probability
   - Climate-specific tile rules and restrictions
2. Reorganized terrain code into dedicated js/terrain/ folder with:
   - terrain.js: Main terrain generation logic
   - terrain.test.js: Comprehensive unit tests
   - README.md: Complete documentation of features and API

This improves code organization, maintainability, and creates much more varied and realistic terrain generation. The modular structure makes it easier to extend terrain features in the future.

## 30/06/2025

Design problem: Tree positioning logic was embedded in the main game loop, making it difficult to manage, track, and remove trees. Trees were created inline without any way to reference or delete them later for game actions.

Design solution: Extracted tree logic into a dedicated TreeManager class in js/trees/ folder with:

- trees.js: TreeManager class that handles tree positioning, tracking, and removal
- trees.test.js: Comprehensive unit tests for all tree management functionality
- README.md: Complete documentation of the tree management API

The TreeManager provides:

- Centralized tree spawning with configurable probability and rules
- Unique ID tracking for each tree to enable future removal
- Methods to remove trees by ID or coordinates
- Isometric coordinate conversion
- Tree count tracking and display

This separation allows for future game mechanics like tree harvesting, environmental changes, or resource management while keeping the main game loop clean and focused.

## 01/07/2025

Design problem: Tree positioning was too rigid with only one tree per tile positioned at the center, and tree density was constant regardless of terrain climate type. This made forests look unrealistic and didn't reflect the natural variation between different climate zones.

Design solution: Enhanced the TreeManager with climate-based generation system that includes:

- Climate-specific configurations for spawn probability, max trees per tile, and tree spacing
- Flexible positioning system allowing trees to spawn anywhere within tiles using random offsets
- Support for multiple trees per tile with no artificial limits
- Climate types: desert (2% probability, 1 tree max), prairie (15%, 2 trees max), sparse_forest (35%, 3 trees max), dense_forest (65%, 5 trees max), high_mountain (8%, 1 tree max)
- Added radius-based operations for getting and removing trees in areas
- Enhanced tree objects with screen coordinates and offset tracking

The system now creates much more realistic and varied forest layouts that properly reflect different climate zones, while maintaining the ability to track and manage all trees for future game mechanics.

## 01/07/2025

Design problem: The terrain was only represented by different colors with no visual height differences, making the isometric view flat and less engaging. Different terrain types like mountains and hills should have visual elevation.

Design solution: Enhanced the terrain system with height representation that includes:

- Added `TILE_HEIGHTS` configuration mapping tile types to height levels (0-2)
- Modified map generation to include height data alongside tile type (map tiles now store objects with `type` and `height` properties)
- Updated rendering system in main.js to position tiles vertically based on their height with 20px offset per level
- Implemented proper depth sorting to ensure higher tiles render above lower ones
- Updated TreeManager to position trees at correct heights matching their underlying tiles
- Height assignment rules: sand/grass/water at sea level (0), rock at levels 1-2 (noise-based), snow only at level 2
- Added comprehensive test coverage for height validation

This creates a much more visually appealing isometric terrain with proper elevation representation while maintaining backward compatibility with existing climate and feature generation systems.

**Update**: Fixed depth sorting issue where trees were rendering behind terrain tiles. Added proper depth calculation to tree sprites using the same formula as terrain tiles plus a large offset (+10000) to ensure trees always appear above their corresponding terrain. Updated all test mocks to include the setDepth method for proper test coverage.

## 03/07/2025

Design problem: The game needed NPCs (Non-Player Characters) that could autonomously navigate the terrain, enter from borders, and find suitable places to settle based on environmental conditions.

Design solution: Created a comprehensive NPC system with state machine architecture in js/npcs/ folder that includes:

- State Machine Implementation: NPCs have two states (SEARCHING and PLACE_FOUND) with clear transitions and behaviors
- Intelligent Movement: NPCs enter from valid border positions, move randomly every 2 seconds, and avoid water/elevated terrain
- Place Evaluation: NPCs check their position every second and settle when they find sand/grass tiles with nearby trees
- Visual Representation: Red rectangles (shorter than trees) with proper isometric positioning and depth sorting
- Automatic Management: NPCManager handles spawning, updates, and lifecycle management with configurable limits and intervals
- Comprehensive Testing: 43 unit tests covering all functionality including state transitions, movement validation, and spawning logic

The system integrates seamlessly with existing terrain and tree systems, using terrain data for movement validation and tree proximity for place evaluation. This creates dynamic, autonomous characters that interact meaningfully with the generated environment while maintaining clean separation of concerns.
