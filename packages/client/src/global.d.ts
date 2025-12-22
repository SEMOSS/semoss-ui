interface ImportMetaEnv {
	readonly ENDPOINT: string;
	readonly MODULE: string;
	readonly APP: string;
	readonly VITE_THEME_TITLE: string;
	readonly VITE_DOCUMENTATION_URL: string;
	// more env variables...
}

// biome-ignore lint/correctness/noUnusedVariables: Global type augmentation for Vite
interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module "*.png" {
	const value: string;
	export = value;
}

declare module "*.svg" {
	const value: string;
	export = value;
}

declare module "*.jpg" {
	const value: string;
	export = value;
}

declare module "*.jpeg" {
	const value: string;
	export = value;
}

declare module "*.gif" {
	const value: string;
	export = value;
}

declare module "!!raw-loader!*" {
	const contents: string;
	export = contents;
}
