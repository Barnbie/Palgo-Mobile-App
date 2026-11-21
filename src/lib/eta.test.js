import { describeEta, distanceKm, isFresh } from './eta';

describe('eta', () => {
  it('measures distance', () => {
    expect(distanceKm({ latitude: 6.5, longitude: 3.3 }, { latitude: 6.5, longitude: 3.3 })).toBe(
      0,
    );
    const km = distanceKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 });
    expect(km).toBeGreaterThan(111);
    expect(km).toBeLessThan(111.5);
    expect(distanceKm(null, { latitude: 0, longitude: 0 })).toBeNull();
  });
  it('turns distance into minutes', () => {
    expect(describeEta(0.05)).toEqual({ arrived: true, minutes: 0 });
    expect(describeEta(5).minutes).toBe(20); // 5 km * 1.3 / 20 km/h
    expect(describeEta(0.3).minutes).toBe(1);
    expect(describeEta(null)).toBeNull();
  });
  it('knows when a position is stale', () => {
    const now = Date.now();
    expect(isFresh(new Date(now - 60000).toISOString(), now)).toBe(true);
    expect(isFresh(new Date(now - 10 * 60000).toISOString(), now)).toBe(false);
    expect(isFresh(null, now)).toBe(false);
  });
});
