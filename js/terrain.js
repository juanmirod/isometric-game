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

export function generateMap(width, height) {
  const noise2D = createNoise2D();
  const map = [];
  const noiseScale = 0.1;
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      const value = noise2D(x * noiseScale, y * noiseScale);
      let tile;
      if (value < -0.5) tile = TILE_TYPES.WATER;
      else if (value < -0.2) tile = TILE_TYPES.SAND;
      else if (value < 0.5) tile = TILE_TYPES.GRASS;
      else if (value < 0.8) tile = TILE_TYPES.ROCK;
      else tile = TILE_TYPES.SNOW;
      map[y][x] = tile;
    }
  }
  return map;
} 