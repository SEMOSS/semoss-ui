/// <reference types="vite/client" />

/** The playground's `.env` values the renderer reads (`envDir` in electron.vite.config.ts). */
interface ImportMetaEnv {
	readonly VITE_NAME?: string;
	readonly VITE_THEME?: string;
	readonly VITE_DEFAUlT_MODEL_ID?: string;
	readonly VITE_DEFAUlT_MODEL_NAME?: string;
	readonly VITE_DEFAULT_CHAT_MODE?: string;
	readonly VITE_DEFAULT_CHAT_AGENT_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
