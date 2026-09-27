import { describe, expect, it, beforeEach } from 'vitest';
import { getCutoutRect, placePopover } from './positioning';

describe('getCutoutRect', () => {
  it('expands the target rect by the given padding on every side', () => {
    const target = { top: 100, left: 100, width: 200, height: 50 };
    const cutout = getCutoutRect(target, 8);
    expect(cutout).toEqual({ top: 92, left: 92, width: 216, height: 66 });
  });
});

describe('placePopover', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  });

  it('places the popover below the cutout when there is room', () => {
    const cutout = { top: 100, left: 100, width: 200, height: 50 };
    const placement = placePopover(cutout, { width: 300, height: 160 }, 'auto');
    expect(placement.side).toBe('bottom');
    expect(placement.top).toBeGreaterThan(cutout.top + cutout.height);
  });

  it('falls back to top when there is no room below', () => {
    const cutout = { top: 700, left: 100, width: 200, height: 90 };
    const placement = placePopover(cutout, { width: 300, height: 160 }, 'auto');
    expect(placement.side).toBe('top');
  });

  it('never places the popover outside the viewport horizontally', () => {
    const cutout = { top: 100, left: 1150, width: 40, height: 40 };
    const placement = placePopover(cutout, { width: 300, height: 160 }, 'auto');
    expect(placement.left).toBeGreaterThanOrEqual(0);
    expect(placement.left + placement.width).toBeLessThanOrEqual(1200);
  });
});
