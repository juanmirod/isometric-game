import { createNoise2D } from 'simplex-noise';

export const TILE_TYPES = {
  WATER: 'water',
  SAND: 'sand',
  GRASS: 'grass',
  ROCK: 'rock',
  SNOW: 'snow'
};

export const TILE_COLORS = {
  [TILE_TYPES.WATER]: 0x0066cc,
  [TILE_TYPES.SAND]: 0xf4d03f,
  [TILE_TYPES.GRASS]: 0x27ae60,
  [TILE_TYPES.ROCK]: 0x839192,
  [TILE_TYPES.SNOW]: 0xfdfefe
};

export const TILE_HEIGHTS = {
  [TILE_TYPES.WATER]: 0,
  [TILE_TYPES.SAND]: 0,
  [TILE_TYPES.GRASS]: 0,
  [TILE_TYPES.ROCK]: [1, 2], // Rock can be level 1 or 2
  [TILE_TYPES.SNOW]: 2       // Snow is only at level 2
};

export const CLIMATE_TYPES = {
  DESERT: 'desert',
  PRAIRIE: 'prairie',
  SPARSE_FOREST: 'sparse_forest',
  DENSE_FOREST: 'dense_forest',
  HIGH_MOUNTAIN: 'high_mountain'
};

export const CLIMATE_TILE_RULES = {
  [CLIMATE_TYPES.DESERT]: {
    forbidden: [TILE_TYPES.GRASS],
    primary: TILE_TYPES.SAND,
    secondary: TILE_TYPES.ROCK,
    thresholds: { sand: -0.6, rock: 0.3, snow: 0.8 }
  },
  [CLIMATE_TYPES.PRAIRIE]: {
    forbidden: [TILE_TYPES.ROCK, TILE_TYPES.SAND, TILE_TYPES.SNOW],
    primary: TILE_TYPES.GRASS,
    secondary: TILE_TYPES.GRASS,
    thresholds: { grass: -1.0, rock: 1.0, snow: 1.0 }
  },
  [CLIMATE_TYPES.SPARSE_FOREST]: {
    forbidden: [TILE_TYPES.SAND],
    primary: TILE_TYPES.GRASS,
    secondary: TILE_TYPES.ROCK,
    thresholds: { grass: -0.2, rock: 0.6, snow: 0.9 }
  },
  [CLIMATE_TYPES.DENSE_FOREST]: {
    forbidden: [TILE_TYPES.SAND],
    primary: TILE_TYPES.GRASS,
    secondary: TILE_TYPES.ROCK,
    thresholds: { grass: 0.2, rock: 0.7, snow: 0.9 }
  },
  [CLIMATE_TYPES.HIGH_MOUNTAIN]: {
    forbidden: [TILE_TYPES.SAND],
    primary: TILE_TYPES.ROCK,
    secondary: TILE_TYPES.SNOW,
    thresholds: { grass: -0.3, rock: 0.4, snow: 0.6 }
  }
};

function selectClimate() {
  const climates = Object.values(CLIMATE_TYPES);
  return climates[Math.floor(Math.random() * climates.length)];
}

function shouldHaveRiver() {
  return Math.random() < 0.6; // 60% chance
}

function shouldHaveCoastline() {
  return Math.random() < 0.3; // 30% chance
}

function generateRiverPath(width, height) {
  const river = new Set();
  const startX = Math.floor(Math.random() * width);
  const startY = 0;

  let currentX = startX;
  let currentY = startY;

  // Generate a winding river from top to bottom
  while (currentY < height) {
    // Add current position and some width around it
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const x = currentX + dx;
        const y = currentY + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          river.add(`${x},${y}`);
        }
      }
    }

    // Move river position
    currentY++;
    currentX += Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    currentX = Math.max(1, Math.min(width - 2, currentX)); // Keep within bounds
  }

  return river;
}

function generateCoastline(width, height) {
  const coastline = new Set();
  const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

  // Determine coastline depth (how far inland it goes)
  const maxDepth = Math.floor(Math.min(width, height) * 0.3);
  // minDepth should be almost the same to maxDepth to get a smooth coastline
  const minDepth = maxDepth - 2;

  switch (side) {
    case 0: // Top coastline
      for (let x = 0; x < width; x++) {
        const depth = Math.floor(Math.random() * (maxDepth - minDepth + 1)) + minDepth;
        for (let y = 0; y < depth; y++) {
          coastline.add(`${x},${y}`);
        }
      }
      break;
    case 1: // Right coastline
      for (let y = 0; y < height; y++) {
        const depth = Math.floor(Math.random() * (maxDepth - minDepth + 1)) + minDepth;
        for (let x = width - depth; x < width; x++) {
          coastline.add(`${x},${y}`);
        }
      }
      break;
    case 2: // Bottom coastline
      for (let x = 0; x < width; x++) {
        const depth = Math.floor(Math.random() * (maxDepth - minDepth + 1)) + minDepth;
        for (let y = height - depth; y < height; y++) {
          coastline.add(`${x},${y}`);
        }
      }
      break;
    case 3: // Left coastline
      for (let y = 0; y < height; y++) {
        const depth = Math.floor(Math.random() * (maxDepth - minDepth + 1)) + minDepth;
        for (let x = 0; x < depth; x++) {
          coastline.add(`${x},${y}`);
        }
      }
      break;
  }

  return coastline;
}

