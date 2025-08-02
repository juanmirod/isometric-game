import Phaser from 'phaser';
import { generateMap, TILE_COLORS } from './terrain/terrain.js';
import { generateTreeTexture } from './tree.js';
import { TreeManager } from './trees/trees.js';
import { NPCManager } from './npcs/npcs.js';

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
    const heightOffset = 20; // Vertical offset per height level

    // Store tiles for proper depth sorting
    const tilesToRender = [];

    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tileData = map[y][x];
        const tileType = tileData.type;
        const tileHeight = tileData.height;

        const isoX = (x - y) * this.tileWidth / 2;
        const isoY = (x + y) * this.tileHeight / 2 - (tileHeight * heightOffset);

        tilesToRender.push({
          x: mapCenterX + isoX,
          y: mapCenterY + isoY,
          type: tileType,
          height: tileHeight,
          sortKey: y * this.mapWidth + x, // Sort by position for drawing from back to front
          mapX: x,
          mapY: y
        });
      }
    }

    // Sort tiles for proper rendering order (back to front)
    tilesToRender.sort((a, b) => a.sortKey - b.sortKey);

    // Render tiles in sorted order
    tilesToRender.forEach(tileInfo => {
      const { x: tileX, y: tileY, mapX, mapY, type, height } = tileInfo;
      const container = this.add.container(tileX, tileY);
      // Fix depth calculation: higher tiles should have higher depth values to render in front
      container.setDepth(tileY + (height * heightOffset));

      // Draw tile sides if elevated
      if (height > 0) {
        const graphics = this.add.graphics();
        const tileColor = TILE_COLORS[type];
        const rightSideColor = Phaser.Display.Color.ValueToColor(tileColor).darken(20).color;
        const leftSideColor = Phaser.Display.Color.ValueToColor(tileColor).darken(40).color;

        const neighbors = [
          { x: mapX + 1, y: mapY, side: 'bottom_left' },  // SE
          { x: mapX, y: mapY + 1, side: 'bottom_right' }, // SW
          { x: mapX - 1, y: mapY, side: 'top_right' },   // NW
          { x: mapX, y: mapY - 1, side: 'top_left' }    // NE
        ];

        neighbors.forEach(n => {
          let neighborHeight = 0;
          if (n.x >= 0 && n.x < this.mapWidth && n.y >= 0 && n.y < this.mapHeight) {
            neighborHeight = map[n.y][n.x].height;
          }

          if (height > neighborHeight) {
            const sideHeight = (height - neighborHeight) * heightOffset;

            switch (n.side) {
              case 'bottom_left': // SE face
                graphics.fillStyle(rightSideColor, 1);
                graphics.beginPath();
                graphics.moveTo(this.tileWidth / 2, 0);
                graphics.lineTo(0, this.tileHeight / 2);
                graphics.lineTo(0, this.tileHeight / 2 + sideHeight);
                graphics.lineTo(this.tileWidth / 2, sideHeight);
                graphics.closePath();
                graphics.fillPath();
                break;
              case 'bottom_right': // SW face
                graphics.fillStyle(leftSideColor, 1);
                graphics.beginPath();
                graphics.moveTo(-this.tileWidth / 2, 0);
                graphics.lineTo(0, this.tileHeight / 2);
                graphics.lineTo(0, this.tileHeight / 2 + sideHeight);
                graphics.lineTo(-this.tileWidth / 2, sideHeight);
                graphics.closePath();
                graphics.fillPath();
                break;
              case 'top_right': // NW face
                graphics.fillStyle(leftSideColor, 1);
                graphics.beginPath();
                graphics.moveTo(-this.tileWidth / 2, 0);
                graphics.lineTo(0, -this.tileHeight / 2);
                graphics.lineTo(0, -this.tileHeight / 2 + sideHeight);
                graphics.lineTo(-this.tileWidth / 2, sideHeight);
                graphics.closePath();
                graphics.fillPath();
                break;
              case 'top_left': // NE face
                graphics.fillStyle(rightSideColor, 1);
                graphics.beginPath();
                graphics.moveTo(this.tileWidth / 2, 0);
                graphics.lineTo(0, -this.tileHeight / 2);
                graphics.lineTo(0, -this.tileHeight / 2 + sideHeight);
                graphics.lineTo(this.tileWidth / 2, sideHeight);
                graphics.closePath();
                graphics.fillPath();
                break;
            }
          }
        });

        container.add(graphics);
      }

      // Draw tile top
      const tileTop = this.add.image(0, 0, type);
      tileTop.setOrigin(0.5, 0.5);
      container.add(tileTop);
    });

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