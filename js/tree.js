import Phaser from 'phaser';
import {
  TREE_WIDTH,
  TREE_HEIGHT,
  TREE_TRUNK_WIDTH,
  TREE_TRUNK_HEIGHT,
  TREE_TRUNK_COLOR,
  TREE_LEAVES_COLOR
} from './const.js';

export function generateTreeTexture(scene, options) {
  const {
    name = 'tree',
    width = TREE_WIDTH,
    height = TREE_HEIGHT,
    trunkWidth = TREE_TRUNK_WIDTH,
    trunkHeight = TREE_TRUNK_HEIGHT,
    trunkColor = TREE_TRUNK_COLOR, // SaddleBrown
    leavesColor = TREE_LEAVES_COLOR, // ForestGreen
    leavesShape = 'circle' // or 'triangle'
  } = options;

  const graphics = scene.add.graphics();

  // Draw trunk
  graphics.fillStyle(trunkColor, 1);
  graphics.fillRect((width - trunkWidth) / 2, height - trunkHeight, trunkWidth, trunkHeight);

  // Draw leaves
  graphics.fillStyle(leavesColor, 1);
  const leavesHeight = height - trunkHeight;

  if (leavesShape === 'circle') {
    graphics.fillCircle(width / 2, leavesHeight / 2, leavesHeight / 2);
  } else if (leavesShape === 'triangle') {
    const path = new Phaser.Geom.Polygon([
      new Phaser.Geom.Point(width / 2, 0),
      new Phaser.Geom.Point(width, leavesHeight),
      new Phaser.Geom.Point(0, leavesHeight),
    ]);
    graphics.fillPoints(path.points, true);
  }

  graphics.generateTexture(name, width, height);
  graphics.destroy();
} 