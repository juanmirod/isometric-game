import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMap, TILE_TYPES, CLIMATE_TYPES, CLIMATE_TILE_RULES, TILE_COLORS, TerrainRenderer } from './terrain';

// Mock Phaser for testing
global.Phaser = {
  Display: {
    Color: {
      ValueToColor: (color) => ({
        darken: (amount) => ({ color: color - amount })
      })
    }
  }
};

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

  it('should only contain valid tile types and heights', () => {
    const { map } = generateMap(10, 10);
    map.flat().forEach(tile => {
      expect(Object.values(TILE_TYPES)).toContain(tile.type);
      expect(typeof tile.height).toBe('number');
      expect(tile.height).toBeGreaterThanOrEqual(0);
      expect(tile.height).toBeLessThanOrEqual(3);
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
        const hasGrass = result.map.some(row => row.some(tile => tile.type === TILE_TYPES.GRASS));
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
          row.some(tile => forbiddenTiles.includes(tile.type) && tile.type !== TILE_TYPES.WATER)
        );

        // Allow sand near water features, but otherwise no forbidden tiles
        if (hasForbiddenTiles) {
          // Check if forbidden tiles are only sand near water
          let onlyAllowedForbiddenTiles = true;
          for (let y = 0; y < result.map.length; y++) {
            for (let x = 0; x < result.map[y].length; x++) {
              const tile = result.map[y][x];
              if (forbiddenTiles.includes(tile.type) && tile.type !== TILE_TYPES.WATER) {
                // For prairie, sand is only allowed near water features
                if (tile.type === TILE_TYPES.SAND) {
                  // Check if near water
                  let nearWater = false;
                  for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                      const ny = y + dy;
                      const nx = x + dx;
                      if (ny >= 0 && ny < result.map.length &&
                        nx >= 0 && nx < result.map[ny].length &&
                        result.map[ny][nx].type === TILE_TYPES.WATER) {
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
    // Allow some variance due to randomness (±15%)
    expect(coastlineProbability).toBeGreaterThan(0.15);
    expect(coastlineProbability).toBeLessThan(0.45);
  });

  it('should have water tiles when rivers are present', () => {
    let riverMapFound = false;

    for (let i = 0; i < 30; i++) {
      const result = generateMap(20, 20);
      if (result.metadata.hasRiver) {
        riverMapFound = true;

        // Should have water tiles for the river
        const hasWater = result.map.some(row => row.some(tile => tile.type === TILE_TYPES.WATER));
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
        const hasWater = result.map.some(row => row.some(tile => tile.type === TILE_TYPES.WATER));
        expect(hasWater).toBeTruthy();
        break;
      }
    }

    expect(coastlineMapFound).toBeTruthy();
  });

  it('should assign correct heights to tiles', () => {
    const { map } = generateMap(10, 10);
    map.flat().forEach(tile => {
      if (tile.type === TILE_TYPES.SNOW) {
        expect(tile.height).toBe(2);
      } else if (tile.type === TILE_TYPES.ROCK) {
        expect([1, 2]).toContain(tile.height);
      } else {
        expect(tile.height).toBe(0);
      }
    });
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
      expect(count).toBeGreaterThan(expectedAverage * 0.4);
      expect(count).toBeLessThan(expectedAverage * 1.6);
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

describe('TerrainRenderer', () => {
  let mockScene;
  let mockGraphics;
  let mockContainer;
  let mockImage;
  let terrainRenderer;

  beforeEach(() => {
    // Mock graphics object
    mockGraphics = {
      fillStyle: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fillPath: vi.fn(),
      generateTexture: vi.fn(),
      destroy: vi.fn()
    };

    // Mock image object
    mockImage = {
      setOrigin: vi.fn()
    };

    // Mock container object
    mockContainer = {
      setDepth: vi.fn(),
      add: vi.fn()
    };

    // Mock scene object
    mockScene = {
      add: {
        graphics: vi.fn(() => mockGraphics),
        container: vi.fn(() => mockContainer),
        image: vi.fn(() => mockImage)
      },
      cameras: {
        main: {
          centerOn: vi.fn()
        }
      }
    };

    const config = {
      tileWidth: 128,
      tileHeight: 64,
      mapWidth: 10,
      mapHeight: 10,
      heightOffset: 20
    };

    terrainRenderer = new TerrainRenderer(mockScene, config);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(terrainRenderer.scene).toBe(mockScene);
      expect(terrainRenderer.tileWidth).toBe(128);
      expect(terrainRenderer.tileHeight).toBe(64);
      expect(terrainRenderer.mapWidth).toBe(10);
      expect(terrainRenderer.mapHeight).toBe(10);
      expect(terrainRenderer.heightOffset).toBe(20);
    });
  });

  describe('generateTileTextures', () => {
    it('should generate textures for all tile types', () => {
      terrainRenderer.generateTileTextures();

      const tileTypes = Object.keys(TILE_TYPES);
      expect(mockScene.add.graphics).toHaveBeenCalledTimes(tileTypes.length);
      expect(mockGraphics.generateTexture).toHaveBeenCalledTimes(tileTypes.length);
      expect(mockGraphics.destroy).toHaveBeenCalledTimes(tileTypes.length);
    });

    it('should create isometric diamond shape for each tile', () => {
      terrainRenderer.generateTileTextures();

      // Check that the graphics drawing commands create an isometric diamond
      expect(mockGraphics.beginPath).toHaveBeenCalled();
      expect(mockGraphics.moveTo).toHaveBeenCalledWith(0, 32); // Top point (tileHeight / 2)
      expect(mockGraphics.lineTo).toHaveBeenCalledWith(64, 0); // Right point (tileWidth / 2, 0)
      expect(mockGraphics.lineTo).toHaveBeenCalledWith(128, 32); // Bottom point (tileWidth, tileHeight / 2)
      expect(mockGraphics.lineTo).toHaveBeenCalledWith(64, 64); // Left point (tileWidth / 2, tileHeight)
      expect(mockGraphics.closePath).toHaveBeenCalled();
      expect(mockGraphics.fillPath).toHaveBeenCalled();
    });

    it('should set correct colors for each tile type', () => {
      terrainRenderer.generateTileTextures();

      const tileColors = Object.values(TILE_COLORS);
      tileColors.forEach(color => {
        expect(mockGraphics.fillStyle).toHaveBeenCalledWith(color, 1);
      });
    });
  });

  describe('renderMap', () => {
    let sampleMap;
    const mapCenterX = 400;
    const mapCenterY = 300;

    beforeEach(() => {
      // Create a small sample map for testing
      sampleMap = [
        [{ type: 'grass', height: 0 }, { type: 'rock', height: 1 }],
        [{ type: 'water', height: 0 }, { type: 'snow', height: 2 }]
      ];

      // Update renderer config for this test map
      terrainRenderer.mapWidth = 2;
      terrainRenderer.mapHeight = 2;
    });

    it('should create containers for each tile', () => {
      terrainRenderer.renderMap(sampleMap, mapCenterX, mapCenterY);

      expect(mockScene.add.container).toHaveBeenCalledTimes(4); // 2x2 map
    });

    it('should calculate correct isometric positions', () => {
      terrainRenderer.renderMap(sampleMap, mapCenterX, mapCenterY);

      // Check that containers are created with correct isometric coordinates
      const tileWidth = terrainRenderer.tileWidth;
      const tileHeight = terrainRenderer.tileHeight;

      // Expected positions for each tile
      const expectedPositions = [
        { x: mapCenterX + (0 - 0) * tileWidth / 2, y: mapCenterY + (0 + 0) * tileHeight / 2 - 0 },
        { x: mapCenterX + (1 - 0) * tileWidth / 2, y: mapCenterY + (1 + 0) * tileHeight / 2 - 20 },
        { x: mapCenterX + (0 - 1) * tileWidth / 2, y: mapCenterY + (0 + 1) * tileHeight / 2 - 0 },
        { x: mapCenterX + (1 - 1) * tileWidth / 2, y: mapCenterY + (1 + 1) * tileHeight / 2 - 40 }
      ];

      expectedPositions.forEach((pos, index) => {
        expect(mockScene.add.container).toHaveBeenNthCalledWith(index + 1, pos.x, pos.y);
      });
    });

    it('should set correct depth values based on tile position and height', () => {
      terrainRenderer.renderMap(sampleMap, mapCenterX, mapCenterY);

      // Verify that setDepth is called for each container
      expect(mockContainer.setDepth).toHaveBeenCalledTimes(4);

      // Check specific depth calculations for tiles with height
      expect(mockContainer.setDepth).toHaveBeenCalledWith(300); // grass at (0,0), height 0: tileY=300, depth=300+0=300
      expect(mockContainer.setDepth).toHaveBeenCalledWith(332); // rock at (1,0), height 1: tileY=312, depth=312+20=332
      expect(mockContainer.setDepth).toHaveBeenCalledWith(332); // water at (0,1), height 0: tileY=332, depth=332+0=332
      expect(mockContainer.setDepth).toHaveBeenCalledWith(364); // snow at (1,1), height 2: tileY=324, depth=324+40=364
    });

    it('should create tile top images for all tiles', () => {
      terrainRenderer.renderMap(sampleMap, mapCenterX, mapCenterY);

      // Should create one image per tile
      expect(mockScene.add.image).toHaveBeenCalledTimes(4);

      // Check that images are created with correct tile types
      expect(mockScene.add.image).toHaveBeenCalledWith(0, 0, 'grass');
      expect(mockScene.add.image).toHaveBeenCalledWith(0, 0, 'rock');
      expect(mockScene.add.image).toHaveBeenCalledWith(0, 0, 'water');
      expect(mockScene.add.image).toHaveBeenCalledWith(0, 0, 'snow');

      // Check that images are added to containers
      expect(mockContainer.add).toHaveBeenCalledWith(mockImage);
    });

    it('should render tile sides for elevated tiles', () => {
      terrainRenderer.renderMap(sampleMap, mapCenterX, mapCenterY);

      // Should create graphics for elevated tiles (rock and snow)
      // The exact number depends on neighbor relationships, but should be > 0
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should center camera on the rendered map', () => {
      terrainRenderer.renderMap(sampleMap, mapCenterX, mapCenterY);

      expect(mockScene.cameras.main.centerOn).toHaveBeenCalled();

      // Calculate expected camera center position
      const totalHeight = (terrainRenderer.mapWidth + terrainRenderer.mapHeight) * terrainRenderer.tileHeight / 2;
      const expectedX = mapCenterX;
      const expectedY = mapCenterY + totalHeight / 2 - terrainRenderer.tileHeight / 2;

      expect(mockScene.cameras.main.centerOn).toHaveBeenCalledWith(expectedX, expectedY);
    });

    it('should sort tiles in correct rendering order', () => {
      terrainRenderer.renderMap(sampleMap, mapCenterX, mapCenterY);

      // Since we mock the container creation, we can verify that containers are created
      // in the correct order (back to front for isometric rendering)
      expect(mockScene.add.container).toHaveBeenCalledTimes(4);

      // The sorting should ensure proper depth rendering
      // We can't easily test the internal sorting, but we can verify all tiles are processed
    });
  });

  describe('integration with map generation', () => {
    it('should work with generated map data', () => {
      const terrainData = generateMap(5, 5);

      // Create a new renderer with proper dimensions for this test
      const integrationRenderer = new TerrainRenderer(mockScene, {
        tileWidth: 128,
        tileHeight: 64,
        mapWidth: 5,
        mapHeight: 5,
        heightOffset: 20
      });

      // This should not throw any errors
      expect(() => {
        integrationRenderer.renderMap(terrainData.map, 400, 300);
      }).not.toThrow();
    });
  });
}); 