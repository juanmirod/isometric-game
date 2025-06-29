import { describe, it, expect } from 'vitest';
import { generateMap, TILE_TYPES, CLIMATE_TYPES, CLIMATE_TILE_RULES } from './terrain';

describe('generateMap', () => {
  it('should generate a map with the correct dimensions', () => {
    const width = 10;
    const height = 10;
    const result = generateMap(width, height);

    expect(result).toHaveProperty('map');
    expect(result).toHaveProperty('metadata');
    expect(result.map).toHaveLength(height);
    result.map.forEach(row => {
      expect(row).toHaveLength(width);
    });
  });

  it('should only contain valid tile types', () => {
    const width = 10;
    const height = 10;
    const result = generateMap(width, height);
    const validTileTypes = Object.values(TILE_TYPES);

    result.map.forEach(row => {
      row.forEach(tile => {
        expect(validTileTypes).toContain(tile);
      });
    });
  });

  it('should include metadata with climate, river, and coastline information', () => {
    const width = 10;
    const height = 10;
    const result = generateMap(width, height);

    expect(result.metadata).toHaveProperty('climate');
    expect(result.metadata).toHaveProperty('hasRiver');
    expect(result.metadata).toHaveProperty('hasCoastline');
    expect(Object.values(CLIMATE_TYPES)).toContain(result.metadata.climate);
    expect(typeof result.metadata.hasRiver).toBe('boolean');
    expect(typeof result.metadata.hasCoastline).toBe('boolean');
  });

  it('should respect climate tile rules for desert terrain', () => {
    // Generate multiple maps to test climate rules
    let desertMapFound = false;

    for (let i = 0; i < 50; i++) {
      const result = generateMap(10, 10);
      if (result.metadata.climate === CLIMATE_TYPES.DESERT) {
        desertMapFound = true;

        // Desert should have no grass tiles (except near water features)
        const hasGrass = result.map.some(row => row.some(tile => tile === TILE_TYPES.GRASS));
        // If there's grass, it should be because of water features
        expect(hasGrass).toBeFalsy();
        break;
      }
    }

    // This test might occasionally fail due to randomness, but should pass most of the time
    expect(desertMapFound).toBeTruthy();
  });

  it('should respect climate tile rules for prairie terrain', () => {
    let prairieMapFound = false;

    for (let i = 0; i < 50; i++) {
      const result = generateMap(10, 10);
      if (result.metadata.climate === CLIMATE_TYPES.PRAIRIE) {
        prairieMapFound = true;

        // Prairie should have no rock, sand, or snow tiles (except near water features)
        const forbiddenTiles = [TILE_TYPES.ROCK, TILE_TYPES.SAND, TILE_TYPES.SNOW];
        const hasForbiddenTiles = result.map.some(row =>
          row.some(tile => forbiddenTiles.includes(tile) && tile !== TILE_TYPES.WATER)
        );

        // Allow sand near water features, but otherwise no forbidden tiles
        if (hasForbiddenTiles) {
          // Check if forbidden tiles are only sand near water
          let onlyAllowedForbiddenTiles = true;
          for (let y = 0; y < result.map.length; y++) {
            for (let x = 0; x < result.map[y].length; x++) {
              const tile = result.map[y][x];
              if (forbiddenTiles.includes(tile) && tile !== TILE_TYPES.WATER) {
                // For prairie, sand is only allowed near water features
                if (tile === TILE_TYPES.SAND) {
                  // Check if near water
                  let nearWater = false;
                  for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                      const ny = y + dy;
                      const nx = x + dx;
                      if (ny >= 0 && ny < result.map.length &&
                        nx >= 0 && nx < result.map[ny].length &&
                        result.map[ny][nx] === TILE_TYPES.WATER) {
                        nearWater = true;
                        break;
                      }
                    }
                    if (nearWater) break;
                  }
                  if (!nearWater) {
                    onlyAllowedForbiddenTiles = false;
                  }
                } else {
                  onlyAllowedForbiddenTiles = false;
                }
              }
            }
          }
          expect(onlyAllowedForbiddenTiles).toBeTruthy();
        }
        break;
      }
    }

    expect(prairieMapFound).toBeTruthy();
  });

  it('should generate rivers with approximately 60% probability', () => {
    const samples = 100;
    let riverCount = 0;

    for (let i = 0; i < samples; i++) {
      const result = generateMap(10, 10);
      if (result.metadata.hasRiver) {
        riverCount++;
      }
    }

    const riverProbability = riverCount / samples;
    // Allow some variance due to randomness (±15%)
    expect(riverProbability).toBeGreaterThan(0.45);
    expect(riverProbability).toBeLessThan(0.75);
  });

  it('should generate coastlines with approximately 30% probability', () => {
    const samples = 100;
    let coastlineCount = 0;

    for (let i = 0; i < samples; i++) {
      const result = generateMap(10, 10);
      if (result.metadata.hasCoastline) {
        coastlineCount++;
      }
    }

    const coastlineProbability = coastlineCount / samples;
    // Allow some variance due to randomness (±10%)
    expect(coastlineProbability).toBeGreaterThan(0.20);
    expect(coastlineProbability).toBeLessThan(0.40);
  });

  it('should have water tiles when rivers are present', () => {
    let riverMapFound = false;

    for (let i = 0; i < 30; i++) {
      const result = generateMap(20, 20);
      if (result.metadata.hasRiver) {
        riverMapFound = true;

        // Should have water tiles for the river
        const hasWater = result.map.some(row => row.includes(TILE_TYPES.WATER));
        expect(hasWater).toBeTruthy();
        break;
      }
    }

    expect(riverMapFound).toBeTruthy();
  });

  it('should have water tiles when coastlines are present', () => {
    let coastlineMapFound = false;

    for (let i = 0; i < 30; i++) {
      const result = generateMap(20, 20);
      if (result.metadata.hasCoastline) {
        coastlineMapFound = true;

        // Should have water tiles for the coastline
        const hasWater = result.map.some(row => row.includes(TILE_TYPES.WATER));
        expect(hasWater).toBeTruthy();
        break;
      }
    }

    expect(coastlineMapFound).toBeTruthy();
  });

  it('should distribute climate types roughly evenly', () => {
    const samples = 100;
    const climateCounts = {};

    for (let i = 0; i < samples; i++) {
      const result = generateMap(10, 10);
      const climate = result.metadata.climate;
      climateCounts[climate] = (climateCounts[climate] || 0) + 1;
    }

    // Each climate should appear at least a few times
    const climateTypes = Object.values(CLIMATE_TYPES);
    climateTypes.forEach(climate => {
      expect(climateCounts[climate]).toBeGreaterThan(0);
    });

    // No single climate should dominate too much (should be roughly equal distribution)
    const expectedAverage = samples / climateTypes.length;
    Object.values(climateCounts).forEach(count => {
      expect(count).toBeGreaterThan(expectedAverage * 0.5);
      expect(count).toBeLessThan(expectedAverage * 1.5);
    });
  });
});

describe('CLIMATE_TILE_RULES', () => {
  it('should have rules for all climate types', () => {
    const climateTypes = Object.values(CLIMATE_TYPES);
    climateTypes.forEach(climate => {
      expect(CLIMATE_TILE_RULES).toHaveProperty(climate);
      expect(CLIMATE_TILE_RULES[climate]).toHaveProperty('forbidden');
      expect(CLIMATE_TILE_RULES[climate]).toHaveProperty('primary');
      expect(CLIMATE_TILE_RULES[climate]).toHaveProperty('secondary');
      expect(CLIMATE_TILE_RULES[climate]).toHaveProperty('thresholds');
    });
  });

  it('should have valid tile types in rules', () => {
    const validTileTypes = Object.values(TILE_TYPES);

    Object.values(CLIMATE_TILE_RULES).forEach(rule => {
      expect(validTileTypes).toContain(rule.primary);
      expect(validTileTypes).toContain(rule.secondary);
      rule.forbidden.forEach(tileType => {
        expect(validTileTypes).toContain(tileType);
      });
    });
  });
}); 