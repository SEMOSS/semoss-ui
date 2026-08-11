import type { BeforeMount, OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTheme } from "@semoss/ui/next";
import { MonacoEditor } from "../monaco";

// Monaco needs an explicit height. A notebook code cell should grow with its
// content (up to a cap, after which it scrolls internally) instead of sitting at
// a fixed size — mirrors the renderer's auto-sizing code cells.
const LINE_HEIGHT = 19;
const MIN_VISIBLE_LINES = 2;
const MAX_VISIBLE_LINES = 25;
const VERTICAL_PADDING = 16; // top (8) + bottom (8)
const MIN_HEIGHT = LINE_HEIGHT * MIN_VISIBLE_LINES + VERTICAL_PADDING;
const MAX_HEIGHT = LINE_HEIGHT * MAX_VISIBLE_LINES + VERTICAL_PADDING;

// Monaco paints its own editor.background, so match the app's `--muted` token
// (globals.css) via a custom theme to blend the editor into the notebook cell
// instead of showing a bordered white/dark box. Unique names keep other Monaco
// editors (file editor, terminal) on their own themes.
const NOTEBOOK_THEME_LIGHT = "semoss-notebook-light";
const NOTEBOOK_THEME_DARK = "semoss-notebook-dark";
const MUTED_LIGHT = "#f5f5f5";
const MUTED_DARK = "#262626";
const MUTED_FOREGROUND_LIGHT = "#737373";
const MUTED_FOREGROUND_DARK = "#a3a3a3";
const FOREGROUND_LIGHT = "#0a0a0a";
const FOREGROUND_DARK = "#fafafa";

/** Editable, syntax-highlighted Monaco source editor used by code cells (and by
 *  markdown cells while editing). */
export const NotebookCellInputCode: React.FC<{
	value: string;
	onChange: (value: string) => void;
	language?: string;
	onRunInPlace?: () => void;
	onRunAndAdvance?: () => void;
	/** Render the editor read-only; run keybindings still fire. */
	readOnly?: boolean;
}> = ({
	value,
	onChange,
	language = "python",
	onRunInPlace,
	onRunAndAdvance,
	readOnly = false,
}) => {
	const { resolvedTheme } = useTheme();
	const [height, setHeight] = useState(MIN_HEIGHT);

	// Stable refs so the one-time addCommand closures always call the latest handlers.
	const onRunInPlaceRef = useRef(onRunInPlace);
	const onRunAndAdvanceRef = useRef(onRunAndAdvance);
	useEffect(() => {
		onRunInPlaceRef.current = onRunInPlace;
		onRunAndAdvanceRef.current = onRunAndAdvance;
	}, [onRunInPlace, onRunAndAdvance]);

	// Clamp the editor height to its content so short cells stay compact and
	// long cells scroll internally instead of stretching the whole notebook.
	const syncHeight = (editor: monaco.editor.IStandaloneCodeEditor) => {
		const nextHeight = Math.min(
			Math.max(editor.getContentHeight(), MIN_HEIGHT),
			MAX_HEIGHT,
		);
		setHeight((prevHeight) =>
			prevHeight === nextHeight ? prevHeight : nextHeight,
		);
	};

	// Register the muted-grey themes before mount so the `theme` prop resolves on
	// first paint (defining them in onMount would miss it).
	const handleBeforeMount: BeforeMount = (monacoInstance) => {
		monacoInstance.editor.defineTheme(NOTEBOOK_THEME_LIGHT, {
			base: "vs",
			inherit: true,
			rules: [],
			colors: {
				"editor.background": MUTED_LIGHT,
				"editorGutter.background": MUTED_LIGHT,
				"editor.lineHighlightBackground": MUTED_LIGHT,
				"editor.lineHighlightBorder": "#00000000",
				"editorLineNumber.foreground": MUTED_FOREGROUND_LIGHT,
				"editorLineNumber.activeForeground": FOREGROUND_LIGHT,
			},
		});
		monacoInstance.editor.defineTheme(NOTEBOOK_THEME_DARK, {
			base: "vs-dark",
			inherit: true,
			rules: [],
			colors: {
				"editor.background": MUTED_DARK,
				"editorGutter.background": MUTED_DARK,
				"editor.lineHighlightBackground": MUTED_DARK,
				"editor.lineHighlightBorder": "#00000000",
				"editorLineNumber.foreground": MUTED_FOREGROUND_DARK,
				"editorLineNumber.activeForeground": FOREGROUND_DARK,
			},
		});
	};

	const handleMount: OnMount = (editor, monacoInstance) => {
		syncHeight(editor);
		editor.onDidContentSizeChange(() => syncHeight(editor));
		editor.addCommand(
			monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
			() => onRunInPlaceRef.current?.(),
		);
		editor.addCommand(
			monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.Enter,
			() => onRunAndAdvanceRef.current?.(),
		);
		// focus on it
		editor.focus();
	};

	return (
		<Suspense
			fallback={
				<pre className="overflow-x-auto whitespace-pre-wrap p-3 font-mono text-foreground text-xs">
					{value}
				</pre>
			}
		>
			<MonacoEditor
				width="100%"
				height={height}
				language={language}
				theme={
					resolvedTheme === "dark"
						? NOTEBOOK_THEME_DARK
						: NOTEBOOK_THEME_LIGHT
				}
				value={value}
				options={{
					readOnly,
					// Suppress Monaco's own right-click menu so the notebook cell
					// context menu shows across the whole cell instead.
					contextmenu: false,
					scrollbar: {
						alwaysConsumeMouseWheel: false,
						horizontal: "hidden",
					},
					lineNumbers: "on",
					lineNumbersMinChars: 2,
					minimap: { enabled: false },
					automaticLayout: true,
					scrollBeyondLastLine: false,
					lineHeight: LINE_HEIGHT,
					overviewRulerBorder: false,
					wordWrap: "on",
					folding: false,
					glyphMargin: false,
					padding: { top: 8, bottom: 8 },
				}}
				onChange={(next) => onChange(next ?? "")}
				beforeMount={handleBeforeMount}
				onMount={handleMount}
			/>
		</Suspense>
	);
};
