export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attrs?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  }
  return node;
}

export function resolveElement(target: string | HTMLElement): HTMLElement | null {
  if (typeof target === 'string') return document.querySelector<HTMLElement>(target);
  return target;
}

export function detectRadius(target: HTMLElement): number {
  const parsed = parseFloat(getComputedStyle(target).borderRadius || '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Focusable elements within a container, in DOM order — used for the popover's focus trap. */
export function focusableChildren(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((n) => !n.hasAttribute('disabled'));
}

/** Resolves the effective theme: 'auto', 'dark', 'light', 'glass', 'midnight'. */
export function resolveTheme(theme: string = 'auto'): 'dark' | 'light' | 'glass' | 'midnight' {
  if (theme !== 'auto') return theme as 'dark' | 'light' | 'glass' | 'midnight';
  const isDark =
    document.documentElement.classList.contains('dark') ||
    document.body.classList.contains('dark') ||
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return isDark ? 'dark' : 'light';
}
