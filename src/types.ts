export type AnimationStyle = 'glide' | 'morph' | 'simple';

export type PopoverSide = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export type TourTheme = 'auto' | 'dark' | 'light' | 'glass' | 'midnight';

export interface PopoverConfig {
  title?: string;
  description?: string;
  side?: PopoverSide;
  className?: string;
  width?: number | string;
  maxWidth?: number | string;
}

export interface TourStep {
  element: string | HTMLElement;
  popover?: PopoverConfig;
  padding?: number;
  radius?: number;
  showRing?: boolean;
  ringColor?: string;
  ringWidth?: number;
  theme?: TourTheme;
  accentColor?: string;
  animationSpeed?: number;
  width?: number | string;
  maxWidth?: number | string;
  onBeforeHighlight?: (step: TourStep) => void | boolean;
  onHighlighted?: (step: TourStep) => void;
}


export interface TourConfig {
  steps: TourStep[];
  theme?: TourTheme;
  accentColor?: string;
  animationStyle?: AnimationStyle;
  animationSpeed?: number;
  width?: number | string;
  maxWidth?: number | string;
  showBackdrop?: boolean;
  closeOnBackdropClick?: boolean;
  allowClose?: boolean;
  showProgress?: boolean;
  scrollIntoView?: boolean;
  showRing?: boolean;
  ringColor?: string;
  ringWidth?: number;
  nextBtnText?: string;
  prevBtnText?: string;
  doneBtnText?: string;
  className?: string;

  onNext?: (fromIndex: number, toIndex: number) => void;
  onPrev?: (fromIndex: number, toIndex: number) => void;
  onDestroyStarted?: () => void;
  onDestroyed?: () => void;
}

export interface TourInstance {
  drive: (startIndex?: number) => void;
  moveNext: () => void;
  movePrevious: () => void;
  moveTo: (index: number) => void;
  destroy: () => void;
  isActive: () => boolean;
  currentIndex: () => number;
}