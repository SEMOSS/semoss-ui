/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly ENDPOINT?: string;
	readonly MODULE?: string;
	readonly APP?: string;
	readonly ACCESS_KEY?: string;
	readonly SECRET_KEY?: string;
	readonly VITE_THEME?: string;
	readonly VITE_COLLABORATION_DATA?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
