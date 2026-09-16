import { createMcpPlatformUrl, createPromptPlatformUrl } from "@semoss/shared";

export { getToolAppId, getToolEngineId } from "@semoss/shared";

export const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL ?? "";

export const mcpToPlatformUrl = createMcpPlatformUrl(PLATFORM_URL);
export const promptToPlatformUrl = createPromptPlatformUrl(PLATFORM_URL);
