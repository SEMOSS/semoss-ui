import { Check, Copy, RotateCcw } from "lucide-react";
import type React from "react";
import { Suspense, useState } from "react";
import { MonacoEditor } from "@semoss/shared";
import { Button, cn, P } from "@semoss/ui/next";

interface SPARQLQueryEditorProps {
	query: string;
	setQuery: (query: string) => void;
	clearQuery: () => void;
	handleEditorMount: (editor, monaco) => void;
	executeQuery: () => void;
	previewLoading: boolean;
	onUserQueryInput?: (query: string) => void;
	raw: boolean;
	onRawChange: (raw: boolean) => void;
}

const SPARQL_KEYWORDS = [
	"SELECT",
	"CONSTRUCT",
	"DESCRIBE",
	"ASK",
	"WHERE",
	"PREFIX",
	"BASE",
	"FROM",
	"NAMED",
	"OPTIONAL",
	"GRAPH",
	"UNION",
	"FILTER",
	"ORDER",
	"BY",
	"GROUP",
	"HAVING",
	"LIMIT",
	"OFFSET",
	"DISTINCT",
	"REDUCED",
	"AS",
	"BIND",
	"VALUES",
	"SERVICE",
	"MINUS",
	"INSERT",
	"DELETE",
	"LOAD",
	"CLEAR",
	"DROP",
	"CREATE",
	"ADD",
	"MOVE",
	"COPY",
	"WITH",
	"USING",
	"NOT",
	"EXISTS",
	"IN",
	"true",
	"false",
	"a",
];

const SPARQL_FUNCTIONS = [
	"STR",
	"LANG",
	"DATATYPE",
	"IRI",
	"URI",
	"BNODE",
	"RAND",
	"ABS",
	"CEIL",
	"FLOOR",
	"ROUND",
	"STRLEN",
	"LCASE",
	"UCASE",
	"ENCODE_FOR_URI",
	"CONTAINS",
	"STRSTARTS",
	"STRENDS",
	"STRBEFORE",
	"STRAFTER",
	"SUBSTR",
	"REPLACE",
	"REGEX",
	"YEAR",
	"MONTH",
	"DAY",
	"HOURS",
	"MINUTES",
	"SECONDS",
	"TIMEZONE",
	"TZ",
	"NOW",
	"UUID",
	"STRUUID",
	"MD5",
	"SHA1",
	"SHA256",
	"SHA384",
	"SHA512",
	"COALESCE",
	"IF",
	"STRLANG",
	"STRDT",
	"SAMETERM",
	"ISIRI",
	"ISURI",
	"ISBLANK",
	"ISLITERAL",
	"ISNUMERIC",
	"BOUND",
	"CONCAT",
	"COUNT",
	"SUM",
	"MIN",
	"MAX",
	"AVG",
	"SAMPLE",
	"GROUP_CONCAT",
];

function registerSparqlLanguage(monaco) {
	const languages = monaco.languages.getLanguages();
	if (languages.some((l) => l.id === "sparql")) return;

	monaco.languages.register({ id: "sparql" });

	monaco.languages.setMonarchTokensProvider("sparql", {
		keywords: SPARQL_KEYWORDS.map((k) => k.toUpperCase()),
		builtins: SPARQL_FUNCTIONS,
		tokenizer: {
			root: [
				// Comments
				[/#.*$/, "comment"],
				// IRIs
				[/<[^>]*>/, "type.identifier"],
				// Prefixed names (prefix:localName)
				[/[a-zA-Z_][\w-]*:[a-zA-Z_][\w-]*/, "type"],
				// Variables
				[/[?$][a-zA-Z_]\w*/, "variable"],
				// String literals (double-quoted)
				[/"([^"\\]|\\.)*"/, "string"],
				// String literals (single-quoted)
				[/'([^'\\]|\\.)*'/, "string"],
				// Numeric literals
				[/[+-]?\d+(\.\d+)?([eE][+-]?\d+)?/, "number"],
				// Keywords and identifiers
				[
					/[a-zA-Z_]\w*/,
					{
						cases: {
							"@keywords": "keyword",
							"@builtins": "predefined",
							"@default": "identifier",
						},
					},
				],
				// Operators and punctuation
				[/[{}()[\]]/, "delimiter"],
				[/[,;.]/, "delimiter"],
				[/[=!<>|+\-*/&^~]+/, "operator"],
			],
		},
	});

	monaco.languages.registerCompletionItemProvider("sparql", {
		provideCompletionItems: (model, position) => {
			const word = model.getWordUntilPosition(position);
			const range = {
				startLineNumber: position.lineNumber,
				endLineNumber: position.lineNumber,
				startColumn: word.startColumn,
				endColumn: word.endColumn,
			};
			const keywordSuggestions = SPARQL_KEYWORDS.map((kw) => ({
				label: kw,
				kind: monaco.languages.CompletionItemKind.Keyword,
				insertText: kw,
				range,
			}));
			const functionSuggestions = SPARQL_FUNCTIONS.map((fn) => ({
				label: fn,
				kind: monaco.languages.CompletionItemKind.Function,
				insertText: `${fn}()`,
				insertTextRules:
					monaco.languages.CompletionItemInsertTextRule
						.InsertAsSnippet,
				range,
			}));
			return {
				suggestions: [...keywordSuggestions, ...functionSuggestions],
			};
		},
	});

	monaco.editor.defineTheme("sparql-theme-dark", {
		base: "vs-dark",
		inherit: true,
		rules: [
			{ token: "keyword", foreground: "569cd6", fontStyle: "bold" },
			{ token: "predefined", foreground: "dcdcaa" },
			{ token: "type.identifier", foreground: "4ec9b0" },
			{ token: "type", foreground: "4ec9b0" },
			{ token: "variable", foreground: "9cdcfe" },
			{ token: "comment", foreground: "6a9955", fontStyle: "italic" },
			{ token: "string", foreground: "ce9178" },
			{ token: "number", foreground: "b5cea8" },
		],
		colors: {},
	});
}

