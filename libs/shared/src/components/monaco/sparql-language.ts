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

export const SPARQL_LANGUAGE_ID = "sparql";
export const SPARQL_THEME_DARK = "sparql-theme-dark";
export const SPARQL_THEME_LIGHT = "sparql-theme-light";

// biome-ignore lint/suspicious/noExplicitAny: monaco-editor types vary across consumers
export function registerSparqlLanguage(monaco: any): void {
	const languages = monaco.languages.getLanguages();
	const alreadyRegistered = languages.some(
		(l: { id: string }) => l.id === SPARQL_LANGUAGE_ID,
	);

	if (!alreadyRegistered) {
		monaco.languages.register({ id: SPARQL_LANGUAGE_ID });

		monaco.languages.setMonarchTokensProvider(SPARQL_LANGUAGE_ID, {
			keywords: SPARQL_KEYWORDS.map((k) => k.toUpperCase()),
			builtins: SPARQL_FUNCTIONS,
			tokenizer: {
				root: [
					[/#.*$/, "comment"],
					[/<[^>]*>/, "type.identifier"],
					[/[a-zA-Z_][\w-]*:[a-zA-Z_][\w-]*/, "type"],
					[/[?$][a-zA-Z_]\w*/, "variable"],
					[/"([^"\\]|\\.)*"/, "string"],
					[/'([^'\\]|\\.)*'/, "string"],
					[/[+-]?\d+(\.\d+)?([eE][+-]?\d+)?/, "number"],
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
					[/[{}()[\]]/, "delimiter"],
					[/[,;.]/, "delimiter"],
					[/[=!<>|+\-*/&^~]+/, "operator"],
				],
			},
		});

		monaco.languages.registerCompletionItemProvider(SPARQL_LANGUAGE_ID, {
			// biome-ignore lint/suspicious/noExplicitAny: monaco types
			provideCompletionItems: (model: any, position: any) => {
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
					suggestions: [
						...keywordSuggestions,
						...functionSuggestions,
					],
				};
			},
		});
	}

	monaco.editor.defineTheme(SPARQL_THEME_DARK, {
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

	monaco.editor.defineTheme(SPARQL_THEME_LIGHT, {
		base: "vs",
		inherit: true,
		rules: [
			{ token: "keyword", foreground: "0451a5", fontStyle: "bold" },
			{ token: "predefined", foreground: "795e26" },
			{ token: "type.identifier", foreground: "267f99" },
			{ token: "type", foreground: "267f99" },
			{ token: "variable", foreground: "0070c1" },
			{ token: "comment", foreground: "008000", fontStyle: "italic" },
			{ token: "string", foreground: "a31515" },
			{ token: "number", foreground: "098658" },
		],
		colors: { "editor.background": "#FAFAFA" },
	});
}
