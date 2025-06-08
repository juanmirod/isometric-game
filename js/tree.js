import Phaser from 'phaser';

export function generateTreeTexture(scene, options) {
  const {
    name = 'tree',
    width = 32,
    height = 64,
    trunkWidth = 8,
    trunkHeight = 20,
    trunkColor = 0x8B4513, // SaddleBrown
    leavesColor = 0x228B22, // ForestGreen
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