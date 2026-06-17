import { createMcpPlatformUrl, createPromptPlatformUrl } from "@semoss/shared";

export { isKnowledgeMcp, splitMcpByType } from "@semoss/shared";

const PLATFORM_URL = import.meta.env.VITE_PLATFORM_URL ?? "";

export const mcpToPlatformUrl = createMcpPlatformUrl(PLATFORM_URL);
export const promptToPlatformUrl = createPromptPlatformUrl(PLATFORM_URL);
