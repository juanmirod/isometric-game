# Isometric Game Template

A simple project template for an isometric 2D game using the Phaser engine.

## Features

- Randomly generated terrain using Simplex noise.
- Basic camera controls (pan with arrow keys).
- No external assets needed - tile and tree textures are generated at runtime.

## Testing

This project includes comprehensive unit tests using Vitest. The test suite covers:

- **Terrain Generation**: Procedural terrain with multiple climate types, rivers, and coastlines
- **Tree Management**: Tree spawning, positioning, and removal with climate-based distribution
- **NPC System**: Autonomous NPCs with state machines, pathfinding, and settlement behavior

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

1. **Console Output**: Immediate summary in your terminal
2. **HTML Report**: Open `coverage/index.html` in your browser for detailed, interactive coverage analysis
3. **JSON Report**: Machine-readable coverage data in `coverage/coverage-final.json`

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
