import { getMonaco } from "./monaco-editor-import";

// import type * as Monaco from "monaco-editor";

const COMPLETION_ITEM_KIND_FUNCTION = 1;
const COMPLETION_ITEM_KIND_SNIPPET = 27;
const COMPLETION_ITEM_INSERT_AS_SNIPPET = 4;

let monaco: unknown;
getMonaco().then((m) => {
	monaco = m;
});

type MONACO_LANGUAGES =
	| "text"
	| "javascript"
	| "typescript"
	| "react"
	| "html"
	| "css"
	| "python"
	| "json"
	| "java"
	| "markdown"
	| "yaml"
	| "xml"
	| "sh"
	| "bash"
	| "csv"
	| "tsv";

export const MONACO_EXT_LANGUAGE_MAPPING: Record<string, MONACO_LANGUAGES> = {
	// Text files
	txt: "text",
	text: "text",

	// JavaScript/TypeScript
	js: "javascript",
	jsx: "react",
	ts: "typescript",
	tsx: "react",

	// Web
	html: "html",
	css: "css",

	// Python
	py: "python",

	// JSON
	json: "json",

	// Java
	java: "java",

	// Markdown
	md: "markdown",
	markdown: "markdown",

	// YAML
	yaml: "yaml",
	yml: "yaml",

	// XML
	xml: "xml",

	// Shell
	sh: "sh",
	bash: "bash",

	// Data files
	csv: "csv",
	tsv: "tsv",
};

export const MONACO_CONFIG: Record<
	string,
	{
		monarchTokensProvider?: unknown;
		completionItemProvider?: unknown;
		theme?: unknown;
	}
