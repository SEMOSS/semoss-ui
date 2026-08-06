import { createMcpPlatformUrl, createPromptPlatformUrl } from "@semoss/shared";
import { getRouterBasename } from "./router";

// These links point back into this app, so the platform URL is the basename.
// Reading it at runtime keeps them correct on whichever context path the app is
// served from, which the build time VITE_PLATFORM_URL could not do.
const PLATFORM_URL = getRouterBasename().replace(/\/$/, "");

export const mcpToPlatformUrl = createMcpPlatformUrl(PLATFORM_URL);
export const promptToPlatformUrl = createPromptPlatformUrl(PLATFORM_URL);
