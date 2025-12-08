/// <reference types="vite/client" />
interface ImportMetaEnv {
	readonly VITE_MODULE: string;
	readonly VITE_ENDPOINT: string;
	readonly VITE_APP: string;
	readonly VITE_SEMOSS: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
