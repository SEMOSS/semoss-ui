import { useCallback, useEffect, useRef } from "react";

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

interface EditorHookParams {
	onRun: (query: string) => void;
	initialValue?: string;
	tables?: Array<{
		table: string;
		columns: Array<{ column: string; type?: string; dataType?: string }>;
	}>;
}

type MonacoPosition = {
	lineNumber: number;
	column: number;
};

type MonacoWord = {
	startColumn: number;
	endColumn: number;
};

type MonacoModel = {
	getWordUntilPosition: (position: MonacoPosition) => MonacoWord;
};

type MonacoCompletionItem = {
	label: string;
	kind: number;
	insertText: string;
	detail?: string;
	sortText?: string;
	range?: unknown;
};

type MonacoCompletionProvider = {
	triggerCharacters?: string[];
	provideCompletionItems: (
		model: MonacoModel,
		position: MonacoPosition,
	) => { suggestions: MonacoCompletionItem[] };
};

type MonacoDisposable = {
	dispose: () => void;
};

type MonacoRangeCtor = new (
	startLineNumber: number,
	startColumn: number,
	endLineNumber: number,
	endColumn: number,
) => unknown;

type MonacoApi = {
	languages: {
		registerCompletionItemProvider: (
			languageId: string,
			provider: MonacoCompletionProvider,
		) => MonacoDisposable;
		CompletionItemKind: {
			Keyword: number;
			Class: number;
			Field: number;
		};
	};
	Range: MonacoRangeCtor;
	KeyMod: {
		CtrlCmd: number;
	};
	KeyCode: {
		Enter: number;
	};
};

type MonacoEditor = {
	addAction: (action: {
		id: string;
		label: string;
		keybindings: number[];
		run: () => void;
	}) => void;
	setValue: (value: string) => void;
	getValue: () => string;
};

const isMonacoApi = (value: unknown): value is MonacoApi => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const api = value as MonacoApi;
	return (
		typeof api.Range === "function" &&
		typeof api.languages?.registerCompletionItemProvider === "function"
	);
};

const isMonacoEditor = (value: unknown): value is MonacoEditor => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const editor = value as MonacoEditor;
	return (
		typeof editor.addAction === "function" &&
		typeof editor.getValue === "function"
	);
};

export function useQueryEditor({
	onRun,
	initialValue = "",
	tables = [],
}: EditorHookParams) {
	const editorRef = useRef<MonacoEditor | null>(null);
	const monacoRef = useRef<MonacoApi | null>(null);
	const completionProviderRef = useRef<MonacoDisposable | null>(null);
	const onRunRef = useRef(onRun);

	useEffect(() => {
		onRunRef.current = onRun;
	}, [onRun]);

	const registerCompletionProvider = useCallback(() => {
		if (!monacoRef.current) {
			return;
		}

		const monaco = monacoRef.current;

		if (completionProviderRef.current) {
			completionProviderRef.current.dispose();
		}

		const baseSuggestions: MonacoCompletionItem[] = [
			...SQL_KEYWORDS.map((keyword) => ({
				label: keyword,
				kind: monaco.languages.CompletionItemKind.Keyword,
				insertText: keyword,
				detail: "Keyword",
				sortText: `0_${keyword}`,
			})),
			...tables.flatMap((table) => {
				const tableSuggestion: MonacoCompletionItem = {
					label: table.table,
					kind: monaco.languages.CompletionItemKind.Class,
					insertText: table.table,
					detail: "Table",
					sortText: `1_${table.table}`,
				};

				const columnSuggestions: MonacoCompletionItem[] =
					table.columns.map((column) => {
						const columnType = column.dataType || column.type;
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
			}),
		];

		completionProviderRef.current =
			monaco.languages.registerCompletionItemProvider("sql", {
				triggerCharacters: [" ", ".", "_"],
				provideCompletionItems: (
					model: MonacoModel,
					position: MonacoPosition,
				) => {
					const word = model.getWordUntilPosition(position);
					const range = new monaco.Range(
						position.lineNumber,
						word.startColumn,
						position.lineNumber,
						word.endColumn,
					);

					const suggestions = baseSuggestions.map((suggestion) => ({
						...suggestion,
						range,
					}));

					return { suggestions };
				},
			});
	}, [tables]);

	useEffect(() => {
		registerCompletionProvider();
		return () => {
			if (completionProviderRef.current) {
				completionProviderRef.current.dispose();
				completionProviderRef.current = null;
			}
		};
	}, [registerCompletionProvider]);

	const handleEditorMount = (editor: unknown, monaco: unknown) => {
		if (!isMonacoEditor(editor) || !isMonacoApi(monaco)) {
			return;
		}

		editorRef.current = editor;
		monacoRef.current = monaco;

		try {
			registerCompletionProvider();

			editor.addAction({
				id: "run-query",
				label: "Run Query",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
				run: () => {
					onRunRef.current(editor.getValue());
				},
			});

			if (initialValue) {
				editor.setValue(initialValue);
			}
		} catch (error) {
			console.error("Error setting up editor:", error);
		}
	};

	const setValue = (value: string) => {
		if (editorRef.current) {
			editorRef.current.setValue(value);
		}
	};

	return {
		editorRef,
		handleEditorMount,
		setValue,
	};
}
