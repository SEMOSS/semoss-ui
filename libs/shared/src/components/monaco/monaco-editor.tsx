import {
	type DiffEditorProps,
	type EditorProps,
	loader,
} from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { lazy, useCallback, useEffect } from "react";
import { useTheme } from "@semoss/ui/next";

self.MonacoEnvironment = {
	getWorker(_, label) {
		if (label === "json") {
			return new jsonWorker();
		} else if (label === "css" || label === "scss" || label === "less") {
			return new cssWorker();
		} else if (
			label === "html" ||
			label === "handlebars" ||
			label === "razor"
		) {
			return new htmlWorker();
		} else if (label === "typescript" || label === "javascript") {
			return new tsWorker();
		}

		return new editorWorker();
	},
};

// Configure Monaco to use local node_modules instead of CDN
loader.config({ monaco });

const MonacoEditorBase = lazy(() =>
	import("@monaco-editor/react").then((mod) => ({ default: mod.Editor })),
);

const MonacoDiffEditorBase = lazy(() =>
	import("@monaco-editor/react").then((module) => ({
		default: module.DiffEditor,
	})),
);

const SEMOSS_LIGHT_THEME = "semoss-light";
const SEMOSS_DARK_THEME = "semoss-dark";
const THEME_CHANGE_EVENT = "smss-theme-change";
let themesDefined = false;
let themeSyncStarted = false;
let activeSemossTheme: string | null = null;

const defineSemossThemes = (monacoInstance: typeof monaco) => {
	if (themesDefined) {
		return;
	}

	monacoInstance.editor.defineTheme(SEMOSS_LIGHT_THEME, {
		base: "vs",
		inherit: true,
		rules: [],
		colors: {
			"editor.background": "#ffffff",
			"editor.foreground": "#0a0a0a",
			"editorLineNumber.foreground": "#737373",
			"editorLineNumber.activeForeground": "#0570f0",
			"editorCursor.foreground": "#0a0a0a",
			"editor.selectionBackground": "#0570f033",
			"editor.inactiveSelectionBackground": "#0570f01f",
			"editor.lineHighlightBackground": "#f5f5f5",
			"editorGutter.background": "#ffffff",
			"editorWidget.background": "#ffffff",
			"editorWidget.foreground": "#0a0a0a",
			"editorWidget.border": "#e6e6e6",
			"input.background": "#ffffff",
			"input.foreground": "#0a0a0a",
			"input.border": "#e6e6e6",
			"dropdown.background": "#ffffff",
			"dropdown.foreground": "#0a0a0a",
			"dropdown.border": "#e6e6e6",
			"list.hoverBackground": "#f5f5f5",
			"list.activeSelectionBackground": "#ebf4fe",
			"list.activeSelectionForeground": "#0a0a0a",
		},
	});

	monacoInstance.editor.defineTheme(SEMOSS_DARK_THEME, {
		base: "vs-dark",
		inherit: true,
		rules: [],
		colors: {
			"editor.background": "#171717",
			"editor.foreground": "#fafafa",
			"editorLineNumber.foreground": "#a3a3a3",
			"editorLineNumber.activeForeground": "#0570f0",
			"editorCursor.foreground": "#fafafa",
			"editor.selectionBackground": "#0570f066",
			"editor.inactiveSelectionBackground": "#0570f033",
			"editor.lineHighlightBackground": "#262626",
			"editorGutter.background": "#171717",
			"editorWidget.background": "#262626",
			"editorWidget.foreground": "#fafafa",
			"editorWidget.border": "#ffffff1a",
			"input.background": "#262626",
			"input.foreground": "#fafafa",
			"input.border": "#ffffff26",
			"dropdown.background": "#262626",
			"dropdown.foreground": "#fafafa",
			"dropdown.border": "#ffffff1a",
			"list.hoverBackground": "#404040",
			"list.activeSelectionBackground": "#0570f066",
			"list.activeSelectionForeground": "#fafafa",
		},
	});

	themesDefined = true;
};

const getMonacoThemeName = (resolvedTheme: "light" | "dark") =>
	resolvedTheme === "dark" ? SEMOSS_DARK_THEME : SEMOSS_LIGHT_THEME;

const getDocumentTheme = (): "light" | "dark" => {
	if (typeof document === "undefined") {
		return "light";
	}

	return document.documentElement.classList.contains("dark")
		? "dark"
		: "light";
};

