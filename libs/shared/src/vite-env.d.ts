// Type declarations for Vite-specific runtime features used in shared source
// files. These are processed by Vite at build time but need TypeScript type
// information to avoid errors when compiled via rollup/@rollup/plugin-typescript.

// Extend ImportMeta to include Vite's glob import utility.
interface ImportMeta {
	glob<T = unknown>(
		pattern: string | string[],
		options?: {
			as?: string;
			eager?: boolean;
			import?: string;
			query?: string | Record<string, string>;
		},
	): Record<string, () => Promise<T>>;
}

// Declarations for Vite's ?worker query suffix on module imports.
declare module "monaco-editor/esm/vs/editor/editor.worker?worker" {
	const WorkerFactory: new () => Worker;
	export default WorkerFactory;
}

declare module "monaco-editor/esm/vs/language/css/css.worker?worker" {
	const WorkerFactory: new () => Worker;
	export default WorkerFactory;
}

declare module "monaco-editor/esm/vs/language/html/html.worker?worker" {
	const WorkerFactory: new () => Worker;
	export default WorkerFactory;
}

declare module "monaco-editor/esm/vs/language/json/json.worker?worker" {
	const WorkerFactory: new () => Worker;
	export default WorkerFactory;
}

declare module "monaco-editor/esm/vs/language/typescript/ts.worker?worker" {
	const WorkerFactory: new () => Worker;
	export default WorkerFactory;
}
