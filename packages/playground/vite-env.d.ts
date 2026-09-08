/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_PLATFORM_URL: string;
	readonly VITE_NAME: string;
	readonly VITE_THEME: string;
	readonly VITE_DEFAUlT_MODEL_ID: string;
	readonly VITE_DEFAUlT_MODEL_NAME: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
