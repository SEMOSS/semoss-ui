/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_DESKTOP_PROFILES?: string;
	readonly VITE_DESKTOP_DEFAULT_PROFILE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
