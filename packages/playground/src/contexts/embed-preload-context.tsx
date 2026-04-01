import { createContext, useContext } from "react";

/**
 * Tracks which sidebar embed paths have been pre-loaded in MainLayout.
 * EmbedPage uses this to skip rendering its own iframe when a pre-loaded
 * version is already visible.
 */
export const EmbedPreloadContext = createContext<Set<string>>(new Set());

export const useEmbedPreload = () => useContext(EmbedPreloadContext);
