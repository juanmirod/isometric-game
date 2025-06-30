/**
 * Tree management system for the isometric game
 * Handles tree positioning, tracking, and removal
 */

export class TreeManager {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.mapWidth = config.mapWidth || 50;
    this.mapHeight = config.mapHeight || 50;
    this.tileWidth = config.tileWidth || 128;
    this.tileHeight = config.tileHeight || 64;
    this.mapCenterX = config.mapCenterX || scene.cameras.main.width / 2;
    this.mapCenterY = config.mapCenterY || scene.cameras.main.height / 4;

    // Array to store all tree instances for management
    this.trees = [];

    // Tree spawn probability (0-1)
    this.spawnProbability = 0.2; // 20% chance to spawn a tree on grass

    // Available tree types
    this.treeTypes = ['tree_1', 'tree_2'];
  }

  /**
   * Generates trees on the map based on terrain data
   * @param {Array} map - 2D array representing the terrain map
   */
  generateTrees(map) {
    this.clearAllTrees();

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileType = map[y][x];

        if (this.canSpawnTreeOnTile(tileType) && Math.random() < this.spawnProbability) {
          this.spawnTree(x, y);
        }
      }
    }
  }

  /**
   * Spawns a single tree at the specified map coordinates
   * @param {number} mapX - X coordinate on the map grid
   * @param {number} mapY - Y coordinate on the map grid
   * @returns {Object} Tree object with sprite and metadata
   */
  spawnTree(mapX, mapY) {
    const isoPosition = this.mapToIsometric(mapX, mapY);
    const treeType = this.getRandomTreeType();

    const treeSprite = this.scene.add.image(isoPosition.x, isoPosition.y, treeType);
    treeSprite.setOrigin(0.5, 1);

    const treeData = {
      sprite: treeSprite,
      mapX: mapX,
      mapY: mapY,
      type: treeType,
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
   * @returns {Object} Object with x and y screen coordinates
   */
  mapToIsometric(mapX, mapY) {
    const isoX = (mapX - mapY) * this.tileWidth / 2;
    const isoY = (mapX + mapY) * this.tileHeight / 2;

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
   * Sets the tree spawn probability
   * @param {number} probability - Probability value between 0 and 1
   */
  setSpawnProbability(probability) {
    this.spawnProbability = Math.max(0, Math.min(1, probability));
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
} 