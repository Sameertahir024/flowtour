import type { TourConfig, TourInstance, TourStep } from './types';
import { detectRadius, el, focusableChildren, prefersReducedMotion, resolveElement, resolveTheme } from './dom';
import { getCutoutRect, getTargetRect, placePopover, scrollIntoViewIfNeeded } from './positioning';

const DEFAULTS: Required<
  Pick<
    TourConfig,
    | 'animationStyle'
    | 'showBackdrop'
    | 'closeOnBackdropClick'
    | 'allowClose'
    | 'showProgress'
    | 'scrollIntoView'
    | 'nextBtnText'
    | 'prevBtnText'
    | 'doneBtnText'
  >
> = {
  animationStyle: 'glide',
  showBackdrop: true,
  closeOnBackdropClick: true,
  allowClose: true,
  showProgress: true,
  scrollIntoView: true,
  nextBtnText: 'Next',
  prevBtnText: 'Back',
  doneBtnText: 'Done',
};

export function createTour(userConfig: TourConfig): TourInstance {
  const config = { ...DEFAULTS, ...userConfig };
  const reducedMotion = prefersReducedMotion();

  let active = false;
  let currentIndex = -1;
  let lastFocused: Element | null = null;
  let currentHighlightedEl: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;

  // --- DOM (built once, reused across steps) ---------------------------------
  const backdrop = el('div', 'ft-backdrop');
  const cutout = el('div', 'ft-cutout');
  const pop = el('div', `ft-pop ft-anim-${config.animationStyle} ${config.className ?? ''}`.trim());
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-modal', 'true');
  pop.tabIndex = -1;

  const closeBtn = el('button', 'ft-close', { type: 'button', 'aria-label': 'Close tour' });
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => destroy());

  const eyebrow = el('div', 'ft-eyebrow');
  const titleEl = el('h3', 'ft-title');
  const descEl = el('p', 'ft-desc');
  const dots = el('div', 'ft-dots');

  const prevBtn = el('button', 'ft-btn ft-btn-ghost', { type: 'button' });
  prevBtn.textContent = config.prevBtnText;
  prevBtn.addEventListener('click', () => movePrevious());

  const nextBtn = el('button', 'ft-btn ft-btn-primary', { type: 'button' });
  nextBtn.addEventListener('click', () => moveNext());

  const footer = el('div', 'ft-footer');
  const btnGroup = el('div', 'ft-btn-group');
  btnGroup.append(prevBtn, nextBtn);
  footer.append(dots, btnGroup);
  pop.append(closeBtn, eyebrow, titleEl, descEl, footer);

  function mount() {
    if (config.showBackdrop) document.body.appendChild(backdrop);
    document.body.appendChild(cutout);
    document.body.appendChild(pop);

    if (config.closeOnBackdropClick) backdrop.addEventListener('click', onBackdropClick);
    document.addEventListener('keydown', onKeydown);
    resizeObserver = new ResizeObserver(() => reposition());
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, { capture: true, passive: true });
  }

  function unmount() {
    backdrop.remove();
    cutout.remove();
    pop.remove();
    backdrop.removeEventListener('click', onBackdropClick);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('resize', reposition);
    window.removeEventListener('scroll', reposition, { capture: true });
    resizeObserver?.disconnect();
    resizeObserver = null;
  }

  function onBackdropClick() {
    destroy();
  }

  function onKeydown(e: KeyboardEvent) {
    if (!active) return;
    if (e.key === 'Escape' && config.allowClose) {
      e.preventDefault();
      destroy();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      e.preventDefault();
      moveNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      movePrevious();
    } else if (e.key === 'Tab') {
      trapFocus(e);
    }
  }

  function trapFocus(e: KeyboardEvent) {
    const focusables = focusableChildren(pop);
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function currentStep(): TourStep | undefined {
    return config.steps[currentIndex];
  }

  function reposition() {
    const step = currentStep();
    if (!step || !active) return;
    const target = resolveElement(step.element);
    if (!target) return;

    const targetRect = getTargetRect(target);
    const padding = step.padding ?? 8;
    const radius = step.radius ?? (detectRadius(target) || 12);
    const cutoutRect = getCutoutRect(targetRect, padding);

    cutout.style.top = `${cutoutRect.top}px`;
    cutout.style.left = `${cutoutRect.left}px`;
    cutout.style.width = `${cutoutRect.width}px`;
    cutout.style.height = `${cutoutRect.height}px`;
    cutout.style.borderRadius = `${radius}px`;

    // Dynamic border ring options (global or per-step)
    const showRing = step.showRing ?? config.showRing ?? true;
    const ringColor = step.ringColor ?? config.ringColor ?? 'var(--ft-cutout-ring)';
    const ringWidth = step.ringWidth ?? config.ringWidth ?? 1.5;
    cutout.style.border = showRing ? `${ringWidth}px solid ${ringColor}` : 'none';

    const popRect = pop.getBoundingClientRect();
    const placement = placePopover(
      cutoutRect,
      { width: popRect.width || 296, height: popRect.height || 160 },
      step.popover?.side ?? 'auto',
    );
    pop.style.top = `${placement.top}px`;
    pop.style.left = `${placement.left}px`;
    pop.dataset.side = placement.side;
    pop.style.setProperty('--ft-arrow-offset', `${placement.arrowOffset}px`);
  }

  function renderStep() {
    const step = currentStep();
    if (!step) return;

    if (step.onBeforeHighlight?.(step) === false) {
      // Step opted out — skip forward past it.
      currentIndex += 1;
      if (currentIndex >= config.steps.length) return destroy();
      return renderStep();
    }

    const target = resolveElement(step.element);
    if (!target) {
      console.warn(`[flowtour] Could not find element for step ${currentIndex}:`, step.element);
      return moveNext();
    }
    if (config.scrollIntoView) scrollIntoViewIfNeeded(target);
    resizeObserver?.disconnect();
    resizeObserver?.observe(target);

    // Elevate active element z-index above sticky headers & sibling layers
    if (currentHighlightedEl && currentHighlightedEl !== target) {
      currentHighlightedEl.classList.remove('ft-highlighted-element');
    }
    currentHighlightedEl = target;
    currentHighlightedEl.classList.add('ft-highlighted-element');

    eyebrow.textContent = `Step ${currentIndex + 1} of ${config.steps.length}`;
    titleEl.textContent = step.popover?.title ?? '';
    titleEl.style.display = step.popover?.title ? '' : 'none';
    descEl.textContent = step.popover?.description ?? '';
    descEl.style.display = step.popover?.description ? '' : 'none';
    prevBtn.style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = currentIndex === config.steps.length - 1 ? config.doneBtnText : config.nextBtnText;

    // Apply effective theme preset (dark, light, glass, midnight)
    const effectiveTheme = resolveTheme(step.theme ?? config.theme);
    pop.classList.remove('ft-theme-dark', 'ft-theme-light', 'ft-theme-glass', 'ft-theme-midnight');
    pop.classList.add(`ft-theme-${effectiveTheme}`);

    // Apply effective animation style: 'glide', 'morph', or 'simple'
    const animStyle = ['morph', 'glide', 'simple'].includes(config.animationStyle as string)
      ? config.animationStyle!
      : 'morph';
    pop.classList.remove('ft-anim-glide', 'ft-anim-morph', 'ft-anim-simple');
    pop.classList.add(`ft-anim-${animStyle}`);
    cutout.classList.remove('ft-anim-glide', 'ft-anim-morph', 'ft-anim-simple');
    cutout.classList.add(`ft-anim-${animStyle}`);

    // Apply animation speed (duration in ms or s) if configured
    const customSpeed = step.animationSpeed ?? config.animationSpeed;
    if (customSpeed !== undefined) {
      const durationStr = typeof customSpeed === 'number' ? `${customSpeed > 10 ? customSpeed : customSpeed * 1000}ms` : customSpeed;
      pop.style.setProperty('--ft-duration', durationStr);
      cutout.style.setProperty('--ft-duration', durationStr);
    } else {
      // Default: morph runs at 900ms for sweeping path effect, glide runs at 420ms, simple at 180ms
      const defaultDuration = animStyle === 'morph' ? '900ms' : animStyle === 'simple' ? '180ms' : '420ms';
      pop.style.setProperty('--ft-duration', defaultDuration);
      cutout.style.setProperty('--ft-duration', defaultDuration);
    }

    // If user provided a custom accent color (e.g. Red '#ef4444' to match their app), apply it directly
    const customAccent = step.accentColor ?? config.accentColor;
    if (customAccent) {
      pop.style.setProperty('--ft-accent', customAccent);
    } else {
      pop.style.removeProperty('--ft-accent');
    }

    // Card width & maxWidth configuration (per-step or global)
    const customWidth = step.popover?.width ?? step.width ?? config.width;
    if (customWidth !== undefined) {
      const widthVal = typeof customWidth === 'number' ? `${customWidth}px` : customWidth;
      pop.style.setProperty('--ft-pop-width', widthVal);
    } else {
      pop.style.removeProperty('--ft-pop-width');
    }

    const customMaxWidth = step.popover?.maxWidth ?? step.maxWidth ?? config.maxWidth;
    if (customMaxWidth !== undefined) {
      const maxWidthVal = typeof customMaxWidth === 'number' ? `${customMaxWidth}px` : customMaxWidth;
      pop.style.setProperty('max-width', maxWidthVal);
    } else {
      pop.style.removeProperty('max-width');
    }

    dots.innerHTML = '';
    dots.style.display = config.showProgress ? '' : 'none';
    config.steps.forEach((_, i) => {
      const dot = el('button', i === currentIndex ? 'ft-dot ft-dot-active' : 'ft-dot', {
        type: 'button',
        'aria-label': `Go to step ${i + 1}`,
      });
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        moveTo(i);
      });
      dots.appendChild(dot);
    });

    // Defer positioning one frame so the popover has real, laid-out dimensions to measure.
    requestAnimationFrame(() => {
      reposition();
      step.onHighlighted?.(step);
    });
  }

  function drive(startIndex = 0) {
    if (config.steps.length === 0) return;
    lastFocused = document.activeElement;
    active = true;
    currentIndex = startIndex;
    mount();
    backdrop.classList.add('on');
    cutout.classList.add('on');
    pop.classList.add('on');
    renderStep();
    requestAnimationFrame(() => pop.focus?.());
  }

  function moveNext() {
    if (!active) return;
    const from = currentIndex;
    if (currentIndex >= config.steps.length - 1) return destroy();
    currentIndex += 1;
    config.onNext?.(from, currentIndex);
    renderStep();
  }

  function movePrevious() {
    if (!active || currentIndex <= 0) return;
    const from = currentIndex;
    currentIndex -= 1;
    config.onPrev?.(from, currentIndex);
    renderStep();
  }

  function moveTo(index: number) {
    if (!active || index < 0 || index >= config.steps.length) return;
    currentIndex = index;
    renderStep();
  }

  function destroy() {
    if (!active) return;
    config.onDestroyStarted?.();
    active = false;
    if (currentHighlightedEl) {
      currentHighlightedEl.classList.remove('ft-highlighted-element');
      currentHighlightedEl = null;
    }
    backdrop.classList.remove('on');
    cutout.classList.remove('on');
    pop.classList.remove('on');
    const cleanupDelay = reducedMotion ? 0 : 400;
    window.setTimeout(() => {
      unmount();
      config.onDestroyed?.();
      (lastFocused as HTMLElement | null)?.focus?.();
    }, cleanupDelay);
  }

  return {
    drive,
    moveNext,
    movePrevious,
    moveTo,
    destroy,
    isActive: () => active,
    currentIndex: () => currentIndex,
  };
}
