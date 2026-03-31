/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_PLATFORM_URL: string;
	readonly VITE_NAME: string;
	readonly VITE_THEME: string;
	readonly VITE_DEFAUlT_MODEL_ID: string;
	readonly VITE_DEFAUlT_MODEL_NAME: string;
	readonly VITE_ENABLE_MODEL_SELECT: string;
	readonly VITE_ENABLE_AUTH: string;
	readonly VITE_ENABLE_AGENT: string;
	readonly VITE_ENABLE_WORKSPACE: string;
	readonly VITE_ENABLE_SUGGESTIONS: string;
	readonly VITE_ENABLE_PLAN: string;
	readonly VITE_ENABLE_DARK_MODE: string;
}

// biome-ignore lint/correctness/noUnusedVariables: this is actually used
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
