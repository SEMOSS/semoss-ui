import { createContext } from "react";

/**
 * Registers a route's own header, which holds the open-navigation button, so
 * `AppLayout` drops its floating one. The registration returns the call that
 * unregisters it; null outside `AppLayout`.
 */
export const PageHeaderContext = createContext<(() => () => void) | null>(null);
