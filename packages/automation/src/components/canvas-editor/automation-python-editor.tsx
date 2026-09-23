import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import { MonacoEditor, type monaco, type OnMount } from "@semoss/shared";
import type { AutomationScopeEntry } from "../../domain/automation-inspector";

const SCOPE_REFERENCE_PATTERN = /scope\s*(?:\[\s*|\.get\(\s*)(["'])([^"']+)\1/g;

function entryDocumentation(entry: AutomationScopeEntry): string {
	const lines = [
		`**${entry.name}**`,
		`${entry.label} · ${entry.availability}`,
		entry.description,
	];
	if (entry.defaultValue !== undefined) {
		lines.push(
			"Configured default:",
			"```json",
			JSON.stringify(entry.defaultValue, null, 2).replaceAll(
				"```",
				"\\`\\`\\`",
			),
			"```",
		);
	}
	return lines.join("\n\n");
}

function findScopeReference(
	line: string,
	column: number,
): { name: string; startColumn: number; endColumn: number } | null {
	SCOPE_REFERENCE_PATTERN.lastIndex = 0;
	for (const match of line.matchAll(SCOPE_REFERENCE_PATTERN)) {
		const fullStart = match.index;
		const keyOffset = match[0].lastIndexOf(match[2]);
		const startColumn = fullStart + keyOffset + 1;
		const endColumn = startColumn + match[2].length;
		if (column >= startColumn && column <= endColumn) {
			return { name: match[2], startColumn, endColumn };
		}
	}
	return null;
}

export interface AutomationPythonEditorProps {
	value: string;
	onChange: (value: string) => void;
	scopeEntries: AutomationScopeEntry[];
	theme?: "vs" | "vs-dark";
	readOnly?: boolean;
	fontSize?: number;
}

export interface AutomationPythonEditorHandle {
	insertText: (text: string) => void;
}

/** Python editor with automation-scope completion, provenance hovers, and key validation. */
export const AutomationPythonEditor = forwardRef<
	AutomationPythonEditorHandle,
	AutomationPythonEditorProps
>(function AutomationPythonEditor(
	{ value, onChange, scopeEntries, theme, readOnly = false, fontSize = 13 },
	ref,
) {
	const entriesRef = useRef(scopeEntries);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<typeof monaco | null>(null);
	const providerDisposablesRef = useRef<monaco.IDisposable[]>([]);

	const updateMarkers = useCallback(() => {
		const editor = editorRef.current;
		const monacoApi = monacoRef.current;
		const model = editor?.getModel();
		if (!editor || !monacoApi || !model) return;

		const knownNames = new Set(
			entriesRef.current.map((entry) => entry.name),
		);
		const markers: monaco.editor.IMarkerData[] = [];
		for (
			let lineNumber = 1;
			lineNumber <= model.getLineCount();
			lineNumber++
		) {
			const line = model.getLineContent(lineNumber);
			SCOPE_REFERENCE_PATTERN.lastIndex = 0;
			for (const match of line.matchAll(SCOPE_REFERENCE_PATTERN)) {
				if (knownNames.has(match[2])) continue;
				const keyOffset = match[0].lastIndexOf(match[2]);
				const startColumn = match.index + keyOffset + 1;
				markers.push({
					severity: monacoApi.MarkerSeverity.Warning,
					message: `"${match[2]}" is not available from this node's upstream scope.`,
					startLineNumber: lineNumber,
					startColumn,
					endLineNumber: lineNumber,
					endColumn: startColumn + match[2].length,
				});
			}
		}
		monacoApi.editor.setModelMarkers(model, "automation-scope", markers);
	}, []);

	useEffect(() => {
		entriesRef.current = scopeEntries;
		updateMarkers();
	}, [scopeEntries, updateMarkers]);

	useEffect(
		() => () => {
			for (const disposable of providerDisposablesRef.current) {
				disposable.dispose();
			}
			providerDisposablesRef.current = [];
		},
		[],
	);

	useImperativeHandle(
		ref,
		() => ({
			insertText(text: string) {
				const editor = editorRef.current;
				const selection = editor?.getSelection();
				if (readOnly || !editor || !selection) return;
				editor.executeEdits("automation-scope-insert", [
					{
						range: selection,
						text,
						forceMoveMarkers: true,
					},
				]);
				editor.focus();
			},
		}),
		[readOnly],
	);

	const handleMount = useCallback<OnMount>(
		(editor, monacoApi) => {
			editorRef.current = editor;
			monacoRef.current = monacoApi;
			const model = editor.getModel();
			if (!model) return;

			for (const disposable of providerDisposablesRef.current) {
				disposable.dispose();
			}

			const completionProvider =
				monacoApi.languages.registerCompletionItemProvider("python", {
					triggerCharacters: ["[", "(", '"', "'"],
					provideCompletionItems(candidateModel, position) {
						if (candidateModel !== model)
							return { suggestions: [] };
						const prefix = candidateModel.getValueInRange({
							startLineNumber: position.lineNumber,
							startColumn: 1,
							endLineNumber: position.lineNumber,
							endColumn: position.column,
						});
						const quoted = prefix.match(
							/scope\s*(?:\[\s*|\.get\(\s*)(["'])([^"']*)$/,
						);
						const unquoted = quoted
							? null
							: prefix.match(/scope\s*(\[|\.get\()\s*$/);
						if (!quoted && !unquoted) return { suggestions: [] };

						const typed = quoted?.[2] ?? "";
						const range = new monacoApi.Range(
							position.lineNumber,
							position.column - typed.length,
							position.lineNumber,
							position.column,
						);
						return {
							suggestions: entriesRef.current.map((entry) => ({
								label: entry.name,
								kind: monacoApi.languages.CompletionItemKind
									.Variable,
								detail: `${entry.label} · ${entry.availability}`,
								documentation: {
									value: entryDocumentation(entry),
								},
								insertText: quoted
									? entry.name
									: unquoted?.[1] === "["
										? `["${entry.name}"]`
										: `"${entry.name}")`,
								range,
							})),
						};
					},
				});
			const hoverProvider = monacoApi.languages.registerHoverProvider(
				"python",
				{
					provideHover(candidateModel, position) {
						if (candidateModel !== model) return null;
						const line = candidateModel.getLineContent(
							position.lineNumber,
						);
						const reference = findScopeReference(
							line,
							position.column,
						);
						if (!reference) return null;
						const entry = entriesRef.current.find(
							(item) => item.name === reference.name,
						);
						if (!entry) return null;
						return {
							range: new monacoApi.Range(
								position.lineNumber,
								reference.startColumn,
								position.lineNumber,
								reference.endColumn,
							),
							contents: [{ value: entryDocumentation(entry) }],
						};
					},
				},
			);
			const contentListener =
				editor.onDidChangeModelContent(updateMarkers);
			providerDisposablesRef.current = [
				completionProvider,
				hoverProvider,
				contentListener,
			];
			updateMarkers();
		},
		[updateMarkers],
	);

	return (
		<MonacoEditor
			height="100%"
			width="100%"
			language="python"
			theme={theme}
			value={value}
			onChange={(nextValue) => onChange(nextValue ?? "")}
			onMount={handleMount}
			options={{
				automaticLayout: true,
				fontSize,
				lineNumbers: "on",
				minimap: { enabled: false },
				folding: true,
				scrollBeyondLastLine: false,
				wordWrap: "on",
				readOnly,
				padding: { top: 12, bottom: 12 },
			}}
		/>
	);
});
