import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NPC, NPCManager, NPC_STATES } from './npcs.js';
import { TILE_TYPES } from '../terrain/terrain.js';

// Mock Phaser scene
const createMockScene = () => ({
  add: {
    graphics: vi.fn(() => ({
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      generateTexture: vi.fn(),
      destroy: vi.fn()
    })),
    image: vi.fn(() => {
      const sprite = {
        x: 0,
        y: 0,
        setOrigin: vi.fn(),
        setDepth: vi.fn(),
        setPosition: vi.fn(function (x, y) {
          this.x = x;
          this.y = y;
        }),
        destroy: vi.fn()
      };
      return sprite;
    })
  },
  cameras: {
    main: {
      width: 800,
      height: 600
    }
  },
  tweens: {
    add: vi.fn()
  }
});

// Mock tree manager
const createMockTreeManager = () => ({
  getTreesInRadius: vi.fn(() => [])
});

// Create test map data
const createTestMapData = (width = 5, height = 5) => {
  const map = [];
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      map[y][x] = {
        type: TILE_TYPES.GRASS,
        height: 0
      };
    }
  }
  return map;
};

describe('NPC', () => {
  let mockScene;
  let mockTreeManager;
  let testMapData;

  beforeEach(() => {
    mockScene = createMockScene();
    mockTreeManager = createMockTreeManager();
    testMapData = createTestMapData();
  });

  describe('constructor', () => {
    it('should create an NPC with default values', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      expect(npc.id).toBe(1);
      expect(npc.state).toBe(NPC_STATES.SEARCHING);
      expect(npc.mapX).toBe(0);
      expect(npc.mapY).toBe(0);
      expect(npc.color).toBe(0xff0000);
      expect(npc.width).toBe(20);
      expect(npc.height).toBe(30);
    });

    it('should create an NPC with custom configuration', () => {
      const config = {
        mapX: 2,
        mapY: 3,
        color: 0x00ff00,
        width: 25,
        height: 35,
        moveSpeed: 1500,
        mapData: testMapData,
        treeManager: mockTreeManager
      };

      const npc = new NPC(1, mockScene, config);

      expect(npc.mapX).toBe(2);
      expect(npc.mapY).toBe(3);
      expect(npc.color).toBe(0x00ff00);
      expect(npc.width).toBe(25);
      expect(npc.height).toBe(35);
      expect(npc.moveSpeed).toBe(1500);
    });

    it('should create sprite with correct properties', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(mockScene.add.image).toHaveBeenCalled();
      expect(npc.sprite.setOrigin).toHaveBeenCalledWith(0.5, 1);
    });
  });

  describe('isNicePlace', () => {
    it('should return false for positions outside map bounds', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      expect(npc.isNicePlace(-1, 0)).toBe(false);
      expect(npc.isNicePlace(0, -1)).toBe(false);
      expect(npc.isNicePlace(5, 0)).toBe(false);
      expect(npc.isNicePlace(0, 5)).toBe(false);
    });

    it('should return false for water tiles', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.WATER, height: 0 };

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isNicePlace(2, 2)).toBe(false);
    });

    it('should return false for rock tiles', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.ROCK, height: 1 };

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isNicePlace(2, 2)).toBe(false);
    });

    it('should return false for snow tiles', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.SNOW, height: 2 };

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isNicePlace(2, 2)).toBe(false);
    });

    it('should return false for grass/sand tiles without trees', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.GRASS, height: 0 };

      mockTreeManager.getTreesInRadius.mockReturnValue([]);

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isNicePlace(2, 2)).toBe(false);
    });

    it('should return true for grass tiles with trees', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.GRASS, height: 0 };

      mockTreeManager.getTreesInRadius.mockReturnValue([{ id: 1 }]);

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isNicePlace(2, 2)).toBe(true);
    });

    it('should return true for sand tiles with trees', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.SAND, height: 0 };

      mockTreeManager.getTreesInRadius.mockReturnValue([{ id: 1 }]);

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isNicePlace(2, 2)).toBe(true);
    });
  });

  describe('isValidPosition', () => {
    it('should return false for positions outside map bounds', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      expect(npc.isValidPosition(-1, 0)).toBe(false);
      expect(npc.isValidPosition(0, -1)).toBe(false);
      expect(npc.isValidPosition(5, 0)).toBe(false);
      expect(npc.isValidPosition(0, 5)).toBe(false);
    });

    it('should return false for water tiles', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.WATER, height: 0 };

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isValidPosition(2, 2)).toBe(false);
    });

    it('should return false for rock tiles', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.ROCK, height: 1 };

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isValidPosition(2, 2)).toBe(false);
    });

    it('should return false for snow tiles', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.SNOW, height: 2 };

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isValidPosition(2, 2)).toBe(false);
    });

    it('should return true for grass tiles', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.GRASS, height: 0 };

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isValidPosition(2, 2)).toBe(true);
    });

    it('should return true for sand tiles', () => {
      const mapData = createTestMapData();
      mapData[2][2] = { type: TILE_TYPES.SAND, height: 0 };

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.isValidPosition(2, 2)).toBe(true);
    });
  });

  describe('update', () => {
    it('should check current position when in searching state and enough time has passed', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      vi.spyOn(npc, 'checkCurrentPosition');

      // First update - should check position
      npc.update(1000);
      expect(npc.checkCurrentPosition).toHaveBeenCalledTimes(1);

      // Second update too soon - should not check position
      npc.update(1500);
      expect(npc.checkCurrentPosition).toHaveBeenCalledTimes(1);

      // Third update after interval - should check position
      npc.update(2000);
      expect(npc.checkCurrentPosition).toHaveBeenCalledTimes(2);
    });

    it('should move when in searching state and enough time has passed', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      vi.spyOn(npc, 'move');

      // First update - should move
      npc.update(2000);
      expect(npc.move).toHaveBeenCalledTimes(1);
      npc.isMoving = false;

      // Second update too soon - should not move
      npc.update(3000);
      expect(npc.move).toHaveBeenCalledTimes(1);
      npc.isMoving = false;

      // Third update after interval - should move
      npc.update(4000);
      expect(npc.move).toHaveBeenCalledTimes(2);
    });

    it('should not update when in place_found state', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      npc.state = NPC_STATES.PLACE_FOUND;

      vi.spyOn(npc, 'checkCurrentPosition');
      vi.spyOn(npc, 'move');

      npc.update(1000);
      expect(npc.checkCurrentPosition).not.toHaveBeenCalled();
      expect(npc.move).not.toHaveBeenCalled();
    });

    it('should not move when already moving', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });
      npc.isMoving = true;
      vi.spyOn(npc, 'move');
      npc.update(3000);
      expect(npc.move).not.toHaveBeenCalled();
    });
  });

  describe('checkCurrentPosition', () => {
    it('should change state to place_found when current position is nice', () => {
      const mapData = createTestMapData();
      mapData[0][0] = { type: TILE_TYPES.GRASS, height: 0 };

      mockTreeManager.getTreesInRadius.mockReturnValue([{ id: 1 }]);

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.state).toBe(NPC_STATES.SEARCHING);
      npc.checkCurrentPosition();
      expect(npc.state).toBe(NPC_STATES.PLACE_FOUND);
    });

    it('should remain in searching state when current position is not nice', () => {
      const mapData = createTestMapData();
      mapData[0][0] = { type: TILE_TYPES.GRASS, height: 0 };

      mockTreeManager.getTreesInRadius.mockReturnValue([]);

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      expect(npc.state).toBe(NPC_STATES.SEARCHING);
      npc.checkCurrentPosition();
      expect(npc.state).toBe(NPC_STATES.SEARCHING);
    });
  });

  describe('move', () => {
    it('should start a tween to a valid adjacent position', () => {
      const npc = new NPC(1, mockScene, {
        mapX: 2,
        mapY: 2,
        mapData: testMapData,
        treeManager: mockTreeManager,
        moveSpeed: 500
      });

      npc.move();

      expect(mockScene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({
        targets: npc.sprite,
        duration: 500,
        ease: 'Linear'
      }));
      expect(npc.isMoving).toBe(true);
    });

    it('should not move when no valid positions are available', () => {
      // Create a map where NPC is surrounded by water
      const mapData = createTestMapData();
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          mapData[y][x] = { type: TILE_TYPES.WATER, height: 0 };
        }
      }
      mapData[2][2] = { type: TILE_TYPES.GRASS, height: 0 };

      const npc = new NPC(1, mockScene, {
        mapX: 2,
        mapY: 2,
        mapData: mapData,
        treeManager: mockTreeManager
      });

      npc.move();

      expect(mockScene.tweens.add).not.toHaveBeenCalled();
      expect(npc.isMoving).toBe(false);
    });

    it('should not move if already moving', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });
      npc.isMoving = true;
      npc.move();
      expect(mockScene.tweens.add).not.toHaveBeenCalled();
    });
  });

  describe('mapToIsometric', () => {
    it('should convert map coordinates to isometric coordinates', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const result = npc.mapToIsometric(1, 1);

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
    });

    it('should account for tile height in isometric conversion', () => {
      const mapData = createTestMapData();
      mapData[1][1] = { type: TILE_TYPES.GRASS, height: 2 };

      const npc = new NPC(1, mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      const result = npc.mapToIsometric(1, 1);

      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
    });
  });

  describe('isometricToMap', () => {
    it('should convert isometric coordinates to map coordinates', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const isoPos = npc.mapToIsometric(2, 3);
      const mapPos = npc.isometricToMap(isoPos.x, isoPos.y);

      expect(mapPos.x).toBeCloseTo(2);
      expect(mapPos.y).toBeCloseTo(3);
    });
  });

  describe('destroy', () => {
    it('should destroy the sprite', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const spriteMock = npc.sprite;
      npc.destroy();

      expect(spriteMock.destroy).toHaveBeenCalled();
      expect(npc.sprite).toBeNull();
    });
  });

  describe('getState', () => {
    it('should return the current state', () => {
      const npc = new NPC(1, mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      expect(npc.getState()).toBe(NPC_STATES.SEARCHING);

      npc.state = NPC_STATES.PLACE_FOUND;
      expect(npc.getState()).toBe(NPC_STATES.PLACE_FOUND);
    });
  });

  describe('getPosition', () => {
    it('should return the current position', () => {
      const npc = new NPC(1, mockScene, {
        mapX: 3,
        mapY: 4,
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const position = npc.getPosition();
      expect(position).toEqual({ x: 3, y: 4 });
    });
  });
});

describe('NPCManager', () => {
  let mockScene;
  let mockTreeManager;
  let testMapData;

  beforeEach(() => {
    mockScene = createMockScene();
    mockTreeManager = createMockTreeManager();
    testMapData = createTestMapData();
  });

  describe('constructor', () => {
    it('should create an NPCManager with default values', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      expect(manager.npcs).toEqual([]);
      expect(manager.nextNpcId).toBe(1);
      expect(manager.spawnConfig.maxNpcs).toBe(5);
      expect(manager.spawnConfig.spawnInterval).toBe(10000);
    });

    it('should create an NPCManager with custom configuration', () => {
      const config = {
        maxNpcs: 10,
        spawnInterval: 5000,
        mapData: testMapData,
        treeManager: mockTreeManager
      };

      const manager = new NPCManager(mockScene, config);

      expect(manager.spawnConfig.maxNpcs).toBe(10);
      expect(manager.spawnConfig.spawnInterval).toBe(5000);
    });
  });

  describe('findValidEntryPoint', () => {
    it('should find valid entry points on borders', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const entryPoint = manager.findValidEntryPoint();

      expect(entryPoint).toBeTruthy();
      expect(entryPoint.x).toBeGreaterThanOrEqual(0);
      expect(entryPoint.x).toBeLessThan(5);
      expect(entryPoint.y).toBeGreaterThanOrEqual(0);
      expect(entryPoint.y).toBeLessThan(5);

      // Should be on border
      const onBorder = entryPoint.x === 0 || entryPoint.x === 4 ||
        entryPoint.y === 0 || entryPoint.y === 4;
      expect(onBorder).toBe(true);
    });

    it('should return null when no valid entry points exist', () => {
      // Create a map where all border tiles are water
      const mapData = createTestMapData();
      for (let x = 0; x < 5; x++) {
        mapData[0][x] = { type: TILE_TYPES.WATER, height: 0 };
        mapData[4][x] = { type: TILE_TYPES.WATER, height: 0 };
      }
      for (let y = 0; y < 5; y++) {
        mapData[y][0] = { type: TILE_TYPES.WATER, height: 0 };
        mapData[y][4] = { type: TILE_TYPES.WATER, height: 0 };
      }

      const manager = new NPCManager(mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      const entryPoint = manager.findValidEntryPoint();
      expect(entryPoint).toBeNull();
    });
  });

  describe('spawnNPC', () => {
    it('should spawn an NPC at a valid entry point', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const npc = manager.spawnNPC();

      expect(npc).toBeTruthy();
      expect(manager.npcs).toHaveLength(1);
      expect(manager.npcs[0]).toBe(npc);
      expect(manager.nextNpcId).toBe(2);
    });

    it('should return null when no valid entry point exists', () => {
      // Create a map where all border tiles are water
      const mapData = createTestMapData();
      for (let x = 0; x < 5; x++) {
        mapData[0][x] = { type: TILE_TYPES.WATER, height: 0 };
        mapData[4][x] = { type: TILE_TYPES.WATER, height: 0 };
      }
      for (let y = 0; y < 5; y++) {
        mapData[y][0] = { type: TILE_TYPES.WATER, height: 0 };
        mapData[y][4] = { type: TILE_TYPES.WATER, height: 0 };
      }

      const manager = new NPCManager(mockScene, {
        mapData: mapData,
        treeManager: mockTreeManager
      });

      const npc = manager.spawnNPC();
      expect(npc).toBeNull();
      expect(manager.npcs).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update all NPCs', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const npc1 = manager.spawnNPC();
      const npc2 = manager.spawnNPC();

      vi.spyOn(npc1, 'update');
      vi.spyOn(npc2, 'update');

      manager.update(1000);

      expect(npc1.update).toHaveBeenCalledWith(1000);
      expect(npc2.update).toHaveBeenCalledWith(1000);
    });

    it('should spawn new NPCs when conditions are met', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      manager.spawnConfig.maxNpcs = 2;
      manager.spawnConfig.spawnInterval = 1000;

      // First update should spawn an NPC
      manager.update(1000);
      expect(manager.npcs).toHaveLength(1);

      // Second update after interval should spawn another NPC
      manager.update(2000);
      expect(manager.npcs).toHaveLength(2);

      // Third update should not spawn (max reached)
      manager.update(3000);
      expect(manager.npcs).toHaveLength(2);
    });
  });

  describe('getNPCsByState', () => {
    it('should return NPCs filtered by state', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const npc1 = manager.spawnNPC();
      const npc2 = manager.spawnNPC();

      npc1.state = NPC_STATES.SEARCHING;
      npc2.state = NPC_STATES.PLACE_FOUND;

      const searchingNpcs = manager.getNPCsByState(NPC_STATES.SEARCHING);
      const foundNpcs = manager.getNPCsByState(NPC_STATES.PLACE_FOUND);

      expect(searchingNpcs).toHaveLength(1);
      expect(foundNpcs).toHaveLength(1);
      expect(searchingNpcs[0]).toBe(npc1);
      expect(foundNpcs[0]).toBe(npc2);
    });
  });

  describe('getStateCounts', () => {
    it('should return count of NPCs in each state', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const npc1 = manager.spawnNPC();
      const npc2 = manager.spawnNPC();
      const npc3 = manager.spawnNPC();

      npc1.state = NPC_STATES.SEARCHING;
      npc2.state = NPC_STATES.SEARCHING;
      npc3.state = NPC_STATES.PLACE_FOUND;

      const counts = manager.getStateCounts();

      expect(counts[NPC_STATES.SEARCHING]).toBe(2);
      expect(counts[NPC_STATES.PLACE_FOUND]).toBe(1);
    });
  });

  describe('removeNPC', () => {
    it('should remove an NPC by ID', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const npc = manager.spawnNPC();
      vi.spyOn(npc, 'destroy');

      const result = manager.removeNPC(npc.id);

      expect(result).toBe(true);
      expect(manager.npcs).toHaveLength(0);
      expect(npc.destroy).toHaveBeenCalled();
    });

    it('should return false when NPC ID is not found', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const result = manager.removeNPC(999);

      expect(result).toBe(false);
      expect(manager.npcs).toHaveLength(0);
    });
  });

  describe('clearAllNPCs', () => {
    it('should remove all NPCs', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      const npc1 = manager.spawnNPC();
      const npc2 = manager.spawnNPC();

      vi.spyOn(npc1, 'destroy');
      vi.spyOn(npc2, 'destroy');

      manager.clearAllNPCs();

      expect(manager.npcs).toHaveLength(0);
      expect(npc1.destroy).toHaveBeenCalled();
      expect(npc2.destroy).toHaveBeenCalled();
    });
  });

  describe('getNPCCount', () => {
    it('should return the total number of NPCs', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      expect(manager.getNPCCount()).toBe(0);

      manager.spawnNPC();
      expect(manager.getNPCCount()).toBe(1);

      manager.spawnNPC();
      expect(manager.getNPCCount()).toBe(2);
    });
  });

  describe('updateSpawnConfig', () => {
    it('should update spawn configuration', () => {
      const manager = new NPCManager(mockScene, {
        mapData: testMapData,
        treeManager: mockTreeManager
      });

      manager.updateSpawnConfig({
        maxNpcs: 15,
        spawnInterval: 3000
      });

      expect(manager.spawnConfig.maxNpcs).toBe(15);
      expect(manager.spawnConfig.spawnInterval).toBe(3000);
    });
  });
}); 