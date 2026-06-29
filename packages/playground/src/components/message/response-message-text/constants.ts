export const FENCED_HTML_RE = /```html[ \t]*\n([\s\S]*?)(?:\n```|$)/i;

export const KNOWN_SHIKI_LANGS = new Set([
	"c",
	"r",
	"go",
	"js",
	"ts",
	"py",
	"rb",
	"rs",
	"kt",
	"sh",
	"cs",
	"md",
	"html",
	"css",
	"javascript",
	"typescript",
	"python",
	"ruby",
	"rust",
	"kotlin",
	"swift",
	"java",
	"scala",
	"bash",
	"zsh",
	"fish",
	"sql",
	"yaml",
	"yml",
	"json",
	"xml",
	"toml",
	"ini",
	"markdown",
	"dockerfile",
	"graphql",
	"svelte",
	"vue",
	"jsx",
	"tsx",
	"scss",
	"less",
	"sass",
	"php",
	"perl",
	"lua",
	"haskell",
	"erlang",
	"elixir",
	"clojure",
	"cpp",
	"csharp",
	"objc",
	"groovy",
	"powershell",
	"batch",
	"nginx",
	"terraform",
	"hcl",
	"proto",
	"protobuf",
	"txt",
	"text",
	"plaintext",
]);

const CODE_LANG_EXT: Record<string, string> = {
	javascript: "js",
	typescript: "ts",
	python: "py",
	ruby: "rb",
	rust: "rs",
	kotlin: "kt",
	swift: "swift",
	csharp: "cs",
	cpp: "cpp",
	bash: "sh",
	zsh: "sh",
	fish: "sh",
	sh: "sh",
	powershell: "ps1",
	sql: "sql",
	html: "html",
	css: "css",
	scss: "scss",
	less: "less",
	sass: "scss",
	json: "json",
	yaml: "yaml",
	yml: "yml",
	xml: "xml",
	toml: "toml",
	markdown: "md",
	go: "go",
	java: "java",
	php: "php",
	lua: "lua",
	perl: "pl",
	haskell: "hs",
	elixir: "ex",
	erlang: "erl",
	clojure: "clj",
	scala: "scala",
	groovy: "groovy",
	r: "r",
	c: "c",
	js: "js",
	ts: "ts",
	py: "py",
	rb: "rb",
	rs: "rs",
	kt: "kt",
	cs: "cs",
	md: "md",
	pixel: "pixel",
};

export const CODE_LANG_LABELS: Record<string, string> = {
	javascript: "JavaScript",
	typescript: "TypeScript",
	python: "Python",
	ruby: "Ruby",
	rust: "Rust",
	kotlin: "Kotlin",
	swift: "Swift",
	csharp: "C#",
	cpp: "C++",
	bash: "Bash",
	zsh: "Zsh",
	fish: "Fish",
	powershell: "PowerShell",
	sql: "SQL",
	html: "HTML",
	css: "CSS",
	scss: "SCSS",
	less: "Less",
	sass: "Sass",
	json: "JSON",
	yaml: "YAML",
	yml: "YAML",
	xml: "XML",
	toml: "TOML",
	markdown: "Markdown",
	dockerfile: "Dockerfile",
	graphql: "GraphQL",
	go: "Go",
	java: "Java",
	php: "PHP",
	lua: "Lua",
	perl: "Perl",
	haskell: "Haskell",
	elixir: "Elixir",
	erlang: "Erlang",
	clojure: "Clojure",
	scala: "Scala",
	groovy: "Groovy",
	svelte: "Svelte",
	vue: "Vue",
	jsx: "JSX",
	tsx: "TSX",
	nginx: "Nginx",
	terraform: "Terraform",
	hcl: "HCL",
	protobuf: "Protobuf",
	proto: "Protobuf",
	plaintext: "Plain Text",
	text: "Text",
	txt: "Text",
	js: "JavaScript",
	ts: "TypeScript",
	py: "Python",
	rb: "Ruby",
	rs: "Rust",
	kt: "Kotlin",
	cs: "C#",
	sh: "Shell",
	md: "Markdown",
	r: "R",
	c: "C",
	pixel: "Pixel",
};

export const createHtmlResponseFilePath = (): string => {
	return `save-html-response-${Date.now()}.html`;
};

export const createCodeFilePath = (lang: string): string => {
	const ext = CODE_LANG_EXT[lang] ?? lang;
	return `save-code-response-${Date.now()}.${ext}`;
};

/**
 * Build a runnable pixel expression for a code block, or null when the
 * language is not something we can execute server-side. Python runs through
 * the Py reactor, R through the R reactor, and pixel is sent as-is.
 */
export const buildExecutePixel = (
	lang: string | undefined,
	code: string,
): string | null => {
	if (!code.trim()) return null;
	switch ((lang ?? "").toLowerCase()) {
		case "py":
		case "python":
			return `Py("<encode>${code}</encode>");`;
		case "r":
			return `R("<encode>${code}</encode>");`;
		case "pixel":
			return code;
		default:
			return null;
	}
};

/**
 * Memory/perf safety cap on the cumulative console (stdout/stderr) stream while
 * a job is polled — a runaway or very chatty job would otherwise grow the
 * buffer (and the per-poll re-render payload) without bound. This is not a
 * display limit: the rendered output region is height-capped + scrollable in
 * the component, so normal large responses stay fully visible.
 */
export const MAX_EXECUTE_LOG_CHARS = 100_000;

/**
 * Mirror of the terminal REPL's output unwrap (terminal-console.tsx), which in
 * turn mirrors cell.state.ts in libs/renderer. Each operationType stores its
 * payload in a slightly different shape; pick the right slot so the value we
 * render is the user-facing result rather than the envelope.
 */
export const unwrapPixelOutput = (last: {
	operationType?: string[];
	output?: unknown;
}): unknown => {
	if (!last) return undefined;
	const op = last.operationType ?? [];
	// biome-ignore lint/suspicious/noExplicitAny: pixel envelope shapes
	const out: any = last.output;
	if (op.indexOf("CUSTOM_DATA_STRUCTURE") > -1) return out;
	if (op.indexOf("FORMATTED_DATA_SET") > -1) return out?.[0];
	if (op.indexOf("CODE_EXECUTION") > -1) return out?.[0]?.output;
	if (op.indexOf("CODE") > -1) return out?.[0]?.value?.[0];
	if (op.indexOf("ERROR") > -1) return out?.[0];
	if (op.indexOf("CONST_STRING") > -1) return out?.[0];
	if (op.indexOf("INVALID_SYNTAX") > -1) return out?.[0];
	if (op.indexOf("VECTOR") > -1) return out?.[0];
	return out;
};

/**
 * Mirror of the terminal REPL's formatOutputForDisplay. Coerces an unwrapped
 * pixel value into the display string. Raw-vs-formatted toggling and JSON tree
 * rendering are handled downstream by CellOutputBlock, so this only needs the
 * "formatted" representation.
 */
export const formatExecuteOutput = (value: unknown, opType: string): string => {
	if (value === undefined || value === null) return "";
	if (typeof value === "string") {
		if (opType === "ERROR") return `Error: ${value}`;
		if (opType === "INVALID_SYNTAX") return `Invalid Syntax: ${value}`;
		return value;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	// arrays + plain objects render as pretty JSON (CellOutputBlock parses it
	// back into an interactive tree).
	return JSON.stringify(value, null, 2);
};
