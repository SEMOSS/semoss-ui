// Shared translations used by libs/shared components (MCP and Prompt selectors)

import mcpAR from "./locales/ar/shared/mcp.json";
import promptsAR from "./locales/ar/shared/prompts.json";
import mcpEN from "./locales/en/shared/mcp.json";
import promptsEN from "./locales/en/shared/prompts.json";
import mcpES from "./locales/es/shared/mcp.json";
import promptsES from "./locales/es/shared/prompts.json";
import mcpFR from "./locales/fr/shared/mcp.json";
import promptsFR from "./locales/fr/shared/prompts.json";
import mcpHI from "./locales/hi/shared/mcp.json";
import promptsHI from "./locales/hi/shared/prompts.json";
import mcpJA from "./locales/ja/shared/mcp.json";
import promptsJA from "./locales/ja/shared/prompts.json";

export const sharedResources = {
	en: {
		mcp: mcpEN,
		prompts: promptsEN,
	},
	es: {
		mcp: mcpES,
		prompts: promptsES,
	},
	fr: {
		mcp: mcpFR,
		prompts: promptsFR,
	},
	hi: {
		mcp: mcpHI,
		prompts: promptsHI,
	},
	ar: {
		mcp: mcpAR,
		prompts: promptsAR,
	},
	ja: {
		mcp: mcpJA,
		prompts: promptsJA,
	},
} as const;
