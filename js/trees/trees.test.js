import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TreeManager } from './trees.js';

// Mock Phaser scene
const createMockScene = () => ({
  add: {
    image: vi.fn((x, y, texture) => ({
      setOrigin: vi.fn(),
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
      expect(defaultManager.tileWidth).toBe(128);
      expect(defaultManager.tileHeight).toBe(64);
      expect(defaultManager.trees).toEqual([]);
      expect(defaultManager.spawnProbability).toBe(0.2);
      expect(defaultManager.treeTypes).toEqual(['tree_1', 'tree_2']);
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
      expect(tree).toHaveProperty('type');
      expect(tree).toHaveProperty('id');
      expect(treeManager.treeTypes).toContain(tree.type);
      expect(treeManager.trees).toContain(tree);
    });

    it('should set correct sprite origin', () => {
      const mockSprite = {
        setOrigin: vi.fn(),
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
      const mockSprite1 = { setOrigin: vi.fn(), destroy: vi.fn() };
      const mockSprite2 = { setOrigin: vi.fn(), destroy: vi.fn() };

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

  describe('setSpawnProbability', () => {
    it('should set valid probability', () => {
      treeManager.setSpawnProbability(0.5);
      expect(treeManager.spawnProbability).toBe(0.5);
    });

    it('should clamp probability to valid range', () => {
      treeManager.setSpawnProbability(-0.5);
      expect(treeManager.spawnProbability).toBe(0);

      treeManager.setSpawnProbability(1.5);
      expect(treeManager.spawnProbability).toBe(1);
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
    it('should generate trees on grass tiles based on probability', () => {
      // Mock Math.random to control probability
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.1); // Below default 0.2 probability

      const map = [
        ['grass', 'water', 'grass'],
        ['sand', 'grass', 'stone'],
        ['grass', 'grass', 'grass']
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

      testTreeManager.generateTrees(map);

      // Should spawn trees on all grass tiles (6 total)
      expect(testTreeManager.getTreeCount()).toBe(6);

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

      const map = [['water']];
      testTreeManager.generateTrees(map);

      expect(testTreeManager.getTreeCount()).toBe(0);
    });

    it('should not spawn trees on non-grass tiles', () => {
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.1); // Below probability threshold

      const map = [
        ['water', 'sand', 'stone']
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

      testTreeManager.generateTrees(map);
      expect(testTreeManager.getTreeCount()).toBe(0);

      Math.random = originalRandom;
    });
  });
}); 