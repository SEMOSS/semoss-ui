declare module "*.css";
declare module "*.png";
declare module "*.svg";
declare module "*.jpeg";
declare module "*.jpg";
declare module "*.tsx";
declare module "*.ts";

// Declarations for Vite's ?worker query suffix on Monaco worker imports, used
// by src/next/monaco-loader.ts. Consuming apps (Vite) resolve these at build
// time; TypeScript just needs a shape to compile against.
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

// Side-effect-only import of Monaco's full editor bundle (registers the editor
// contributions — find, folding, multi-cursor, rename, go-to-line, …). It has
// no shipped .d.ts, so declare it as a bare module here.
declare module "monaco-editor/esm/vs/editor/editor.main";
