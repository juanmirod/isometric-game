/**
 * NPC management system for the isometric game
 * Handles NPC spawning, state management, and movement
 */

import { TILE_TYPES } from '../terrain/terrain.js';

// NPC states
export const NPC_STATES = {
  SEARCHING: 'searching',
  PLACE_FOUND: 'place_found'
};

/**
 * Individual NPC class with state machine behavior
 */
export class NPC {
  constructor(id, scene, config = {}) {
    this.id = id;
    this.scene = scene;
    this.mapX = config.mapX || 0;
    this.mapY = config.mapY || 0;
    this.state = NPC_STATES.SEARCHING;
    this.sprite = null;
    this.lastStateCheck = 0;
    this.stateCheckInterval = 1000; // Check every second
    this.moveSpeed = config.moveSpeed || 2000; // Time between moves in ms
    this.lastMove = 0;

    // NPC appearance
    this.width = config.width || 20;
    this.height = config.height || 30; // Shorter than trees
    this.color = config.color || 0xff0000; // Red color

    // Map references
    this.mapWidth = config.mapWidth || 50;
    this.mapHeight = config.mapHeight || 50;
    this.tileWidth = config.tileWidth || 128;
    this.tileHeight = config.tileHeight || 64;
    this.mapCenterX = config.mapCenterX || scene.cameras.main.width / 2;
    this.mapCenterY = config.mapCenterY || scene.cameras.main.height / 4;

    // References to game data
    this.mapData = config.mapData || [];
    this.treeManager = config.treeManager || null;

    this.createSprite();
  }

  /**
   * Creates the visual representation of the NPC
   */
  createSprite() {
    // Create red rectangle texture
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(this.color, 1);
    graphics.fillRect(0, 0, this.width, this.height);
    graphics.generateTexture(`npc_${this.id}`, this.width, this.height);
    graphics.destroy();

    // Create sprite
    const isoPosition = this.mapToIsometric(this.mapX, this.mapY);
    this.sprite = this.scene.add.image(isoPosition.x, isoPosition.y, `npc_${this.id}`);
    this.sprite.setOrigin(0.5, 1);

    // Set depth to ensure NPC appears above terrain and trees
    this.updateDepth();
  }

  /**
   * Updates NPC logic - called every frame
   */
  update(time) {
    // Only update if in searching state
    if (this.state === NPC_STATES.SEARCHING) {
      // Check if it's time to evaluate current position
      if (time - this.lastStateCheck >= this.stateCheckInterval) {
        this.checkCurrentPosition();
        this.lastStateCheck = time;
      }

      // Check if it's time to move
      if (time - this.lastMove >= this.moveSpeed) {
        this.move();
        this.lastMove = time;
      }
    }
  }

  /**
   * Checks if current position is a "nice place" and updates state accordingly
   */
  checkCurrentPosition() {
    if (this.isNicePlace(this.mapX, this.mapY)) {
      this.state = NPC_STATES.PLACE_FOUND;
      console.log(`NPC ${this.id} found a nice place at (${this.mapX}, ${this.mapY})`);
    }
  }

  /**
 * Determines if a position is a "nice place"
 * A nice place is sand or grass with at least one tree
 */
  isNicePlace(mapX, mapY) {
    // Check if position is within map bounds
    if (mapX < 0 || mapX >= this.mapWidth || mapY < 0 || mapY >= this.mapHeight) {
      return false;
    }

    // Check if mapData exists and has the required position
    if (!this.mapData || !this.mapData[mapY] || !this.mapData[mapY][mapX]) {
      return false;
    }

    const tileData = this.mapData[mapY][mapX];
    const tileType = tileData.type;

    // Must be sand or grass
    if (tileType !== TILE_TYPES.SAND && tileType !== TILE_TYPES.GRASS) {
      return false;
    }

    // Must have at least one tree nearby (same tile or adjacent tiles)
    return this.hasTreeNearby(mapX, mapY);
  }

