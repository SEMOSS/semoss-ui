import { createContext } from "react";

/**
 * Registers a route's own header, which holds the mobile navigation button, so
 * the layout drops its floating one. Returns the call that unregisters it.
 */
export const PageHeaderContext = createContext<(() => () => void) | null>(null);
