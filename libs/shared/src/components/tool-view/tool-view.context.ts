import { createContext } from "react";
import type { ToolViewLibraries } from "./tool-view.types";

/**
 * The tool view libraries the host renders. Without a provider there are
 * none, so every tool shows the host's generic view.
 */
export const ToolViewContext = createContext<ToolViewLibraries>({});
