/**
 * Global Card Interaction System for San Felipe LGU Website
 *
 * Provides civic, restrained, and accessible hover & focus states:
 * - 3-4px subtle upward elevation on hover and focus-within
 * - Smooth shadow elevation (shadow-2xs -> shadow-md)
 * - Subtle border shift toward San Felipe burgundy (#8B1E2D)
 * - 200ms ease-out transitions
 * - Prefers-reduced-motion accessibility resets
 */

/** Standard container card with hover elevation and border shift */
export const CARD_INTERACTIVE_CLASSES =
  "transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md hover:border-burgundy-700 focus-within:-translate-y-1 focus-within:shadow-md focus-within:border-burgundy-700 motion-reduce:hover:translate-none motion-reduce:focus-within:translate-none";

/** Direct <Link> card with focus-visible keyboard ring */
export const CARD_LINK_INTERACTIVE_CLASSES =
  "transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md hover:border-burgundy-700 focus-visible:outline-none focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-burgundy-700 focus-visible:shadow-md focus-visible:border-burgundy-700 motion-reduce:hover:translate-none motion-reduce:focus-visible:translate-none";

/** Subtle secondary image zoom (approx 1.03 scale over 300ms) */
export const CARD_IMAGE_ZOOM_CLASSES =
  "group-hover:scale-[1.03] group-focus-within:scale-[1.03] transition-transform duration-300 ease-out motion-reduce:group-hover:scale-100 motion-reduce:group-focus-within:scale-100";

/** Horizontal navigation arrow micro-translation (3px) */
export const CARD_ARROW_SHIFT_CLASSES =
  "group-hover:translate-x-1 group-focus-within:translate-x-1 group-focus-visible:translate-x-1 transition-transform duration-200 ease-out motion-reduce:group-hover:translate-none motion-reduce:group-focus-within:translate-none";
