/**
 * Tree management system for the isometric game
 * Handles tree positioning, tracking, and removal
 */

import {
  TILE_WIDTH,
  TILE_HEIGHT,
  DEFAULT_MAP_WIDTH,
  DEFAULT_MAP_HEIGHT
} from '../const.js';

export class TreeManager {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.mapWidth = config.mapWidth || DEFAULT_MAP_WIDTH;
    this.mapHeight = config.mapHeight || DEFAULT_MAP_HEIGHT;
    this.tileWidth = config.tileWidth || TILE_WIDTH;
    this.tileHeight = config.tileHeight || TILE_HEIGHT;
    this.mapCenterX = config.mapCenterX || scene.cameras.main.width / 2;
    this.mapCenterY = config.mapCenterY || scene.cameras.main.height / 4;

    // Array to store all tree instances for management
    this.trees = [];

    // Available tree types
    this.treeTypes = ['tree_1', 'tree_2'];

    // Climate-based tree spawning configuration
    this.climateTreeConfig = {
      'desert': {
        spawnProbability: 0.02, // Very few trees in desert
        maxTreesPerTile: 1,
        treeSpacing: 0.8 // Larger spacing between trees
      },
      'prairie': {
        spawnProbability: 0.15, // Some trees in prairie
        maxTreesPerTile: 2,
        treeSpacing: 0.6
      },
      'sparse_forest': {
        spawnProbability: 0.35, // Moderate tree density
        maxTreesPerTile: 3,
        treeSpacing: 0.4
      },
      'dense_forest': {
        spawnProbability: 0.65, // High tree density
        maxTreesPerTile: 5,
        treeSpacing: 0.2
      },
      'high_mountain': {
        spawnProbability: 0.08, // Few trees at high altitude
        maxTreesPerTile: 1,
        treeSpacing: 0.7
      }
    };

