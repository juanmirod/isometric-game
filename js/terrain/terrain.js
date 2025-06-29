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

  switch (side) {
    case 0: // Top coastline
      for (let x = 0; x < width; x++) {
        const depth = Math.floor(Math.random() * maxDepth) + 1;
        for (let y = 0; y < depth; y++) {
          coastline.add(`${x},${y}`);
        }
      }
      break;
    case 1: // Right coastline
      for (let y = 0; y < height; y++) {
        const depth = Math.floor(Math.random() * maxDepth) + 1;
        for (let x = width - depth; x < width; x++) {
          coastline.add(`${x},${y}`);
        }
      }
      break;
    case 2: // Bottom coastline
      for (let x = 0; x < width; x++) {
        const depth = Math.floor(Math.random() * maxDepth) + 1;
        for (let y = height - depth; y < height; y++) {
          coastline.add(`${x},${y}`);
        }
      }
      break;
    case 3: // Left coastline
      for (let y = 0; y < height; y++) {
        const depth = Math.floor(Math.random() * maxDepth) + 1;
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
      map[y][x] = tileType;
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