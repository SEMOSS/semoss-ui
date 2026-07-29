/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly MODULE: string;
	readonly ENDPOINT?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
