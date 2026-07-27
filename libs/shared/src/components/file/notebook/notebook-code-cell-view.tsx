import type { OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { Suspense, useState } from "react";
import { useTheme } from "@semoss/ui/next";
import { MonacoEditor } from "../../monaco";

// Monaco needs an explicit height. A notebook code cell should grow with its
// content (up to a cap, after which it scrolls internally) instead of sitting at
// a fixed size — mirrors the renderer's auto-sizing code cells.
const LINE_HEIGHT = 19;
const MIN_HEIGHT = 44;
const MAX_HEIGHT = 500; // ~25 lines

/** Editable, syntax-highlighted Monaco source editor used by code cells (and by
 *  markdown cells while editing). */
export const NotebookCodeCellView: React.FC<{
	value: string;
	onChange: (value: string) => void;
	language?: string;
}> = ({ value, onChange, language = "python" }) => {
	const { resolvedTheme } = useTheme();
	const [height, setHeight] = useState(MIN_HEIGHT);

	// Clamp the editor height to its content so short cells stay compact and
	// long cells scroll internally instead of stretching the whole notebook.
	const syncHeight = (editor: monaco.editor.IStandaloneCodeEditor) => {
		setHeight(
			Math.min(
				Math.max(editor.getContentHeight(), MIN_HEIGHT),
				MAX_HEIGHT,
			),
		);
	};

	const handleMount: OnMount = (editor) => {
		syncHeight(editor);
		editor.onDidContentSizeChange(() => syncHeight(editor));
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
				theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
				value={value}
				options={{
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
				onMount={handleMount}
			/>
		</Suspense>
	);
};