export const SPARQLQueryEditor: React.FC<SPARQLQueryEditorProps> = ({
	query,
	setQuery,
	clearQuery,
	handleEditorMount,
	executeQuery,
	previewLoading,
	onUserQueryInput,
	raw,
	onRawChange,
}) => {
	const [copied, setCopied] = useState(false);

	const handleCopyQuery = async () => {
		if (query && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(query);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch (err) {
				console.error("Failed to copy query:", err);
			}
		}
	};

	const handleMount = (editor, monaco) => {
		registerSparqlLanguage(monaco);
		monaco.editor.setTheme("sparql-theme-dark");
		handleEditorMount(editor, monaco);
	};

	return (
		<div
			className="flex h-full flex-col overflow-hidden"
			data-testid="sparql-query-editor"
		>
			{/* Header */}
			<div className="flex flex-shrink-0 items-center justify-between border-border/50 border-b bg-gradient-to-r from-accent/50 via-accent/40 to-accent/30 px-4 py-2.5">
				<h3
					className="font-semibold text-foreground text-sm"
					data-testid="query-editor-title"
				>
					Enter Query
				</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={clearQuery}
					className="h-8 gap-1.5 font-medium text-primary text-xs hover:bg-primary/10 hover:text-primary"
					data-testid="query-reset-btn"
				>
					<RotateCcw className="size-3.5" />
					Reset
				</Button>
			</div>

			{/* Editor Container */}
			<div className="group/query-editor relative m-2 flex flex-1 flex-col overflow-hidden rounded-2xl border-2 border-primary/40 bg-muted/30 shadow-lg transition-all duration-300 hover:border-primary/60 hover:shadow-xl">
				{/* Copy Button */}
				{query && (
					<div className="pointer-events-none absolute top-3 right-3 z-10 opacity-0 transition-opacity group-focus-within/query-editor:pointer-events-auto group-focus-within/query-editor:opacity-100 group-hover/query-editor:pointer-events-auto group-hover/query-editor:opacity-100">
						<Button
							variant="secondary"
							size="icon"
							onClick={handleCopyQuery}
							title={copied ? "Copied!" : "Copy query"}
							className={cn(
								"size-8 bg-background/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105",
							)}
							data-testid="query-copy-btn"
						>
							{copied ? (
								<Check className="size-4" />
							) : (
								<Copy className="size-4" />
							)}
						</Button>
					</div>
				)}

				{/* Monaco Editor */}
				<div className="relative h-full min-h-[200px] overflow-hidden bg-gradient-to-br from-card to-muted/50">
					<Suspense
						fallback={
							<div className="flex h-full items-center justify-center p-4">
								<div className="flex items-center gap-2">
									<div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
									<P className="text-muted-foreground text-sm">
										Loading editor...
									</P>
								</div>
							</div>
						}
					>
						<MonacoEditor
							value={query}
							defaultValue=""
							language="sparql"
							options={{
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
								wordBasedSuggestions: false,
								colorDecorators: true,
								padding: { top: 12, bottom: 12 },
								renderLineHighlight: "all",
								cursorBlinking: "smooth",
								smoothScrolling: true,
							}}
							onChange={(value) => {
								const nextQuery = value || "";
								setQuery(nextQuery);
								onUserQueryInput?.(nextQuery);
							}}
							onMount={handleMount}
						/>
					</Suspense>
				</div>
			</div>

			{/* Query Actions */}
			<div className="flex flex-shrink-0 items-center justify-between border-border/50 border-t px-4 py-2">
				<Button
					variant={raw ? "default" : "outline"}
					size="sm"
					onClick={() => onRawChange(!raw)}
					data-testid="sparql-raw-toggle-btn"
				>
					{raw ? "Raw: On" : "Raw: Off"}
				</Button>
				<Button
					variant="default"
					onClick={executeQuery}
					disabled={previewLoading || !query.trim()}
					data-testid="query-run-btn"
				>
					{previewLoading ? "Running..." : "Run Query"}
				</Button>
			</div>
		</div>
	);
};
