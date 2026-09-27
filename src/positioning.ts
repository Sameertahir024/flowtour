import type { PopoverSide } from './types';

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface PopoverPlacement extends Rect {
  side: Exclude<PopoverSide, 'auto'>;
  arrowOffset: number;
}

const POPOVER_GAP = 16;
const VIEWPORT_MARGIN = 16; // Safe padding from screen edges & scrollbars
const ARROW_MARGIN = 18; // Keep arrow safely within card border radius

/** Bounding box of an element in viewport (not document) coordinates, i.e. what `position: fixed` expects. */
export function getTargetRect(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Spotlight cutout rect: the target's rect expanded by `padding` on every side. */
export function getCutoutRect(target: Rect, padding: number): Rect {
  return {
    top: target.top - padding,
    left: target.left - padding,
    width: target.width + padding * 2,
    height: target.height + padding * 2,
  };
}

/**
 * Chooses where to place the popover relative to the cutout, preferring the
 * requested side but falling back to whichever side actually has room, then
 * clamps the result so it never renders off-screen and calculates dynamic arrow alignment.
 */
export function placePopover(
  cutout: Rect,
  popoverSize: { width: number; height: number },
  preferredSide: PopoverSide = 'auto',
): PopoverPlacement {
  // Use clientWidth/clientHeight which excludes the scrollbar width!
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;

  const space = {
    top: cutout.top,
    bottom: vh - (cutout.top + cutout.height),
    left: cutout.left,
    right: vw - (cutout.left + cutout.width),
  };

  const fits = (side: Exclude<PopoverSide, 'auto'>) => {
    if (side === 'top' || side === 'bottom') return space[side] >= popoverSize.height + POPOVER_GAP;
    return space[side] >= popoverSize.width + POPOVER_GAP;
  };

  let side: Exclude<PopoverSide, 'auto'>;
  if (preferredSide !== 'auto' && fits(preferredSide)) {
    side = preferredSide;
  } else {
    const preferenceOrder = ['bottom', 'top', 'right', 'left'] as const;
    side = preferenceOrder.find(fits) ?? preferenceOrder.reduce((a, b) => (space[a] >= space[b] ? a : b));
  }

  let top: number;
  let left: number;

  switch (side) {
    case 'bottom':
      top = cutout.top + cutout.height + POPOVER_GAP;
      left = cutout.left + cutout.width / 2 - popoverSize.width / 2;
      break;
    case 'top':
      top = cutout.top - popoverSize.height - POPOVER_GAP;
      left = cutout.left + cutout.width / 2 - popoverSize.width / 2;
      break;
    case 'right':
      top = cutout.top + cutout.height / 2 - popoverSize.height / 2;
      left = cutout.left + cutout.width + POPOVER_GAP;
      break;
    case 'left':
      top = cutout.top + cutout.height / 2 - popoverSize.height / 2;
      left = cutout.left - popoverSize.width - POPOVER_GAP;
      break;
  }

  // Clamp so the popover always stays fully on-screen, even for edge-hugging targets.
  left = Math.min(Math.max(left, VIEWPORT_MARGIN), vw - popoverSize.width - VIEWPORT_MARGIN);
  top = Math.min(Math.max(top, VIEWPORT_MARGIN), vh - popoverSize.height - VIEWPORT_MARGIN);

  // Dynamic arrow alignment: align pointer directly with target center relative to card
  let arrowOffset: number;
  if (side === 'top' || side === 'bottom') {
    const targetCenterX = cutout.left + cutout.width / 2;
    const rawOffset = targetCenterX - left;
    arrowOffset = Math.min(Math.max(rawOffset, ARROW_MARGIN), popoverSize.width - ARROW_MARGIN);
  } else {
    const targetCenterY = cutout.top + cutout.height / 2;
    const rawOffset = targetCenterY - top;
    arrowOffset = Math.min(Math.max(rawOffset, ARROW_MARGIN), popoverSize.height - ARROW_MARGIN);
  }

  return { top, left, width: popoverSize.width, height: popoverSize.height, side, arrowOffset };
}

/** True if any part of the element is outside the current viewport. */
export function isOffscreen(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return r.top < 0 || r.left < 0 || r.bottom > window.innerHeight || r.right > window.innerWidth;
}

export function scrollIntoViewIfNeeded(el: HTMLElement): void {
  if (isOffscreen(el)) {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  }
}