> = {
	java: {
		monarchTokensProvider: {
			defaultToken: "invalid",
			keywords: [
				"abstract",
				"continue",
				"for",
				"new",
				"switch",
				"assert",
				"default",
				"goto",
				"package",
				"synchronized",
				"boolean",
				"do",
				"if",
				"private",
				"this",
				"break",
				"double",
				"implements",
				"protected",
				"throw",
				"byte",
				"else",
				"import",
				"public",
				"throws",
				"case",
				"enum",
				"instanceof",
				"return",
				"transient",
				"catch",
				"extends",
				"int",
				"short",
				"try",
				"char",
				"final",
				"interface",
				"static",
				"void",
				"class",
				"finally",
				"long",
				"strictfp",
				"volatile",
				"const",
				"float",
				"native",
				"super",
				"while",
			],
			typeKeywords: [
				"byte",
				"short",
				"int",
				"long",
				"char",
				"float",
				"double",
				"boolean",
				"void",
			],
			operators: [
				"=",
				">",
				"<",
				"!",
				"~",
				"?",
				":",
				"==",
				"<=",
				">=",
				"!=",
				"&&",
				"||",
				"++",
				"--",
				"+",
				"-",
				"*",
				"/",
				"&",
				"|",
				"^",
				"%",
				"<<",
				">>",
				">>>",
				"+=",
				"-=",
				"*=",
				"/=",
				"&=",
				"|=",
				"^=",
				"%=",
				"<<=",
				">>=",
				">>>=",
			],
			symbols: /[=><!~?:&|+\-*/^%]+/,
			escapes: /\\(?:[btnfr"'\\]|u[0-9A-Fa-f]{4})/,
			tokenizer: {
				root: [
					[/\b[a-zA-Z_][\w$]*(?=\s*\()/, "function"],
					[
						/[a-z_$][\w$]*/,
						{
							cases: {
								"@keywords": "keyword",
								"@default": "identifier",
							},
						},
					],
					[/[A-Z][\w$]*/, "type.identifier"],
					{ include: "@whitespace" },
					[/[{}()[\]]/, "@brackets"],
					[
						/(@symbols)/,
						{
							cases: {
								"@operators": "operator",
								"@default": "",
							},
						},
					],
					[/\d+\.\d+([eE][-+]?\d+)?[fFdD]?/, "number.float"],
					[/0[xX][0-9a-fA-F]+[Ll]?/, "number.hex"],
					[/\d+[lL]?/, "number"],
					[/[;,.]/, "delimiter"],
					[
						/"/,
						{
							token: "string.quote",
							bracket: "@open",
							next: "@string",
						},
					],
				],
				comment: [
					[/[^/*]+/, "comment"],
					[/\*\//, "comment", "@pop"],
					[/[/*]/, "comment"],
				],
				string: [
					[/[^\\"]+/, "string"],
					[/@escapes/, "string.escape"],
					[/\\./, "string.escape.invalid"],
					[
						/"/,
						{
							token: "string.quote",
							bracket: "@close",
							next: "@pop",
						},
					],
				],
				whitespace: [
					[/[ \t\r\n]+/, ""],
					[/\/\*/, "comment", "@comment"],
					[/\/\/.*$/, "comment"],
				],
			},
		},
		completionItemProvider: {
			triggerCharacters: [".", "("],
			provideCompletionItems: (model, position) => {
				const word = model.getWordUntilPosition(position);
				const range = {
					startLineNumber: position.lineNumber,
					endLineNumber: position.lineNumber,
					startColumn: word.startColumn,
					endColumn: word.endColumn,
				};

				return {
					suggestions: [
						{
							label: "System.out.println",
							kind: COMPLETION_ITEM_KIND_FUNCTION,
							insertText: "System.out.println($1);",
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "Prints a message to the console.",
						},
						{
							label: "public class",
							kind: COMPLETION_ITEM_KIND_SNIPPET,
							insertText: [
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"public class ${1:ClassName} {",
								"    public static void main(String[] args) {",
								"        $0",
								"    }",
								"}",
							].join("\n"),
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "Java class with main method.",
						},
					].map((s) => ({
						...s,
						range,
					})),
				};
			},
		},
		theme: {
			base: "vs",
			inherit: true,
			rules: [
				{ token: "keyword", foreground: "0000FF", fontStyle: "bold" },
				{ token: "type.identifier", foreground: "2B91AF" },
				{ token: "function", foreground: "B58B00" },
				{ token: "comment", foreground: "008000", fontStyle: "italic" },
				{ token: "string", foreground: "A31515" },
				{ token: "number", foreground: "098658" },
				{ token: "operator", foreground: "000000" },
			],
			colors: {},
		},
	},
	python: {
		completionItemProvider: {
			triggerCharacters: [".", "("],
			provideCompletionItems: (model, position) => {
				const word = model.getWordUntilPosition(position);
				const range = {
					startLineNumber: position.lineNumber,
					endLineNumber: position.lineNumber,
					startColumn: word.startColumn,
					endColumn: word.endColumn,
				};

				return {
					suggestions: [
						{
							label: "print",
							kind: COMPLETION_ITEM_KIND_FUNCTION,
							insertText: 'print(${1:"Hello, world!"})',
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "Print to the console.",
						},
						{
							label: "for loop",
							kind: COMPLETION_ITEM_KIND_SNIPPET,
							insertText: [
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"for ${1:item} in ${2:iterable}:",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"    ${0:# do something}",
							].join("\n"),
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "For loop in Python.",
						},
						{
							label: "if-else",
							kind: COMPLETION_ITEM_KIND_SNIPPET,
							insertText: [
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"if ${1:condition}:",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"    ${0:# do something}",
								"else:",
								"    # handle else",
							].join("\n"),
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "If-else block in Python.",
						},
						{
							label: "def function",
							kind: COMPLETION_ITEM_KIND_SNIPPET,
							insertText: [
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"def ${1:function_name}(${2:args}):",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"    ${0:pass}",
							].join("\n"),
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "Define a Python function.",
						},
						{
							label: "class",
							kind: COMPLETION_ITEM_KIND_SNIPPET,
							insertText: [
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"class ${1:ClassName}:",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"    def __init__(self, ${2:args}):",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"        ${0:pass}",
							].join("\n"),
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "Define a class with a constructor.",
						},
						{
							label: "while loop",
							kind: COMPLETION_ITEM_KIND_SNIPPET,
							insertText: [
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"while ${1:condition}:",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"    ${0:# do something}",
							].join("\n"),
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "While loop in Python.",
						},
					].map((s) => ({
						...s,
						range,
					})),
				};
			},
		},
		theme: {
			base: "vs",
			inherit: true,
			rules: [
				{ token: "identifier", foreground: "B58B00" },
				{ token: "keyword", foreground: "0000FF", fontStyle: "bold" },
				{ token: "comment", foreground: "008000", fontStyle: "italic" },
				{ token: "string", foreground: "A31515" },
				{ token: "number", foreground: "098658" },
				{ token: "operator", foreground: "000000" },
			],
			colors: {},
		},
	},
	react: {
		theme: {
			base: "vs",
			inherit: true,
			rules: [
				{ token: "keyword", foreground: "AF00DB", fontStyle: "bold" },
				{ token: "identifier", foreground: "001080" },
				{ token: "type.identifier", foreground: "267F99" },
				{ token: "function", foreground: "795E26" },
				{ token: "comment", foreground: "008000", fontStyle: "italic" },
				{ token: "string", foreground: "A31515" },
				{ token: "number", foreground: "098658" },
				{ token: "operator", foreground: "000000" },
				{ token: "tag", foreground: "800000" },
				{ token: "attribute.name", foreground: "FF0000" },
				{ token: "attribute.value", foreground: "0000FF" },
				{ token: "delimiter.html", foreground: "800000" },
				{ token: "metatag.html", foreground: "800000" },
				{ token: "metatag.content.html", foreground: "FF0000" },
			],
			colors: {},
		},
		completionItemProvider: {
			triggerCharacters: [".", "<", "("],
			provideCompletionItems: (model, position) => {
				const word = model.getWordUntilPosition(position);
				const range = {
					startLineNumber: position.lineNumber,
					endLineNumber: position.lineNumber,
					startColumn: word.startColumn,
					endColumn: word.endColumn,
				};

				return {
					suggestions: [
						{
							label: "useState",
							kind: COMPLETION_ITEM_KIND_FUNCTION,
							insertText:
								"const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});",
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "React useState hook.",
						},
						{
							label: "useEffect",
							kind: COMPLETION_ITEM_KIND_FUNCTION,
							insertText: [
								"useEffect(() => {",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"    ${1:// effect}",
								"    return () => {",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"        ${2:// cleanup}",
								"    };",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"}, [${3:dependencies}]);",
							].join("\n"),
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation: "React useEffect hook.",
						},
						{
							label: "React Functional Component",
							kind: COMPLETION_ITEM_KIND_SNIPPET,
							insertText: [
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"const ${1:ComponentName} = () => {",
								"    return (",
								"        <div>",
								"            $0",
								"        </div>",
								"    );",
								"};",
								"",
								//biome-ignore lint/suspicious/noTemplateCurlyInString: this is intentional for the snippet
								"export default ${1:ComponentName};",
							].join("\n"),
							insertTextRules: COMPLETION_ITEM_INSERT_AS_SNIPPET,
							documentation:
								"React functional component template.",
						},
					].map((s) => ({
						...s,
						range,
					})),
				};
			},
		},
	},
};
