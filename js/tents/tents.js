/**
 * Tent management system for the isometric game
 * Handles tent creation and tracking for NPCs that have settled
 */

import {
  TILE_WIDTH,
  TILE_HEIGHT,
  TENT_WIDTH,
  TENT_HEIGHT,
  TENT_COLOR,
  DEFAULT_MAP_WIDTH,
  DEFAULT_MAP_HEIGHT
} from '../const.js';

/**
 * Individual Tent class representing a static tent object
 */
export class Tent {
  constructor(id, scene, config = {}) {
    this.id = id;
    this.scene = scene;
    this.mapX = config.mapX || 0;
    this.mapY = config.mapY || 0;
    this.sprite = null;

    // Tent appearance
    this.width = config.width || TENT_WIDTH;
    this.height = config.height || TENT_HEIGHT;
    this.color = config.color || TENT_COLOR;

    // Map references
    this.mapWidth = config.mapWidth || DEFAULT_MAP_WIDTH;
    this.mapHeight = config.mapHeight || DEFAULT_MAP_HEIGHT;
    this.tileWidth = config.tileWidth || TILE_WIDTH;
    this.tileHeight = config.tileHeight || TILE_HEIGHT;
    this.mapCenterX = config.mapCenterX || scene.cameras.main.width / 2;
    this.mapCenterY = config.mapCenterY || scene.cameras.main.height / 4;

    // References to game data
    this.mapData = config.mapData || [];

    this.createSprite();
  }

  /**
   * Creates the visual representation of the tent
   */
  createSprite() {
    // Create yellow square texture
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(this.color, 1);
    graphics.fillRect(0, 0, this.width, this.height);
    graphics.generateTexture(`tent_${this.id}`, this.width, this.height);
    graphics.destroy();

    // Create sprite
    const isoPosition = this.mapToIsometric(this.mapX, this.mapY);
    this.sprite = this.scene.add.image(isoPosition.x, isoPosition.y, `tent_${this.id}`);
    this.sprite.setOrigin(0.5, 1);

    // Set depth to ensure tent appears above terrain but below trees and NPCs
    this.updateDepth();
  }

  /**
   * Updates sprite depth for proper rendering order
   */
  updateDepth() {
    if (!this.sprite) return;

    // Check if position is within map bounds
    if (this.mapY < 0 || this.mapY >= this.mapHeight || this.mapX < 0 || this.mapX >= this.mapWidth) return;

    const tileData = this.mapData[this.mapY][this.mapX];
    if (!tileData) return;

    const tileHeight = tileData.height;
    const sortKey = this.mapY * this.mapWidth + this.mapX - tileHeight * 1000;
    // Place tents above terrain (+15000) but below trees (+10000) and NPCs (+20000)
    const tentDepth = tileHeight * 100 + sortKey + 15000;
    this.sprite.setDepth(tentDepth);
  }

  /**
   * Converts map coordinates to isometric screen coordinates
   */
  mapToIsometric(mapX, mapY) {
    // Check bounds to prevent undefined access
    if (mapY < 0 || mapY >= this.mapHeight || mapX < 0 || mapX >= this.mapWidth ||
      !this.mapData || !this.mapData[mapY] || !this.mapData[mapY][mapX]) {
      // Use default height of 0 for out-of-bounds or missing data
      const tileHeight = 0;
      const heightOffset = 20;

      const isoX = (mapX - mapY) * this.tileWidth / 2;
      const isoY = (mapX + mapY) * this.tileHeight / 2 - (tileHeight * heightOffset);

      return {
        x: this.mapCenterX + isoX,
        y: this.mapCenterY + isoY
      };
    }

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
   * Destroys the tent sprite
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }

  /**
   * Gets the tent ID
   */
  getId() {
    return this.id;
  }

  /**
   * Gets the tent position
   */
  getPosition() {
    return { x: this.mapX, y: this.mapY };
  }
}

/**
 * Tent Manager class to handle multiple tents
 */
export class TentManager {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.mapWidth = config.mapWidth || DEFAULT_MAP_WIDTH;
    this.mapHeight = config.mapHeight || DEFAULT_MAP_HEIGHT;
    this.tileWidth = config.tileWidth || TILE_WIDTH;
    this.tileHeight = config.tileHeight || TILE_HEIGHT;
    this.mapCenterX = config.mapCenterX || scene.cameras.main.width / 2;
    this.mapCenterY = config.mapCenterY || scene.cameras.main.height / 4;

    this.tents = [];
    this.nextTentId = 1;
    this.mapData = config.mapData || [];
  }

  /**
   * Creates a new tent at the specified coordinates
   */
  createTent(mapX, mapY) {
    // Validate position is within map bounds
    if (mapX < 0 || mapX >= this.mapWidth || mapY < 0 || mapY >= this.mapHeight) {
      console.warn(`Cannot create tent at invalid position (${mapX}, ${mapY})`);
      return null;
    }

    // Check if mapData exists and has the required position
    if (!this.mapData || !this.mapData[mapY] || !this.mapData[mapY][mapX]) {
      console.warn(`No map data available for tent position (${mapX}, ${mapY})`);
      return null;
    }

    const tentConfig = {
      mapX: mapX,
      mapY: mapY,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      mapCenterX: this.mapCenterX,
      mapCenterY: this.mapCenterY,
      mapData: this.mapData
    };

    const tent = new Tent(this.nextTentId++, this.scene, tentConfig);
    this.tents.push(tent);

    console.log(`Created tent ${tent.getId()} at (${mapX}, ${mapY})`);
    return tent;
  }

  /**
   * Gets all tents
   */
  getAllTents() {
    return [...this.tents];
  }

  /**
   * Gets total number of tents
   */
  getTentCount() {
    return this.tents.length;
  }

  /**
   * Gets tents at specific coordinates
   */
  getTentsAt(mapX, mapY) {
    return this.tents.filter(tent => {
      const pos = tent.getPosition();
      return pos.x === mapX && pos.y === mapY;
    });
  }

  /**
   * Removes a tent by ID
   */
  removeTent(tentId) {
    const index = this.tents.findIndex(tent => tent.getId() === tentId);
    if (index !== -1) {
      this.tents[index].destroy();
      this.tents.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Removes all tents
   */
  clearAllTents() {
    this.tents.forEach(tent => tent.destroy());
    this.tents = [];
  }
}