    // Default configuration for unknown climate types
    this.defaultTreeConfig = {
      spawnProbability: 0.2,
      maxTreesPerTile: 2,
      treeSpacing: 0.5
    };
  }

  /**
 * Generates trees on the map based on terrain data and climate
 * @param {Array} map - 2D array representing the terrain map
 * @param {string} climate - Climate type (e.g., 'dense_forest', 'prairie')
 */
  generateTrees(map, climate = 'prairie') {
    this.clearAllTrees();

    const config = this.climateTreeConfig[climate] || this.defaultTreeConfig;

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileData = map[y][x];
        const tileType = tileData.type;
        const tileHeight = tileData.height;

        if (this.canSpawnTreeOnTile(tileType)) {
          // Determine how many trees to spawn on this tile
          const treesToSpawn = this.calculateTreesForTile(config);

          for (let i = 0; i < treesToSpawn; i++) {
            this.spawnTreeWithRandomPosition(x, y, config, tileHeight);
          }
        }
      }
    }
  }

  /**
   * Calculates how many trees should spawn on a single tile based on configuration
   * @param {Object} config - Climate configuration object
   * @returns {number} Number of trees to spawn (0 or more)
   */
  calculateTreesForTile(config) {
    if (Math.random() >= config.spawnProbability) {
      return 0;
    }

    // For tiles that get trees, randomly determine how many (1 to maxTreesPerTile)
    return Math.floor(Math.random() * config.maxTreesPerTile) + 1;
  }

  /**
 * Spawns a single tree at the specified map coordinates with random positioning within the tile
 * @param {number} mapX - X coordinate on the map grid
 * @param {number} mapY - Y coordinate on the map grid
 * @param {Object} config - Climate configuration for positioning
 * @param {number} tileHeight - Height level of the tile (0-2)
 * @returns {Object} Tree object with sprite and metadata
 */
  spawnTreeWithRandomPosition(mapX, mapY, config, tileHeight = 0) {
    // Generate random offset within the tile
    const offsetX = (Math.random() - 0.5) * this.tileWidth * config.treeSpacing;
    const offsetY = (Math.random() - 0.5) * this.tileHeight * config.treeSpacing;

    return this.spawnTree(mapX, mapY, offsetX, offsetY, tileHeight);
  }

  /**
   * Spawns a single tree at the specified map coordinates with optional positioning offset
   * @param {number} mapX - X coordinate on the map grid
   * @param {number} mapY - Y coordinate on the map grid
   * @param {number} offsetX - X offset within the tile (default: 0)
   * @param {number} offsetY - Y offset within the tile (default: 0)
   * @param {number} tileHeight - Height level of the tile (0-2)
   * @returns {Object} Tree object with sprite and metadata
   */
  spawnTree(mapX, mapY, offsetX = 0, offsetY = 0, tileHeight = 0) {
    const isoPosition = this.mapToIsometric(mapX, mapY, tileHeight);
    const treeType = this.getRandomTreeType();

    // Apply positioning offset for more natural placement
    const finalX = isoPosition.x + offsetX;
    const finalY = isoPosition.y + offsetY;

    const treeSprite = this.scene.add.image(finalX, finalY, treeType);
    treeSprite.setOrigin(0.5, 1);

    // Set depth to ensure trees appear above terrain tiles
    // Use the same calculation as terrain but with a large offset to ensure trees are always on top
    const sortKey = mapY * this.mapWidth + mapX - tileHeight * 1000;
    const treeDepth = tileHeight * 100 + sortKey + 10000; // +10000 to ensure trees are above terrain
    treeSprite.setDepth(treeDepth);

    const treeData = {
      sprite: treeSprite,
      mapX: mapX,
      mapY: mapY,
      offsetX: offsetX,
      offsetY: offsetY,
      screenX: finalX,
      screenY: finalY,
      type: treeType,
      height: tileHeight,
      depth: treeDepth,
      id: this.generateTreeId()
    };

    this.trees.push(treeData);
    return treeData;
  }

  /**
   * Removes a tree by its ID
   * @param {string} treeId - Unique identifier of the tree
   * @returns {boolean} True if tree was found and removed, false otherwise
   */
  removeTreeById(treeId) {
    const treeIndex = this.trees.findIndex(tree => tree.id === treeId);

    if (treeIndex !== -1) {
      const tree = this.trees[treeIndex];
      tree.sprite.destroy();
      this.trees.splice(treeIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * Removes a tree at specific map coordinates
   * @param {number} mapX - X coordinate on the map grid
   * @param {number} mapY - Y coordinate on the map grid
   * @returns {boolean} True if tree was found and removed, false otherwise
   */
  removeTreeAt(mapX, mapY) {
    const treeIndex = this.trees.findIndex(tree => tree.mapX === mapX && tree.mapY === mapY);

    if (treeIndex !== -1) {
      const tree = this.trees[treeIndex];
      tree.sprite.destroy();
      this.trees.splice(treeIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * Gets a tree at specific map coordinates
   * @param {number} mapX - X coordinate on the map grid
   * @param {number} mapY - Y coordinate on the map grid
   * @returns {Object|null} Tree object or null if not found
   */
  getTreeAt(mapX, mapY) {
    return this.trees.find(tree => tree.mapX === mapX && tree.mapY === mapY) || null;
  }

  /**
   * Removes all trees from the map
   */
  clearAllTrees() {
    this.trees.forEach(tree => tree.sprite.destroy());
    this.trees = [];
  }

  /**
   * Gets all trees currently on the map
   * @returns {Array} Array of tree objects
   */
  getAllTrees() {
    return [...this.trees];
  }

  /**
   * Gets the total number of trees on the map
   * @returns {number} Number of trees
   */
  getTreeCount() {
    return this.trees.length;
  }

  /**
   * Converts map coordinates to isometric screen coordinates
   * @param {number} mapX - X coordinate on the map grid
   * @param {number} mapY - Y coordinate on the map grid
   * @param {number} tileHeight - Height level of the tile (0-2)
   * @returns {Object} Object with x and y screen coordinates
   */
  mapToIsometric(mapX, mapY, tileHeight = 0) {
    const heightOffset = 20; // Same offset as used in main.js
    const isoX = (mapX - mapY) * this.tileWidth / 2;
    const isoY = (mapX + mapY) * this.tileHeight / 2 - (tileHeight * heightOffset);

    return {
      x: this.mapCenterX + isoX,
      y: this.mapCenterY + isoY
    };
  }

  /**
   * Checks if a tree can spawn on the given tile type
   * @param {string} tileType - Type of the terrain tile
   * @returns {boolean} True if tree can spawn, false otherwise
   */
  canSpawnTreeOnTile(tileType) {
    // Trees can only spawn on grass tiles
    return tileType === 'grass';
  }

  /**
   * Gets a random tree type from available types
   * @returns {string} Random tree type
   */
  getRandomTreeType() {
    return this.treeTypes[Math.floor(Math.random() * this.treeTypes.length)];
  }

  /**
   * Generates a unique ID for a tree
   * @returns {string} Unique tree identifier
   */
  generateTreeId() {
    return `tree_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sets the tree spawn probability for a specific climate
   * @param {string} climate - Climate type
   * @param {number} probability - Probability value between 0 and 1
   */
  setClimateSpawnProbability(climate, probability) {
    if (this.climateTreeConfig[climate]) {
      this.climateTreeConfig[climate].spawnProbability = Math.max(0, Math.min(1, probability));
    }
  }

  /**
   * Gets the tree configuration for a climate
   * @param {string} climate - Climate type
   * @returns {Object} Climate tree configuration
   */
  getClimateConfig(climate) {
    return this.climateTreeConfig[climate] || this.defaultTreeConfig;
  }

  /**
   * Helper function to calculate isometric distance between two points
   * @param {number} x1 - X coordinate of the first point
   * @param {number} y1 - Y coordinate of the first point
   * @param {number} x2 - X coordinate of the second point
   * @param {number} y2 - Y coordinate of the second point
   * @returns {number} The calculated distance
   */
  distance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Gets all trees within a certain radius of a map coordinate
   * @param {number} mapX - X coordinate on the map grid
   * @param {number} mapY - Y coordinate on the map grid
   * @param {number} radius - Radius in map tiles
   * @returns {Array} Array of tree objects within the radius
   */
  getTreesInRadius(mapX, mapY, radius) {
    const centerIso = this.mapToIsometric(mapX, mapY);

    return this.trees.filter(tree => {
      const distance = this.distance(
        centerIso.x,
        centerIso.y,
        tree.screenX,
        tree.screenY
      );
      return distance <= radius * (this.tileWidth / 2);
    });
  }

  /**
   * Removes all trees within a certain radius of a map coordinate
   * @param {number} mapX - X coordinate on the map grid
   * @param {number} mapY - Y coordinate on the map grid
   * @param {number} radius - Radius in map tiles
   * @returns {number} Number of trees removed
   */
  removeTreesInRadius(mapX, mapY, radius) {
    const centerIso = this.mapToIsometric(mapX, mapY);
    let removedCount = 0;

    this.trees = this.trees.filter(tree => {
      const distance = this.distance(
        centerIso.x,
        centerIso.y,
        tree.screenX,
        tree.screenY
      );
      if (distance <= radius * (this.tileWidth / 2)) {
        tree.sprite.destroy();
        removedCount++;
        return false;
      }
      return true;
    });

    return removedCount;
  }

  /**
   * Adds a new tree type to the available types
   * @param {string} treeType - Name of the tree texture
   */
  addTreeType(treeType) {
    if (!this.treeTypes.includes(treeType)) {
      this.treeTypes.push(treeType);
    }
  }

  /**
   * Updates climate configuration for a specific climate type
   * @param {string} climate - Climate type
   * @param {Object} config - Configuration object
   */
  updateClimateConfig(climate, config) {
    if (this.climateTreeConfig[climate]) {
      this.climateTreeConfig[climate] = { ...this.climateTreeConfig[climate], ...config };
    } else {
      this.climateTreeConfig[climate] = { ...this.defaultTreeConfig, ...config };
    }
  }
} 