# Terrain Generation System

This module implements a sophisticated procedural terrain generation system that creates varied and realistic terrain types for the isometric game.

## Features

### Climate System

The terrain generation implements 5 distinct climate types, each with unique characteristics:

- **Desert**: No grass tiles, primarily sand and rock formations
- **Prairie**: No rock/sand/snow except near water features, grass-dominant landscapes
- **Sparse Forest**: No sand tiles, grass-dominant with rocks at higher elevations
- **Dense Forest**: No sand tiles, more grass coverage with rocky outcrops
- **High Mountain**: No sand tiles, rock-dominant terrain with snow peaks at high elevations

### Water Features

#### Rivers (60% probability)

- Generated as winding paths from top to bottom of the map
- Create natural water corridors with surrounding influence on tile types
- Affect nearby terrain by allowing sand tiles in certain climates

#### Coastlines (30% probability)

- Randomly positioned on one of the four map edges
- Create realistic coastal terrain with water extending inland
- Generate sandy beaches adjacent to water areas

### Terrain Rules

Each climate type enforces specific tile frequency rules:

- **Desert**: Forbidden grass tiles, focuses on sand and rock distribution
- **Prairie**: Forbidden rock, sand, and snow tiles (except near water), emphasizes grasslands
- **Forest types**: Forbidden sand tiles, balance grass and rock based on elevation
- **High Mountain**: Forbidden sand tiles, emphasizes rock and snow distribution

### Special Tile Placement

- Sand tiles appear near coastlines regardless of climate
- Sand tiles can appear near rivers in desert and prairie climates
- Water features take priority over all other terrain rules
- Elevation-based tile selection using Simplex noise

## API

### `generateMap(width, height)`

Generates a complete terrain map with associated metadata.

**Parameters:**

- `width` (number): Map width in tiles
- `height` (number): Map height in tiles

**Returns:**

```javascript
{
  map: Array<Array<string>>, // 2D array of tile types
  metadata: {
    climate: string,      // Selected climate type
    hasRiver: boolean,    // Whether map includes a river
    hasCoastline: boolean // Whether map includes a coastline
  }
}
```

### Constants

- `TILE_TYPES`: Available tile types (water, sand, grass, rock, snow)
- `TILE_COLORS`: Color mappings for each tile type
- `CLIMATE_TYPES`: Available climate types
- `CLIMATE_TILE_RULES`: Rules and thresholds for each climate type

## Implementation Details

The system uses Simplex noise as the base for terrain elevation, then applies multiple layers of logic:

1. **Climate Selection**: Random selection from available climate types
2. **Feature Generation**: Probabilistic generation of rivers and coastlines
3. **Base Terrain**: Noise-based elevation mapping
4. **Climate Rules**: Application of climate-specific tile restrictions
5. **Water Feature Integration**: Overlay of rivers and coastlines
6. **Proximity Effects**: Sand placement near water features
