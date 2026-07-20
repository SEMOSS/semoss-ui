import type React from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { ColumnInterface } from "@semoss/sdk";
import {
	type FlexLayout,
	MonacoEditor,
	type monaco,
	type OnMount,
	registerSparqlLanguage,
	SPARQL_THEME_LIGHT,
} from "@semoss/shared";
import { Button, Spinner } from "@semoss/ui/next";
import type { QueryWorkspaceMode } from "./query-script-templates";

const SQL_KEYWORDS = [
	"SELECT",
	"FROM",
	"WHERE",
	"AND",
	"OR",
	"JOIN",
	"LEFT",
	"RIGHT",
	"INNER",
	"OUTER",
	"ON",
	"GROUP BY",
	"ORDER BY",
	"HAVING",
	"LIMIT",
	"OFFSET",
	"DISTINCT",
	"AS",
	"COUNT",
	"SUM",
	"AVG",
	"MIN",
	"MAX",
	"INSERT",
	"INTO",
	"VALUES",
	"UPDATE",
	"SET",
	"DELETE",
];

interface QueryEditorPanelProps {
	/** The FlexLayout tab node backing this editor panel */
	node: FlexLayout.TabNode;
	/** Query language for this workspace */
	mode: QueryWorkspaceMode;
	/** Structure */
	structure: {
		table: string;
		columns: ColumnInterface[];
	}[];
	/** Whether a query is currently running (shared across panels) */
	isRunning: boolean;

	/** Runs a query and routes its results to the shared results panel */
	onRun: (query: string, panelId: string, raw?: boolean) => void;
}

/**
 * A self-contained query editor bound to a single FlexLayout tab. Each panel
 * owns its own query text and (for SPARQL) raw toggle, seeded from the tab
 * config, so multiple panels can coexist without sharing editor state.
 */
