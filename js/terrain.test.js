import { describe, it, expect } from 'vitest';
import { generateMap, TILE_TYPES } from './terrain';

describe('generateMap', () => {
  it('should generate a map with the correct dimensions', () => {
    const width = 10;
    const height = 10;
    const map = generateMap(width, height);

    expect(map).toHaveLength(height);
    map.forEach(row => {
      expect(row).toHaveLength(width);
    });
  });

  it('should only contain valid tile types', () => {
    const width = 10;
    const height = 10;
    const map = generateMap(width, height);
    const validTileTypes = Object.values(TILE_TYPES);

    map.forEach(row => {
      row.forEach(tile => {
        expect(validTileTypes).toContain(tile);
      });
    });
  });
}); 