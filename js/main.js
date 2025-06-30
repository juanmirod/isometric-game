import Phaser from 'phaser';
import { generateMap, TILE_COLORS } from './terrain/terrain.js';
import { generateTreeTexture } from './tree.js';
import { TreeManager } from './trees/trees.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.tileWidth = 128;
    this.tileHeight = 64;
    this.mapWidth = 50;
    this.mapHeight = 50;
  }

  preload() {
    this.generateTileTextures();
    generateTreeTexture(this, { name: 'tree_1', leavesShape: 'circle' });
    generateTreeTexture(this, { name: 'tree_2', leavesShape: 'triangle', leavesColor: 0x006400 });
  }

  create() {
    const terrainData = generateMap(this.mapWidth, this.mapHeight);
    this.drawMap(terrainData.map);

    // Initialize tree manager
    const mapCenterX = this.cameras.main.width / 2;
    const mapCenterY = this.cameras.main.height / 4;

    this.treeManager = new TreeManager(this, {
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      tileWidth: this.tileWidth,
      tileHeight: this.tileHeight,
      mapCenterX: mapCenterX,
      mapCenterY: mapCenterY
    });

    // Generate trees on the map
    this.treeManager.generateTrees(terrainData.map);

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
  }

  update() {
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

  generateTileTextures() {
    for (const [name, color] of Object.entries(TILE_COLORS)) {
      let graphics = this.add.graphics();
      graphics.fillStyle(color, 1);
      graphics.beginPath();
      graphics.moveTo(0, this.tileHeight / 2);
      graphics.lineTo(this.tileWidth / 2, 0);
      graphics.lineTo(this.tileWidth, this.tileHeight / 2);
      graphics.lineTo(this.tileWidth / 2, this.tileHeight);
      graphics.closePath();
      graphics.fillPath();
      graphics.generateTexture(name, this.tileWidth, this.tileHeight);
      graphics.destroy();
    }
  }

  drawMap(map) {
    const mapCenterX = this.cameras.main.width / 2;
    const mapCenterY = this.cameras.main.height / 4;

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileType = map[y][x];
        const isoX = (x - y) * this.tileWidth / 2;
        const isoY = (x + y) * this.tileHeight / 2;

        const tile = this.add.image(mapCenterX + isoX, mapCenterY + isoY, tileType);
        tile.setOrigin(0.5, 0.5);
      }
    }

    // Center camera on the map
    const totalHeight = (this.mapWidth + this.mapHeight) * this.tileHeight / 2;
    this.cameras.main.centerOn(mapCenterX, mapCenterY + totalHeight / 2 - this.tileHeight / 2);
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: [GameScene]
};

const game = new Phaser.Game(config); 