const normalizeMonacoTheme = (
	theme: string | undefined,
	resolvedTheme: "light" | "dark",
) => {
	if (
		!theme ||
		["light", "vs", "vs-light", "dark", "vs-dark"].includes(theme)
	) {
		return getMonacoThemeName(resolvedTheme);
	}

	return theme;
};

const applySemossMonacoTheme = (
	resolvedTheme = getDocumentTheme(),
	force = false,
) => {
	const nextTheme = getMonacoThemeName(resolvedTheme);

	if (!force && activeSemossTheme === nextTheme) {
		return nextTheme;
	}

	defineSemossThemes(monaco);
	monaco.editor.setTheme(nextTheme);
	activeSemossTheme = nextTheme;

	return nextTheme;
};

const startMonacoThemeSync = () => {
	if (themeSyncStarted || typeof window === "undefined") {
		return;
	}

	themeSyncStarted = true;

	window.addEventListener(THEME_CHANGE_EVENT, (event) => {
		const resolvedTheme =
			event instanceof CustomEvent &&
			(event.detail?.theme === "dark" || event.detail?.theme === "light")
				? event.detail.theme
				: getDocumentTheme();

		applySemossMonacoTheme(resolvedTheme);
	});
};

export const MonacoEditor = ({
	beforeMount,
	onMount,
	options,
	theme,
	...props
}: EditorProps) => {
	const { resolvedTheme } = useTheme();
	const activeTheme = normalizeMonacoTheme(theme, resolvedTheme);
	const shouldFollowDocumentTheme =
		activeTheme === SEMOSS_LIGHT_THEME || activeTheme === SEMOSS_DARK_THEME;

	const handleBeforeMount = useCallback<
		NonNullable<EditorProps["beforeMount"]>
	>(
		(monacoInstance) => {
			defineSemossThemes(monacoInstance);
			beforeMount?.(monacoInstance);
		},
		[beforeMount],
	);

	const handleMount = useCallback<NonNullable<EditorProps["onMount"]>>(
		(editor, monacoInstance) => {
			onMount?.(editor, monacoInstance);

			if (shouldFollowDocumentTheme) {
				startMonacoThemeSync();
				applySemossMonacoTheme(resolvedTheme, true);
				return;
			}

			monacoInstance.editor.setTheme(activeTheme);
		},
		[activeTheme, onMount, resolvedTheme, shouldFollowDocumentTheme],
	);

	useEffect(() => {
		if (!shouldFollowDocumentTheme) {
			return;
		}

		startMonacoThemeSync();
		applySemossMonacoTheme(resolvedTheme, true);
	}, [resolvedTheme, shouldFollowDocumentTheme]);

	return (
		<MonacoEditorBase
			theme={activeTheme}
			beforeMount={handleBeforeMount}
			onMount={handleMount}
			options={{
				automaticLayout: true,
				scrollBeyondLastLine: false,
				...options,
			}}
			{...props}
		/>
	);
};

export const MonacoDiffEditor = ({
	beforeMount,
	onMount,
	options,
	theme,
	...props
}: DiffEditorProps) => {
	const { resolvedTheme } = useTheme();
	const activeTheme = normalizeMonacoTheme(theme, resolvedTheme);
	const shouldFollowDocumentTheme =
		activeTheme === SEMOSS_LIGHT_THEME || activeTheme === SEMOSS_DARK_THEME;

	const handleBeforeMount = useCallback<
		NonNullable<DiffEditorProps["beforeMount"]>
	>(
		(monacoInstance) => {
			defineSemossThemes(monacoInstance);
			beforeMount?.(monacoInstance);
		},
		[beforeMount],
	);

	const handleMount = useCallback<NonNullable<DiffEditorProps["onMount"]>>(
		(editor, monacoInstance) => {
			onMount?.(editor, monacoInstance);

			if (shouldFollowDocumentTheme) {
				startMonacoThemeSync();
				applySemossMonacoTheme(resolvedTheme, true);
				return;
			}

			monacoInstance.editor.setTheme(activeTheme);
		},
		[activeTheme, onMount, resolvedTheme, shouldFollowDocumentTheme],
	);

	useEffect(() => {
		if (!shouldFollowDocumentTheme) {
			return;
		}

		startMonacoThemeSync();
		applySemossMonacoTheme(resolvedTheme, true);
	}, [resolvedTheme, shouldFollowDocumentTheme]);

	return (
		<MonacoDiffEditorBase
			theme={activeTheme}
			beforeMount={handleBeforeMount}
			onMount={handleMount}
			options={{
				automaticLayout: true,
				scrollBeyondLastLine: false,
				...options,
			}}
			{...props}
		/>
	);
};
