import { DatabaseIcon } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
	MonacoEditor,
	type monaco,
	type OnMount,
	registerSparqlLanguage,
	SPARQL_THEME_DARK,
	SPARQL_THEME_LIGHT,
} from "@semoss/shared";
import {
	Button,
	Form,
	Spinner,
	useForm,
	useTheme,
	zodResolver,
} from "@semoss/ui/next";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import { useWorkbenchControl, useWorkbenchPanel } from "@semoss/workbench";
import { useDatabaseWorkbench } from "@/hooks/use-database-workbench";
import { useEngine } from "@/hooks/useEngine";
import { DatabaseNewQueryControl } from "./database-new-query-control";
import {
	DATABASE_RUN_OPTIONS_DEFAULTS,
	DATABASE_RUN_OPTIONS_SCHEMA,
	type DatabaseRunOptions,
	type DatabaseRunOptionsInput,
} from "./database-run-options";
import { DatabaseTransactionOptions } from "./database-transaction-options";

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

/** The config a query-editor instance is opened with. */
export interface DatabaseQueryConfig {
	/** Query text the editor starts with. */
	initialQuery?: string;
	/** Sequence number behind the default "Query N" name. */
	queryNumber?: number;
}

/**
 * A self-contained query editor bound to a single workbench panel. Each panel
 * owns its own query text, seeded from its config, and its run options: the
 * SPARQL raw toggle, or, on a relational database, whether the script runs in
 * one transaction. So multiple panels can coexist without sharing editor state.
 */
const DatabaseQueryPanel: WorkbenchComponent = ({ id }) => {
	const { config } = useWorkbenchPanel<DatabaseQueryConfig>(id);
	const { permission } = useEngine();

	const mode = useDatabaseWorkbench((state) => state.mode);
	const category = useDatabaseWorkbench((state) => state.category.data);
	const structure = useDatabaseWorkbench((state) => state.structure.data);
	const onQuery = useDatabaseWorkbench((state) => state.onQuery);
	const isRunning = useDatabaseWorkbench(
		(state) => state.runningPanels[id] ?? false,
	);

	// only a relational database runs a script in one transaction, offered to
	// anyone who can query it; each statement still needs the access it needs
	const offersTransaction =
		mode === "SQL" &&
		category === "SQL" &&
		(permission === "OWNER" ||
			permission === "EDIT" ||
			permission === "READ_ONLY");

	const form = useForm<DatabaseRunOptionsInput, unknown, DatabaseRunOptions>({
		resolver: zodResolver(DATABASE_RUN_OPTIONS_SCHEMA),
		defaultValues: DATABASE_RUN_OPTIONS_DEFAULTS,
		// a hidden option takes its default, so it never blocks a run
		shouldUnregister: true,
	});
	const formRef = useRef<HTMLFormElement | null>(null);

	useWorkbenchControl(id, DatabaseNewQueryControl);

	const { resolvedTheme } = useTheme();
	const panelId = id;
	const initialQuery = config.initialQuery ?? "";
	const editorTheme =
		mode === "SPARQL"
			? resolvedTheme === "dark"
				? SPARQL_THEME_DARK
				: SPARQL_THEME_LIGHT
			: resolvedTheme === "dark"
				? "vs-dark"
				: "vs-light";

	const [query, setQuery] = useState(initialQuery);
	const [sparqlRaw, setSparqlRaw] = useState(true);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<typeof monaco | null>(null);
	const completionProviderRef = useRef<monaco.IDisposable | null>(null);

	/** Runs the editor's query with the checked run options. */
	const handleSubmit = ({
		isOneTransaction,
		timeoutSeconds,
	}: DatabaseRunOptions) => {
		if (isRunning) {
			return;
		}
		const isTransaction = offersTransaction && isOneTransaction;
		onQuery({
			panelId,
			query: editorRef.current?.getValue() ?? query,
			raw: mode === "SPARQL" ? sparqlRaw : undefined,
			transaction: isTransaction,
			timeout: isTransaction ? timeoutSeconds : undefined,
		});
	};

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
			mode !== "SPARQL"
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

	useEffect(() => {
		if (!monacoRef.current) {
			return;
		}

		const monaco = monacoRef.current;

		if (mode === "SPARQL") {
			registerSparqlLanguage(monaco);
		}

		monaco.editor.setTheme(editorTheme);
	}, [editorTheme, mode]);

	const handleEditorMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;
		monacoRef.current = monaco;

		try {
			if (mode === "SPARQL") {
				registerSparqlLanguage(monaco);
			}

			monaco.editor.setTheme(editorTheme);

			registerCompletionProvider();

			editor.addAction({
				contextMenuGroupId: "1_modification",
				contextMenuOrder: 0,
				id: `run-query-${panelId}`,
				label: "Run Query",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
				// submits the run options form, which reads the options when the
				// shortcut is pressed
				run: () => {
					formRef.current?.requestSubmit();
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
						theme={editorTheme}
						options={{
							fixedOverflowWidgets: mode !== "SPARQL",
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

			<Form
				ref={formRef}
				form={form}
				onSubmit={handleSubmit}
				className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-border border-t p-2"
			>
				{mode === "SPARQL" ? (
					<Button
						type="button"
						variant={sparqlRaw ? "default" : "outline"}
						size="sm"
						onClick={() => setSparqlRaw((current) => !current)}
						data-testid="sparql-raw-toggle-btn"
					>
						{sparqlRaw ? "Raw: On" : "Raw: Off"}
					</Button>
				) : offersTransaction ? (
					<DatabaseTransactionOptions disabled={isRunning} />
				) : (
					<div />
				)}
				<Button
					type="submit"
					variant="default"
					size="sm"
					disabled={isRunning || !query.trim()}
					data-testid="query-run-btn"
				>
					{isRunning ? <Spinner /> : "Run"}
				</Button>
			</Form>
		</div>
	);
};

/**
 * Blueprint for query editor instances — the only user-renamable panel type.
 * keepAlive: unsent query text and the run options survive tab switches.
 */
export const DATABASE_QUERY_PANEL: WorkbenchPanelConfig<DatabaseQueryConfig> = {
	name: "Query",
	icon: ({ className }) => <DatabaseIcon className={className} />,
	canRename: true,
	mount: "keepAlive",
	content: DatabaseQueryPanel,
};