  /**
   * Checks if there's a tree at the current position or adjacent positions
   */
  hasTreeNearby(mapX, mapY) {
    if (!this.treeManager) return false;

    // Check current tile and adjacent tiles
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const checkX = mapX + dx;
        const checkY = mapY + dy;

        if (checkX >= 0 && checkX < this.mapWidth && checkY >= 0 && checkY < this.mapHeight) {
          const treesAtPosition = this.treeManager.getTreesInRadius(checkX, checkY, 0);
          if (treesAtPosition.length > 0) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Moves the NPC to a random adjacent position
   */
  move() {
    // Get possible moves (4 directions)
    const directions = [
      { dx: 0, dy: -1 }, // North
      { dx: 1, dy: 0 },  // East
      { dx: 0, dy: 1 },  // South
      { dx: -1, dy: 0 }  // West
    ];

    // Filter valid moves
    const validMoves = directions.filter(dir => {
      const newX = this.mapX + dir.dx;
      const newY = this.mapY + dir.dy;
      return this.isValidPosition(newX, newY);
    });

    // If no valid moves, stay in place
    if (validMoves.length === 0) {
      return;
    }

    // Choose random valid move
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    this.mapX += move.dx;
    this.mapY += move.dy;

    // Update sprite position
    this.updateSpritePosition();
  }

  /**
 * Checks if a position is valid for NPC movement
 */
  isValidPosition(mapX, mapY) {
    // Must be within map bounds
    if (mapX < 0 || mapX >= this.mapWidth || mapY < 0 || mapY >= this.mapHeight) {
      return false;
    }

    // Check if mapData exists and has the required position
    if (!this.mapData || !this.mapData[mapY] || !this.mapData[mapY][mapX]) {
      return false;
    }

    const tileData = this.mapData[mapY][mapX];
    const tileType = tileData.type;

    // Can't move to water or elevated tiles (rock/snow)
    return tileType !== TILE_TYPES.WATER && tileType !== TILE_TYPES.ROCK && tileType !== TILE_TYPES.SNOW;
  }

  /**
   * Updates the sprite position based on current map coordinates
   */
  updateSpritePosition() {
    if (!this.sprite) return;

    const isoPosition = this.mapToIsometric(this.mapX, this.mapY);
    this.sprite.setPosition(isoPosition.x, isoPosition.y);
    this.updateDepth();
  }

  /**
   * Updates sprite depth for proper rendering order
   */
  updateDepth() {
    if (!this.sprite) return;

    const tileData = this.mapData[this.mapY][this.mapX];
    const tileHeight = tileData.height;
    const sortKey = this.mapY * this.mapWidth + this.mapX - tileHeight * 1000;
    const npcDepth = tileHeight * 100 + sortKey + 20000; // Above trees (+20000)
    this.sprite.setDepth(npcDepth);
  }

  /**
   * Converts map coordinates to isometric screen coordinates
   */
  mapToIsometric(mapX, mapY) {
    const tileData = this.mapData[mapY][mapX];
    const tileHeight = tileData.height;
    const heightOffset = 20; // Same as terrain rendering

    const isoX = (mapX - mapY) * this.tileWidth / 2;
    const isoY = (mapX + mapY) * this.tileHeight / 2 - (tileHeight * heightOffset);

    return {
      x: this.mapCenterX + isoX,
      y: this.mapCenterY + isoY
    };
  }

  /**
   * Destroys the NPC sprite
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  /**
   * Gets the current state of the NPC
   */
  getState() {
    return this.state;
  }

  /**
   * Gets the current position of the NPC
   */
  getPosition() {
    return { x: this.mapX, y: this.mapY };
  }
}

/**
 * NPC Manager class to handle multiple NPCs
 */
export class NPCManager {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.mapWidth = config.mapWidth || 50;
    this.mapHeight = config.mapHeight || 50;
    this.tileWidth = config.tileWidth || 128;
    this.tileHeight = config.tileHeight || 64;
    this.mapCenterX = config.mapCenterX || scene.cameras.main.width / 2;
    this.mapCenterY = config.mapCenterY || scene.cameras.main.height / 4;

    this.npcs = [];
    this.nextNpcId = 1;
    this.mapData = config.mapData || [];
    this.treeManager = config.treeManager || null;

    // NPC spawning configuration
    this.spawnConfig = {
      maxNpcs: config.maxNpcs || 5,
      spawnInterval: config.spawnInterval || 10000, // 10 seconds
      lastSpawn: 0
    };
  }

  /**
   * Updates all NPCs and handles spawning
   */
  update(time) {
    // Update existing NPCs
    this.npcs.forEach(npc => npc.update(time));

    // Check if we should spawn new NPCs
    if (this.npcs.length < this.spawnConfig.maxNpcs &&
      time - this.spawnConfig.lastSpawn >= this.spawnConfig.spawnInterval) {
      this.spawnNPC();
      this.spawnConfig.lastSpawn = time;
    }
  }

  /**
   * Spawns a new NPC at a valid border position
   */
  spawnNPC() {
    const entryPoint = this.findValidEntryPoint();
    if (!entryPoint) {
      console.log('No valid entry point found for NPC');
      return null;
    }

    const npcConfig = {
      mapX: entryPoint.x,
      mapY: entryPoint.y,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      mapCenterX: this.mapCenterX,
      mapCenterY: this.mapCenterY,
      mapData: this.mapData,
      treeManager: this.treeManager
    };

    const npc = new NPC(this.nextNpcId++, this.scene, npcConfig);
    this.npcs.push(npc);

    console.log(`Spawned NPC ${npc.id} at (${entryPoint.x}, ${entryPoint.y})`);
    return npc;
  }

  /**
   * Finds a valid entry point on the map border
   * Entry points must not be water or elevated terrain
   */
  findValidEntryPoint() {
    const borderPositions = [];

    // Collect all border positions
    // Top border
    for (let x = 0; x < this.mapWidth; x++) {
      borderPositions.push({ x, y: 0 });
    }
    // Bottom border
    for (let x = 0; x < this.mapWidth; x++) {
      borderPositions.push({ x, y: this.mapHeight - 1 });
    }
    // Left border (excluding corners already added)
    for (let y = 1; y < this.mapHeight - 1; y++) {
      borderPositions.push({ x: 0, y });
    }
    // Right border (excluding corners already added)
    for (let y = 1; y < this.mapHeight - 1; y++) {
      borderPositions.push({ x: this.mapWidth - 1, y });
    }

    // Filter valid positions
    const validPositions = borderPositions.filter(pos => {
      // Check if mapData exists and has the required position
      if (!this.mapData || !this.mapData[pos.y] || !this.mapData[pos.y][pos.x]) {
        return false;
      }

      const tileData = this.mapData[pos.y][pos.x];
      const tileType = tileData.type;

      // Can't spawn on water or elevated terrain
      return tileType !== TILE_TYPES.WATER && tileType !== TILE_TYPES.ROCK && tileType !== TILE_TYPES.SNOW;
    });

    // Return random valid position
    if (validPositions.length > 0) {
      return validPositions[Math.floor(Math.random() * validPositions.length)];
    }

    return null;
  }

  /**
   * Gets all NPCs
   */
  getAllNPCs() {
    return [...this.npcs];
  }

  /**
   * Gets NPCs by state
   */
  getNPCsByState(state) {
    return this.npcs.filter(npc => npc.getState() === state);
  }

  /**
   * Gets total number of NPCs
   */
  getNPCCount() {
    return this.npcs.length;
  }

  /**
   * Gets count of NPCs in each state
   */
  getStateCounts() {
    const counts = {};
    Object.values(NPC_STATES).forEach(state => {
      counts[state] = this.getNPCsByState(state).length;
    });
    return counts;
  }

  /**
   * Removes an NPC by ID
   */
  removeNPC(npcId) {
    const index = this.npcs.findIndex(npc => npc.id === npcId);
    if (index !== -1) {
      this.npcs[index].destroy();
      this.npcs.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Removes all NPCs
   */
  clearAllNPCs() {
    this.npcs.forEach(npc => npc.destroy());
    this.npcs = [];
  }

  /**
   * Updates spawn configuration
   */
  updateSpawnConfig(config) {
    this.spawnConfig = { ...this.spawnConfig, ...config };
  }
} 