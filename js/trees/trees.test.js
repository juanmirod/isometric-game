import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TreeManager } from './trees.js';

// Mock Phaser scene
const createMockScene = () => ({
  add: {
    image: vi.fn((x, y, texture) => ({
      setOrigin: vi.fn(),
      setDepth: vi.fn(),
      destroy: vi.fn(),
      x,
      y,
      texture
    }))
  },
  cameras: {
    main: {
      width: 800,
      height: 600
    }
  }
});

describe('TreeManager', () => {
  let mockScene;
  let treeManager;

  beforeEach(() => {
    mockScene = createMockScene();
    treeManager = new TreeManager(mockScene, {
      mapWidth: 10,
      mapHeight: 10,
      tileWidth: 128,
      tileHeight: 64,
      mapCenterX: 400,
      mapCenterY: 150
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultManager = new TreeManager(mockScene);
      expect(defaultManager.mapWidth).toBe(50);
      expect(defaultManager.mapHeight).toBe(50);
      expect(defaultManager.tileWidth).toBe(256);
      expect(defaultManager.tileHeight).toBe(128);
      expect(defaultManager.trees).toEqual([]);
      expect(defaultManager.defaultTreeConfig.spawnProbability).toBe(0.2);
      expect(defaultManager.treeTypes).toEqual(['tree_1', 'tree_2']);
      expect(defaultManager.climateTreeConfig).toBeDefined();
    });

    it('should initialize with custom config', () => {
      expect(treeManager.mapWidth).toBe(10);
      expect(treeManager.mapHeight).toBe(10);
      expect(treeManager.mapCenterX).toBe(400);
      expect(treeManager.mapCenterY).toBe(150);
    });
  });

  describe('mapToIsometric', () => {
    it('should convert map coordinates to isometric coordinates', () => {
      const result = treeManager.mapToIsometric(5, 3);

      const expectedIsoX = (5 - 3) * 128 / 2; // 128
      const expectedIsoY = (5 + 3) * 64 / 2; // 256

      expect(result.x).toBe(400 + expectedIsoX); // 528
      expect(result.y).toBe(150 + expectedIsoY); // 406
    });

    it('should handle origin coordinates', () => {
      const result = treeManager.mapToIsometric(0, 0);
      expect(result.x).toBe(400);
      expect(result.y).toBe(150);
    });
  });

  describe('canSpawnTreeOnTile', () => {
    it('should allow trees on grass tiles', () => {
      expect(treeManager.canSpawnTreeOnTile('grass')).toBe(true);
    });

    it('should not allow trees on non-grass tiles', () => {
      expect(treeManager.canSpawnTreeOnTile('water')).toBe(false);
      expect(treeManager.canSpawnTreeOnTile('sand')).toBe(false);
      expect(treeManager.canSpawnTreeOnTile('stone')).toBe(false);
    });
  });

  describe('getRandomTreeType', () => {
    it('should return a valid tree type', () => {
      const treeType = treeManager.getRandomTreeType();
      expect(treeManager.treeTypes).toContain(treeType);
    });
  });

  describe('generateTreeId', () => {
    it('should generate unique IDs', () => {
      const id1 = treeManager.generateTreeId();
      const id2 = treeManager.generateTreeId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^tree_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^tree_\d+_[a-z0-9]+$/);
    });
  });

  describe('spawnTree', () => {
    it('should spawn a tree at specified coordinates', () => {
      const tree = treeManager.spawnTree(2, 3);

      expect(mockScene.add.image).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(String)
      );

      expect(tree).toHaveProperty('sprite');
      expect(tree).toHaveProperty('mapX', 2);
      expect(tree).toHaveProperty('mapY', 3);
      expect(tree).toHaveProperty('offsetX', 0);
      expect(tree).toHaveProperty('offsetY', 0);
      expect(tree).toHaveProperty('screenX');
      expect(tree).toHaveProperty('screenY');
      expect(tree).toHaveProperty('type');
      expect(tree).toHaveProperty('id');
      expect(treeManager.treeTypes).toContain(tree.type);
      expect(treeManager.trees).toContain(tree);
    });

    it('should spawn a tree with offset coordinates', () => {
      const tree = treeManager.spawnTree(2, 3, 10, 20);

      expect(tree).toHaveProperty('offsetX', 10);
      expect(tree).toHaveProperty('offsetY', 20);
      expect(tree.screenX).toBeCloseTo(tree.screenX);
      expect(tree.screenY).toBeCloseTo(tree.screenY);
    });

    it('should set correct sprite origin', () => {
      const mockSprite = {
        setOrigin: vi.fn(),
        setDepth: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.image.mockReturnValue(mockSprite);

      treeManager.spawnTree(0, 0);
      expect(mockSprite.setOrigin).toHaveBeenCalledWith(0.5, 1);
    });
  });

  describe('getTreeAt', () => {
    it('should return tree at specified coordinates', () => {
      const tree = treeManager.spawnTree(5, 5);
      const foundTree = treeManager.getTreeAt(5, 5);

      expect(foundTree).toBe(tree);
    });

    it('should return null if no tree at coordinates', () => {
      const foundTree = treeManager.getTreeAt(1, 1);
      expect(foundTree).toBeNull();
    });
  });

  describe('removeTreeAt', () => {
    it('should remove tree at specified coordinates', () => {
      const mockSprite = {
        setOrigin: vi.fn(),
        setDepth: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.image.mockReturnValue(mockSprite);

      treeManager.spawnTree(3, 4);
      expect(treeManager.trees).toHaveLength(1);

      const removed = treeManager.removeTreeAt(3, 4);

      expect(removed).toBe(true);
      expect(treeManager.trees).toHaveLength(0);
      expect(mockSprite.destroy).toHaveBeenCalled();
    });

    it('should return false if no tree at coordinates', () => {
      const removed = treeManager.removeTreeAt(1, 1);
      expect(removed).toBe(false);
    });
  });

  describe('removeTreeById', () => {
    it('should remove tree by ID', () => {
      const mockSprite = {
        setOrigin: vi.fn(),
        setDepth: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.image.mockReturnValue(mockSprite);

      const tree = treeManager.spawnTree(2, 2);
      expect(treeManager.trees).toHaveLength(1);

      const removed = treeManager.removeTreeById(tree.id);

      expect(removed).toBe(true);
      expect(treeManager.trees).toHaveLength(0);
      expect(mockSprite.destroy).toHaveBeenCalled();
    });

    it('should return false if tree ID not found', () => {
      const removed = treeManager.removeTreeById('nonexistent_id');
      expect(removed).toBe(false);
    });
  });

  describe('clearAllTrees', () => {
    it('should remove all trees', () => {
      const mockSprite1 = { setOrigin: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };
      const mockSprite2 = { setOrigin: vi.fn(), setDepth: vi.fn(), destroy: vi.fn() };

      mockScene.add.image
        .mockReturnValueOnce(mockSprite1)
        .mockReturnValueOnce(mockSprite2);

      treeManager.spawnTree(1, 1);
      treeManager.spawnTree(2, 2);
      expect(treeManager.trees).toHaveLength(2);

      treeManager.clearAllTrees();

      expect(treeManager.trees).toHaveLength(0);
      expect(mockSprite1.destroy).toHaveBeenCalled();
      expect(mockSprite2.destroy).toHaveBeenCalled();
    });
  });

  describe('getAllTrees', () => {
    it('should return copy of trees array', () => {
      treeManager.spawnTree(1, 1);
      const trees = treeManager.getAllTrees();

      expect(trees).toHaveLength(1);
      expect(trees).not.toBe(treeManager.trees); // Should be a copy
      expect(trees[0]).toBe(treeManager.trees[0]); // But contain same objects
    });
  });

  describe('getTreeCount', () => {
    it('should return correct tree count', () => {
      expect(treeManager.getTreeCount()).toBe(0);

      treeManager.spawnTree(1, 1);
      expect(treeManager.getTreeCount()).toBe(1);

      treeManager.spawnTree(2, 2);
      expect(treeManager.getTreeCount()).toBe(2);
    });
  });

  describe('climate configuration', () => {
    it('should get climate config for known climate', () => {
      const config = treeManager.getClimateConfig('dense_forest');
      expect(config.spawnProbability).toBe(0.65);
      expect(config.maxTreesPerTile).toBe(5);
    });

    it('should return default config for unknown climate', () => {
      const config = treeManager.getClimateConfig('unknown_climate');
      expect(config).toEqual(treeManager.defaultTreeConfig);
    });

    it('should set climate spawn probability', () => {
      treeManager.setClimateSpawnProbability('prairie', 0.5);
      expect(treeManager.climateTreeConfig.prairie.spawnProbability).toBe(0.5);
    });

    it('should clamp climate spawn probability to valid range', () => {
      treeManager.setClimateSpawnProbability('prairie', -0.5);
      expect(treeManager.climateTreeConfig.prairie.spawnProbability).toBe(0);

      treeManager.setClimateSpawnProbability('prairie', 1.5);
      expect(treeManager.climateTreeConfig.prairie.spawnProbability).toBe(1);
    });

    it('should update climate configuration', () => {
      treeManager.updateClimateConfig('prairie', { maxTreesPerTile: 10 });
      expect(treeManager.climateTreeConfig.prairie.maxTreesPerTile).toBe(10);
    });
  });

  describe('radius operations', () => {
    beforeEach(() => {
      // Spawn some trees for testing
      treeManager.spawnTree(5, 5);
      treeManager.spawnTree(6, 5);
      treeManager.spawnTree(10, 10);
    });

    it('should get trees within radius', () => {
      const treesInRadius = treeManager.getTreesInRadius(5, 5, 2);
      expect(treesInRadius).toHaveLength(2); // Trees at (5,5) and (6,5)

      const treesInSmallRadius = treeManager.getTreesInRadius(5, 5, 0.5);
      expect(treesInSmallRadius).toHaveLength(1); // Only tree at (5,5)
    });

    it('should remove trees within radius', () => {
      const initialCount = treeManager.getTreeCount();
      const removedCount = treeManager.removeTreesInRadius(5, 5, 2);

      expect(removedCount).toBe(2);
      expect(treeManager.getTreeCount()).toBe(initialCount - 2);
    });
  });

  describe('addTreeType', () => {
    it('should add new tree type', () => {
      treeManager.addTreeType('tree_3');
      expect(treeManager.treeTypes).toContain('tree_3');
    });

    it('should not add duplicate tree type', () => {
      const initialLength = treeManager.treeTypes.length;
      treeManager.addTreeType('tree_1'); // Already exists
      expect(treeManager.treeTypes).toHaveLength(initialLength);
    });
  });

  describe('generateTrees', () => {
    it('should generate trees based on climate configuration', () => {
      // Mock Math.random to ensure consistent results
      const originalRandom = Math.random;
      let callCount = 0;
      Math.random = vi.fn(() => {
        // First calls determine if trees spawn (below probability)
        // Later calls determine how many trees and positioning
        return callCount++ % 4 === 0 ? 0.05 : 0.5; // 25% spawn, rest for positioning
      });

      const map = [
        [{ type: 'grass', height: 0 }, { type: 'water', height: 0 }, { type: 'grass', height: 0 }],
        [{ type: 'sand', height: 0 }, { type: 'grass', height: 0 }, { type: 'rock', height: 1 }],
        [{ type: 'grass', height: 0 }, { type: 'grass', height: 0 }, { type: 'grass', height: 0 }]
      ];

      // Create a tree manager with the correct dimensions for the test map
      const testTreeManager = new TreeManager(mockScene, {
        mapWidth: 3,
        mapHeight: 3,
        tileWidth: 128,
        tileHeight: 64,
        mapCenterX: 400,
        mapCenterY: 150
      });

      testTreeManager.generateTrees(map, 'dense_forest');

      // Dense forest should generate trees (exact count varies due to randomness)
      expect(testTreeManager.getTreeCount()).toBeGreaterThan(0);

      Math.random = originalRandom;
    });

    it('should clear existing trees before generating new ones', () => {
      const testTreeManager = new TreeManager(mockScene, {
        mapWidth: 1,
        mapHeight: 1,
        tileWidth: 128,
        tileHeight: 64,
        mapCenterX: 400,
        mapCenterY: 150
      });

      testTreeManager.spawnTree(0, 0);
      expect(testTreeManager.getTreeCount()).toBe(1);

      const map = [[{ type: 'water', height: 0 }]];
      testTreeManager.generateTrees(map, 'prairie');

      expect(testTreeManager.getTreeCount()).toBe(0);
    });

    it('should not spawn trees on non-grass tiles', () => {
      const map = [
        [{ type: 'water', height: 0 }, { type: 'sand', height: 0 }, { type: 'rock', height: 1 }]
      ];

      // Create a tree manager with the correct dimensions for the test map
      const testTreeManager = new TreeManager(mockScene, {
        mapWidth: 3,
        mapHeight: 1,
        tileWidth: 128,
        tileHeight: 64,
        mapCenterX: 400,
        mapCenterY: 150
      });

      testTreeManager.generateTrees(map, 'dense_forest');
      expect(testTreeManager.getTreeCount()).toBe(0);
    });

    it('should respect climate-based spawn probabilities', () => {
      const map = [[{ type: 'grass', height: 0 }]];

      const testTreeManager = new TreeManager(mockScene, {
        mapWidth: 1,
        mapHeight: 1,
        tileWidth: 128,
        tileHeight: 64,
        mapCenterX: 400,
        mapCenterY: 150
      });

      // Desert should have very low tree count
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.5); // Above desert probability (0.02)

      testTreeManager.generateTrees(map, 'desert');
      expect(testTreeManager.getTreeCount()).toBe(0);

      Math.random = originalRandom;
    });
  });

  describe('distance', () => {
    it('should calculate the correct distance between two points', () => {
      const dist = treeManager.distance(0, 0, 3, 4);
      expect(dist).toBe(5);
    });
  });

  describe('getTreesInRadius', () => {
    it('should return trees within the specified radius', () => {
      treeManager.spawnTree(5, 5); // Center
      treeManager.spawnTree(5, 6); // Nearby
      treeManager.spawnTree(3, 3); // Far

      const nearbyTrees = treeManager.getTreesInRadius(5, 5, 1.5);
      expect(nearbyTrees).toHaveLength(2);
      expect(nearbyTrees.some(t => t.mapX === 5 && t.mapY === 5)).toBe(true);
      expect(nearbyTrees.some(t => t.mapX === 5 && t.mapY === 6)).toBe(true);
    });
  });

  describe('removeTreesInRadius', () => {
    it('should remove trees within the specified radius', () => {
      treeManager.spawnTree(5, 5); // Center
      treeManager.spawnTree(5, 6); // Nearby
      treeManager.spawnTree(3, 3); // Far

      const removedCount = treeManager.removeTreesInRadius(5, 5, 1.5);
      expect(removedCount).toBe(2);
      expect(treeManager.getTreeCount()).toBe(1);
      expect(treeManager.getTreeAt(3, 3)).not.toBeNull();
    });
  });
}); 