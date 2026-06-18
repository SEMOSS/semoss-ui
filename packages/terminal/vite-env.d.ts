/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly MODULE: string;
	readonly ACCESS_KEY?: string;
	readonly SECRET_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
