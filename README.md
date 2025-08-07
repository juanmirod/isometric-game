# Isometric Game

This is an experimental project by @juanmirod. It is not a template or a finished game or even a PoC, maybe at some point there will be mechanics or some interactivity, but the main purpose it to do a personal experiment on how far I can take the project using only agentic development.

Contributions to the code are not possible, but comments, suggestions and praise in the form of issues are welcome.

## Game Elements

The game world is procedurally generated and consists of the following elements:

### Terrain

The terrain is generated using Simplex noise and features:
- **5 Climate Types**: Desert, Prairie, Sparse Forest, Dense Forest, and High Mountain.
- **Rivers and Coastlines**: Generated with a certain probability to create more varied landscapes.
- **3D Tiles**: The terrain is rendered with 3D tiles, giving it a sense of depth and elevation.

### Trees

Trees are procedurally generated and distributed across the map based on the climate:
- **Climate-based Distribution**: Tree density and type are determined by the climate of the area.
- **Randomized Positioning**: Trees are randomly positioned within tiles to create a more natural look.

### NPCs

Non-Player Characters (NPCs) are autonomous agents that:
- **Navigate the World**: NPCs can move around the map, avoiding obstacles like water and mountains.
- **Settle Down**: When an NPC finds a suitable location (a grassy area with trees), it will settle down and build a tent.
- **Smooth Movement**: NPCs move smoothly between tiles using tweens.

### Tents

Tents are created by NPCs when they settle down:
- **Static Objects**: Tents are static objects that remain in the game world.
- **Visual Cue**: They serve as a visual representation of an NPC's settlement.

## Design Decisions

For a more in-depth understanding of the project's evolution, you can review the [design decisions log](design-decisions-log.md).

## Testing

This project includes comprehensive unit tests using Vitest. The test suite covers:

- **Terrain Generation**: Procedural terrain with multiple climate types, rivers, and coastlines
- **Tree Management**: Tree spawning, positioning, and removal with climate-based distribution
- **NPC System**: Autonomous NPCs with state machines, pathfinding, and settlement behavior
- **Tent System**: Tent creation, positioning, and management.

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

### Code Coverage

Generate and view code coverage reports:

```bash
# Generate coverage report
npm run coverage
```

This generates three types of coverage reports:

1.  **Console Output**: Immediate summary in your terminal
2.  **HTML Report**: Open `coverage/index.html` in your browser for detailed, interactive coverage analysis
3.  **JSON Report**: Machine-readable coverage data in `coverage/coverage-final.json`

## How to run

1.  Install dependencies:

    ```bash
    npm install
    ```

2.  Start the development server:

    ```bash
    npm start
    ```

3.  Open your browser and navigate to `http://localhost:5173` (the port may vary, check the output of the `npm start` command).

## Building for production

```bash
npm run build
```