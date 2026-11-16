import { createContext } from "react";

/**
 * Registers a route's own header, which holds the open-navigation button, so
 * `MainLayout` drops its floating one. The registration returns the call that
 * unregisters it; null outside `MainLayout`.
 */
export const PageHeaderContext = createContext<(() => () => void) | null>(null);
