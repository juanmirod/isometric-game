/**
 * Tests for the tent management system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Tent, TentManager } from './tents.js';
import { TENT_WIDTH, TENT_HEIGHT, TENT_COLOR } from '../const.js';

// Mock Phaser scene
const createMockScene = () => ({
  add: {
    graphics: vi.fn(() => ({
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      generateTexture: vi.fn(),
      destroy: vi.fn()
    })),
    image: vi.fn(() => ({
      setOrigin: vi.fn(),
      setDepth: vi.fn(),
      destroy: vi.fn()
    }))
  },
  cameras: {
    main: {
      width: 800,
      height: 600
    }
  }
});

// Sample map data for testing
const createTestMapData = () => {
  const mapData = [];
  for (let y = 0; y < 5; y++) {
    mapData[y] = [];
    for (let x = 0; x < 5; x++) {
      mapData[y][x] = {
        type: 'GRASS',
        height: 0
      };
    }
  }
  return mapData;
};

describe('Tent', () => {
  let mockScene;
  let mapData;

  beforeEach(() => {
    mockScene = createMockScene();
    mapData = createTestMapData();
  });

  describe('constructor', () => {
    it('should create a tent with default configuration', () => {
      const tent = new Tent(1, mockScene, { mapX: 2, mapY: 2, mapData });

      expect(tent.id).toBe(1);
      expect(tent.scene).toBe(mockScene);
      expect(tent.mapX).toBe(2);
      expect(tent.mapY).toBe(2);
      expect(tent.width).toBe(TENT_WIDTH);
      expect(tent.height).toBe(TENT_HEIGHT);
      expect(tent.color).toBe(TENT_COLOR);
    });

    it('should create a tent with custom configuration', () => {
      const config = {
        mapX: 1,
        mapY: 3,
        width: 80,
        height: 80,
        color: 0x00ff00,
        mapData
      };

      const tent = new Tent(5, mockScene, config);

      expect(tent.id).toBe(5);
      expect(tent.mapX).toBe(1);
      expect(tent.mapY).toBe(3);
      expect(tent.width).toBe(80);
      expect(tent.height).toBe(80);
      expect(tent.color).toBe(0x00ff00);
    });

    it('should create sprite during construction', () => {
      new Tent(1, mockScene, { mapX: 2, mapY: 2, mapData });

      expect(mockScene.add.graphics).toHaveBeenCalledOnce();
      expect(mockScene.add.image).toHaveBeenCalledOnce();
    });
  });

  describe('createSprite', () => {
    it('should create graphics and generate texture', () => {
      const mockGraphics = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        generateTexture: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.graphics.mockReturnValue(mockGraphics);

      const tent = new Tent(1, mockScene, { mapX: 2, mapY: 2, mapData });

      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(TENT_COLOR, 1);
      expect(mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, TENT_WIDTH, TENT_HEIGHT);
      expect(mockGraphics.generateTexture).toHaveBeenCalledWith('tent_1', TENT_WIDTH, TENT_HEIGHT);
      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should create sprite with correct properties', () => {
      const mockSprite = {
        setOrigin: vi.fn(),
        setDepth: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.image.mockReturnValue(mockSprite);

      new Tent(1, mockScene, { mapX: 2, mapY: 2, mapData });

      expect(mockSprite.setOrigin).toHaveBeenCalledWith(0.5, 1);
      expect(mockSprite.setDepth).toHaveBeenCalled();
    });
  });

  describe('mapToIsometric', () => {
    it('should convert map coordinates to isometric coordinates', () => {
      const tent = new Tent(1, mockScene, {
        mapX: 2,
        mapY: 2,
        mapData,
        tileWidth: 256,
        tileHeight: 128,
        mapCenterX: 400,
        mapCenterY: 150
      });

      const result = tent.mapToIsometric(1, 1);

      expect(result).toEqual({
        x: 400, // mapCenterX + (1-1) * 256/2 = 400 + 0 = 400
        y: 278  // mapCenterY + (1+1) * 128/2 - (0 * 20) = 150 + 128 = 278
      });
    });

    it('should account for tile height in isometric conversion', () => {
      // Create map data with height
      const heightMapData = createTestMapData();
      heightMapData[1][1].height = 2;

      const tent = new Tent(1, mockScene, {
        mapX: 1,
        mapY: 1,
        mapData: heightMapData,
        tileWidth: 256,
        tileHeight: 128,
        mapCenterX: 400,
        mapCenterY: 150
      });

      const result = tent.mapToIsometric(1, 1);

      expect(result).toEqual({
        x: 400, // mapCenterX + (1-1) * 256/2 = 400
        y: 238  // mapCenterY + (1+1) * 128/2 - (2 * 20) = 150 + 128 - 40 = 238
      });
    });
  });

  describe('updateDepth', () => {
    it('should set sprite depth based on position and height', () => {
      const mockSprite = {
        setOrigin: vi.fn(),
        setDepth: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.image.mockReturnValue(mockSprite);

      const tent = new Tent(1, mockScene, {
        mapX: 2,
        mapY: 1,
        mapData,
        mapWidth: 5,
        mapHeight: 5
      });

      tent.updateDepth();

      // Depth calculation: tileHeight * 100 + sortKey + 15000
      // sortKey = mapY * mapWidth + mapX - tileHeight * 1000
      // sortKey = 1 * 5 + 2 - 0 * 1000 = 7
      // depth = 0 * 100 + 7 + 15000 = 15007
      expect(mockSprite.setDepth).toHaveBeenCalledWith(15007);
    });

    it('should not update depth if sprite does not exist', () => {
      const tent = new Tent(1, mockScene, { mapX: 2, mapY: 2, mapData });
      tent.sprite = null;

      // Should not throw error
      expect(() => tent.updateDepth()).not.toThrow();
    });

    it('should not update depth for out-of-bounds positions', () => {
      const mockSprite = {
        setOrigin: vi.fn(),
        setDepth: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.image.mockReturnValue(mockSprite);

      const tent = new Tent(1, mockScene, {
        mapX: 10, // Out of bounds
        mapY: 10, // Out of bounds
        mapData,
        mapWidth: 5,
        mapHeight: 5
      });

      mockSprite.setDepth.mockClear(); // Clear the call from createSprite
      tent.updateDepth();

      expect(mockSprite.setDepth).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should destroy sprite when it exists', () => {
      const mockSprite = {
        setOrigin: vi.fn(),
        setDepth: vi.fn(),
        destroy: vi.fn()
      };
      mockScene.add.image.mockReturnValue(mockSprite);

      const tent = new Tent(1, mockScene, { mapX: 2, mapY: 2, mapData });
      tent.destroy();

      expect(mockSprite.destroy).toHaveBeenCalled();
      expect(tent.sprite).toBeNull();
    });

    it('should handle destroy when sprite is null', () => {
      const tent = new Tent(1, mockScene, { mapX: 2, mapY: 2, mapData });
      tent.sprite = null;

      expect(() => tent.destroy()).not.toThrow();
    });
  });

  describe('getId', () => {
    it('should return tent ID', () => {
      const tent = new Tent(42, mockScene, { mapX: 2, mapY: 2, mapData });
      expect(tent.getId()).toBe(42);
    });
  });

  describe('getPosition', () => {
    it('should return tent position', () => {
      const tent = new Tent(1, mockScene, { mapX: 3, mapY: 4, mapData });
      expect(tent.getPosition()).toEqual({ x: 3, y: 4 });
    });
  });
});

describe('TentManager', () => {
  let mockScene;
  let mapData;
  let tentManager;

  beforeEach(() => {
    mockScene = createMockScene();
    mapData = createTestMapData();
    tentManager = new TentManager(mockScene, {
      mapWidth: 5,
      mapHeight: 5,
      mapData
    });
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const manager = new TentManager(mockScene);

      expect(manager.scene).toBe(mockScene);
      expect(manager.tents).toEqual([]);
      expect(manager.nextTentId).toBe(1);
    });

    it('should initialize with custom configuration', () => {
      const config = {
        mapWidth: 10,
        mapHeight: 8,
        tileWidth: 128,
        tileHeight: 64,
        mapData
      };

      const manager = new TentManager(mockScene, config);

      expect(manager.mapWidth).toBe(10);
      expect(manager.mapHeight).toBe(8);
      expect(manager.tileWidth).toBe(128);
      expect(manager.tileHeight).toBe(64);
      expect(manager.mapData).toBe(mapData);
    });
  });

  describe('createTent', () => {
    it('should create a tent at valid position', () => {
      const tent = tentManager.createTent(2, 3);

      expect(tent).not.toBeNull();
      expect(tent.getId()).toBe(1);
      expect(tent.getPosition()).toEqual({ x: 2, y: 3 });
      expect(tentManager.getTentCount()).toBe(1);
    });

    it('should increment tent ID for each new tent', () => {
      const tent1 = tentManager.createTent(1, 1);
      const tent2 = tentManager.createTent(2, 2);

      expect(tent1.getId()).toBe(1);
      expect(tent2.getId()).toBe(2);
      expect(tentManager.getTentCount()).toBe(2);
    });

    it('should not create tent at invalid position (out of bounds)', () => {
      const tent = tentManager.createTent(-1, 5);

      expect(tent).toBeNull();
      expect(tentManager.getTentCount()).toBe(0);
    });

    it('should not create tent when map data is missing', () => {
      const managerWithoutData = new TentManager(mockScene, {
        mapWidth: 5,
        mapHeight: 5,
        mapData: null
      });

      const tent = managerWithoutData.createTent(2, 2);

      expect(tent).toBeNull();
      expect(managerWithoutData.getTentCount()).toBe(0);
    });
  });

  describe('getAllTents', () => {
    it('should return empty array when no tents exist', () => {
      expect(tentManager.getAllTents()).toEqual([]);
    });

    it('should return array of all tents', () => {
      const tent1 = tentManager.createTent(1, 1);
      const tent2 = tentManager.createTent(2, 2);

      const allTents = tentManager.getAllTents();

      expect(allTents).toHaveLength(2);
      expect(allTents).toContain(tent1);
      expect(allTents).toContain(tent2);
    });

    it('should return a copy of the tents array', () => {
      tentManager.createTent(1, 1);
      const allTents = tentManager.getAllTents();

      allTents.push('fake tent');

      expect(tentManager.getAllTents()).toHaveLength(1);
    });
  });

  describe('getTentCount', () => {
    it('should return 0 when no tents exist', () => {
      expect(tentManager.getTentCount()).toBe(0);
    });

    it('should return correct count of tents', () => {
      tentManager.createTent(1, 1);
      expect(tentManager.getTentCount()).toBe(1);

      tentManager.createTent(2, 2);
      expect(tentManager.getTentCount()).toBe(2);
    });
  });

  describe('getTentsAt', () => {
    it('should return empty array when no tents at position', () => {
      tentManager.createTent(1, 1);
      const tentsAt = tentManager.getTentsAt(2, 2);

      expect(tentsAt).toEqual([]);
    });

    it('should return tents at specific position', () => {
      const tent1 = tentManager.createTent(2, 3);
      tentManager.createTent(1, 1);
      const tent3 = tentManager.createTent(2, 3); // Same position as tent1

      const tentsAt = tentManager.getTentsAt(2, 3);

      expect(tentsAt).toHaveLength(2);
      expect(tentsAt).toContain(tent1);
      expect(tentsAt).toContain(tent3);
    });
  });

  describe('removeTent', () => {
    it('should remove tent by ID and return true', () => {
      const tent = tentManager.createTent(1, 1);
      const tentId = tent.getId();

      const result = tentManager.removeTent(tentId);

      expect(result).toBe(true);
      expect(tentManager.getTentCount()).toBe(0);
    });

    it('should return false when tent ID does not exist', () => {
      tentManager.createTent(1, 1);

      const result = tentManager.removeTent(999);

      expect(result).toBe(false);
      expect(tentManager.getTentCount()).toBe(1);
    });

    it('should call destroy on removed tent', () => {
      const tent = tentManager.createTent(1, 1);
      const destroySpy = vi.spyOn(tent, 'destroy');

      tentManager.removeTent(tent.getId());

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('clearAllTents', () => {
    it('should remove all tents', () => {
      tentManager.createTent(1, 1);
      tentManager.createTent(2, 2);
      tentManager.createTent(3, 3);

      tentManager.clearAllTents();

      expect(tentManager.getTentCount()).toBe(0);
      expect(tentManager.getAllTents()).toEqual([]);
    });

    it('should call destroy on all tents', () => {
      const tent1 = tentManager.createTent(1, 1);
      const tent2 = tentManager.createTent(2, 2);
      const destroySpy1 = vi.spyOn(tent1, 'destroy');
      const destroySpy2 = vi.spyOn(tent2, 'destroy');

      tentManager.clearAllTents();

      expect(destroySpy1).toHaveBeenCalled();
      expect(destroySpy2).toHaveBeenCalled();
    });

    it('should handle empty tent list', () => {
      expect(() => tentManager.clearAllTents()).not.toThrow();
      expect(tentManager.getTentCount()).toBe(0);
    });
  });
});