/**
 * Returns true when the scroll position exceeds the threshold and the
 * scroll-to-top button should be shown.
 */
export function shouldShowScrollTop(scrollY: number, threshold = 300): boolean {
  return scrollY > threshold;
}