export const QueryEditorPanel: React.FC<QueryEditorPanelProps> = ({
	node,
	mode,
	structure,
	isRunning,
	onRun,
}) => {
	const panelId = node.getId();
	const initialQuery =
		(node.getConfig() as { initialQuery?: string } | undefined)
			?.initialQuery ?? "";

	const [query, setQuery] = useState(initialQuery);
	const [sparqlRaw, setSparqlRaw] = useState(true);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<typeof monaco | null>(null);
	const completionProviderRef = useRef<monaco.IDisposable | null>(null);

	const registerCompletionProvider = useCallback(() => {
		if (!monacoRef.current) {
			return;
		}

		const monaco = monacoRef.current;

		completionProviderRef.current?.dispose();

		const schemaSuggestions = structure.flatMap((table) => {
			const tableSuggestion = {
				label: table.table,
				kind: monaco.languages.CompletionItemKind.Class,
				insertText: table.table,
				detail: mode === "SPARQL" ? "Graph/Table" : "Table",
				sortText: `1_${table.table}`,
			};

			const columnSuggestions = table.columns.map((column) => {
				const columnType = column.type;
				return {
					label: column.column,
					kind: monaco.languages.CompletionItemKind.Field,
					insertText: column.column,
					detail: columnType
						? `Column (${table.table}) • ${columnType}`
						: `Column (${table.table})`,
					sortText: `2_${table.table}_${column.column}`,
				};
			});

			return [tableSuggestion, ...columnSuggestions];
		});

		const baseSuggestions =
			mode === "SQL"
				? [
						...SQL_KEYWORDS.map((keyword) => ({
							label: keyword,
							kind: monaco.languages.CompletionItemKind.Keyword,
							insertText: keyword,
							detail: "Keyword",
							sortText: `0_${keyword}`,
						})),
						...schemaSuggestions,
					]
				: schemaSuggestions;

		completionProviderRef.current =
			monaco.languages.registerCompletionItemProvider(
				mode === "SPARQL" ? "sparql" : "sql",
				{
					triggerCharacters:
						mode === "SPARQL"
							? [" ", ".", "_", "?", ":"]
							: [" ", ".", "_"],
					provideCompletionItems: (model, position) => {
						const word = model.getWordUntilPosition(position);
						const range = new monaco.Range(
							position.lineNumber,
							word.startColumn,
							position.lineNumber,
							word.endColumn,
						);

						return {
							suggestions: baseSuggestions.map((suggestion) => ({
								...suggestion,
								range,
							})),
						};
					},
				},
			);
	}, [mode, structure]);

	useEffect(() => {
		registerCompletionProvider();

		return () => {
			completionProviderRef.current?.dispose();
			completionProviderRef.current = null;
		};
	}, [registerCompletionProvider]);

	const handleEditorMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;
		monacoRef.current = monaco;

		try {
			if (mode === "SPARQL") {
				registerSparqlLanguage(monaco);
				monaco.editor.setTheme(SPARQL_THEME_LIGHT);
			}

			registerCompletionProvider();

			editor.addAction({
				contextMenuGroupId: "1_modification",
				contextMenuOrder: 0,
				id: `run-query-${panelId}`,
				label: "Run Query",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
				run: () => {
					onRun(
						editor.getValue(),
						panelId,
						mode === "SPARQL" ? sparqlRaw : undefined,
					);
				},
			});

			editor.addAction({
				contextMenuGroupId: "1_modification",
				contextMenuOrder: 1,
				id: `reset-query-${panelId}`,
				label: "Reset Query",
				run: () => {
					setQuery("");
					editorRef.current?.setValue("");
				},
			});

			if (initialQuery) {
				editor.setValue(initialQuery);
			}

			// focus on it
			editor.focus();
		} catch (error) {
			console.error("Error setting up editor:", error);
		}
	};
	return (
		<div
			className="flex h-full flex-col overflow-hidden"
			data-testid={
				mode === "SPARQL" ? "sparql-query-editor" : "sql-query-editor"
			}
		>
			<div className="flex flex-1 flex-col overflow-hidden">
				<Suspense
					fallback={
						<div className="flex h-full w-full items-center justify-center">
							<Spinner />
						</div>
					}
				>
					<MonacoEditor
						width={"100%"}
						height={"100%"}
						value={query}
						language={mode === "SPARQL" ? "sparql" : "sql"}
						options={{
							fixedOverflowWidgets: mode === "SQL",
							scrollbar: {
								horizontal: "hidden",
								horizontalScrollbarSize: 0,
								alwaysConsumeMouseWheel: false,
							},
							readOnly: false,
							minimap: { enabled: false },
							automaticLayout: true,
							scrollBeyondLastLine: false,
							lineHeight: 20,
							fontSize: 14,
							overviewRulerBorder: false,
							lineNumbers: "on",
							glyphMargin: false,
							folding: false,
							lineNumbersMinChars: 3,
							wordWrap: "on",
							wrappingStrategy: "advanced",
							tabSize: 4,
							quickSuggestions: true,
							suggestOnTriggerCharacters: true,
							wordBasedSuggestions: "off",
							colorDecorators: true,
							padding: { top: 12, bottom: 12 },
							renderLineHighlight: "all",
							cursorBlinking: "smooth",
							smoothScrolling: true,
						}}
						onChange={(value) => {
							setQuery(value || "");
						}}
						onMount={handleEditorMount}
					/>
				</Suspense>
			</div>

			<div className="flex shrink-0 items-center justify-between border-border border-t p-2">
				{mode === "SPARQL" ? (
					<Button
						variant={sparqlRaw ? "default" : "outline"}
						size="sm"
						onClick={() => setSparqlRaw((current) => !current)}
						data-testid="sparql-raw-toggle-btn"
					>
						{sparqlRaw ? "Raw: On" : "Raw: Off"}
					</Button>
				) : (
					<div />
				)}
				<Button
					variant="default"
					size="sm"
					onClick={() => {
						onRun(
							query,
							panelId,
							mode === "SPARQL" ? sparqlRaw : undefined,
						);
					}}
					disabled={isRunning || !query.trim()}
					data-testid="query-run-btn"
				>
					{isRunning ? <Spinner /> : "Run"}
				</Button>
			</div>
		</div>
	);
};
