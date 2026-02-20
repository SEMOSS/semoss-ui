/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly MODULE: string;
	readonly ENDPOINT: string;
	readonly ACCESS_KEY: string;
	readonly SECRET_KEY: string;
}

// biome-ignore lint/correctness/noUnusedVariables: this is actually used
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