function isNearFeature(x, y, featureSet, distance = 2) {
  for (let dx = -distance; dx <= distance; dx++) {
    for (let dy = -distance; dy <= distance; dy++) {
      if (featureSet.has(`${x + dx},${y + dy}`)) {
        return true;
      }
    }
  }
  return false;
}

function getTileHeightForType(tileType, noiseValue) {
  const heightConfig = TILE_HEIGHTS[tileType];

  if (Array.isArray(heightConfig)) {
    // For rock tiles, use noise to determine if it's level 1 or 2
    return noiseValue > 0.5 ? heightConfig[1] : heightConfig[0];
  }

  return heightConfig;
}

function getTileForClimate(noiseValue, climate, x, y, river, coastline) {
  const rules = CLIMATE_TILE_RULES[climate];
  const key = `${x},${y}`;

  // Water features take priority
  if (river.has(key)) {
    return TILE_TYPES.WATER;
  }

  if (coastline.has(key)) {
    return TILE_TYPES.WATER;
  }

  // Sand near coastline (but not in water)
  if (isNearFeature(x, y, coastline, 1)) {
    return TILE_TYPES.SAND;
  }

  // Sand near river for certain climates
  if (isNearFeature(x, y, river, 1) &&
    (climate === CLIMATE_TYPES.DESERT || climate === CLIMATE_TYPES.PRAIRIE)) {
    return TILE_TYPES.SAND;
  }

  // Apply climate-based tile selection
  let tileType;

  if (noiseValue < rules.thresholds.grass) {
    tileType = rules.primary;
  } else if (noiseValue < rules.thresholds.rock) {
    tileType = TILE_TYPES.GRASS;
  } else if (noiseValue < rules.thresholds.snow) {
    tileType = TILE_TYPES.ROCK;
  } else {
    tileType = TILE_TYPES.SNOW;
  }

  // Apply forbidden tile rules
  if (rules.forbidden.includes(tileType)) {
    // Replace with primary or secondary tile based on noise
    tileType = noiseValue > 0 ? rules.secondary : rules.primary;
  }

  return tileType;
}

export function generateMap(width, height) {
  const noise2D = createNoise2D();
  const map = [];
  const noiseScale = 0.1;

  // Generate terrain features
  const climate = selectClimate();
  const hasRiver = shouldHaveRiver();
  const hasCoastline = shouldHaveCoastline();

  const river = hasRiver ? generateRiverPath(width, height) : new Set();
  const coastline = hasCoastline ? generateCoastline(width, height) : new Set();

  // Generate the map
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      const noiseValue = noise2D(x * noiseScale, y * noiseScale);
      const tileType = getTileForClimate(noiseValue, climate, x, y, river, coastline);
      const tileHeight = getTileHeightForType(tileType, noiseValue);

      map[y][x] = {
        type: tileType,
        height: tileHeight
      };
    }
  }

  return {
    map,
    metadata: {
      climate,
      hasRiver,
      hasCoastline
    }
  };
}

export class TerrainRenderer {
  constructor(scene, config) {
    this.scene = scene;
    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;
    this.mapWidth = config.mapWidth;
    this.mapHeight = config.mapHeight;
    this.heightOffset = config.heightOffset;
  }

  generateTileTextures() {
    for (const [name, color] of Object.entries(TILE_COLORS)) {
      let graphics = this.scene.add.graphics();
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

  renderMap(map, mapCenterX, mapCenterY) {
    const heightOffset = this.heightOffset;

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
      const container = this.scene.add.container(tileX, tileY);
      // Fix depth calculation: higher tiles should have higher depth values to render in front
      container.setDepth(tileY + (height * heightOffset));

      // Draw tile sides if elevated
      if (height > 0) {
        const graphics = this.scene.add.graphics();
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
      const tileTop = this.scene.add.image(0, 0, type);
      tileTop.setOrigin(0.5, 0.5);
      container.add(tileTop);
    });

    // Center camera on the map
    const totalHeight = (this.mapWidth + this.mapHeight) * this.tileHeight / 2;
    this.scene.cameras.main.centerOn(mapCenterX, mapCenterY + totalHeight / 2 - this.tileHeight / 2);
  }
} 