import Phaser from 'phaser';
import { generateMap, TerrainRenderer } from './terrain/terrain.js';
import { generateTreeTexture } from './tree.js';
import { TreeManager } from './trees/trees.js';
import { NPCManager } from './npcs/npcs.js';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  HEIGHT_OFFSET,
  DEFAULT_MAP_WIDTH,
  DEFAULT_MAP_HEIGHT,
  TREE_LEAVES_COLOR_ALT
} from './const.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.tileWidth = TILE_WIDTH;
    this.tileHeight = TILE_HEIGHT;
    this.mapWidth = DEFAULT_MAP_WIDTH;
    this.mapHeight = DEFAULT_MAP_HEIGHT;
  }

  preload() {
    // Initialize terrain renderer
    this.terrainRenderer = new TerrainRenderer(this, {
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      heightOffset: HEIGHT_OFFSET
    });

    this.terrainRenderer.generateTileTextures();
    generateTreeTexture(this, { name: 'tree_1', leavesShape: 'circle' });
    generateTreeTexture(this, { name: 'tree_2', leavesShape: 'triangle', leavesColor: TREE_LEAVES_COLOR_ALT });
  }

  create() {
    const terrainData = generateMap(this.mapWidth, this.mapHeight);

    // Render terrain using terrain renderer
    const mapCenterX = this.cameras.main.width / 2;
    const mapCenterY = this.cameras.main.height / 4;
    this.terrainRenderer.renderMap(terrainData.map, mapCenterX, mapCenterY);

    // Initialize tree manager
    this.treeManager = new TreeManager(this, {
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      mapCenterX: mapCenterX,
      mapCenterY: mapCenterY
    });

    // Generate trees on the map with climate information
    this.treeManager.generateTrees(terrainData.map, terrainData.metadata.climate);

    // Initialize NPC manager
    this.npcManager = new NPCManager(this, {
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      mapCenterX: mapCenterX,
      mapCenterY: mapCenterY,
      mapData: terrainData.map,
      treeManager: this.treeManager,
      maxNpcs: 300,
      spawnInterval: 2000 // 8 seconds
    });

    this.cameras.main.setZoom(0.5);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.zoomKeys = this.input.keyboard.addKeys('W,S');

    this.add.text(10, 10, 'Use arrow keys to pan the camera.', { font: '16px Courier', fill: '#ffffff' }).setScrollFactor(0);
    this.add.text(10, 30, 'Use W/S to zoom in/out.', { font: '16px Courier', fill: '#ffffff' }).setScrollFactor(0);

    // Display terrain information
    const { climate, hasRiver, hasCoastline } = terrainData.metadata;
    this.add.text(10, 50, `Climate: ${climate.replace('_', ' ')}`, { font: '16px Courier', fill: '#ffffff' }).setScrollFactor(0);
    this.add.text(10, 70, `River: ${hasRiver ? 'Yes' : 'No'}`, { font: '16px Courier', fill: '#ffffff' }).setScrollFactor(0);
    this.add.text(10, 90, `Coastline: ${hasCoastline ? 'Yes' : 'No'}`, { font: '16px Courier', fill: '#ffffff' }).setScrollFactor(0);
    this.add.text(10, 110, `Trees: ${this.treeManager.getTreeCount()}`, { font: '16px Courier', fill: '#ffffff' }).setScrollFactor(0);
    this.add.text(10, 130, `NPCs: ${this.npcManager.getNPCCount()}`, { font: '16px Courier', fill: '#ffffff' }).setScrollFactor(0);
  }

  update(time) {
    // Update NPCs
    if (this.npcManager) {
      this.npcManager.update(time);
    }

    const speed = 10;
    if (this.cursors.left.isDown) {
      this.cameras.main.scrollX -= speed;
    } else if (this.cursors.right.isDown) {
      this.cameras.main.scrollX += speed;
    }

    if (this.cursors.up.isDown) {
      this.cameras.main.scrollY -= speed;
    } else if (this.cursors.down.isDown) {
      this.cameras.main.scrollY += speed;
    }

    const zoomSpeed = 0.01;
    if (this.zoomKeys.W.isDown) {
      this.cameras.main.zoom += zoomSpeed;
    } else if (this.zoomKeys.S.isDown) {
      this.cameras.main.zoom -= zoomSpeed;
    }
  }


}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [GameScene]
};

const game = new Phaser.Game(config); 