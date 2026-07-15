import {
	type JupyterCellOutput,
	runtimeOutputToJupyterOutputs,
} from "@semoss/shared/notebook";

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

export const createNotebookFilePath = (requestedName?: string): string => {
	if (!requestedName || !requestedName.trim()) {
		return `save-notebook-response-${Date.now()}.ipynb`;
	}

	const sanitizedBase = requestedName
		.trim()
		.replace(/[\\/:*?"<>|]/g, "-")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	const normalizedBase =
		sanitizedBase || `save-notebook-response-${Date.now()}`;

	if (normalizedBase.toLowerCase().endsWith(".ipynb")) {
		return normalizedBase;
	}

	return `${normalizedBase}.ipynb`;
};

const DEFAULT_NBFORMAT = 4;
const DEFAULT_NBFORMAT_MINOR = 4;

export type NotebookExecutionData = {
	executionCount?: number | null;
	outputs?: JupyterCellOutput[];
};

export type NotebookMetadataData = {
	languageVersion?: string;
};

export type NotebookExecutionResultInput = {
	output: string;
	logs: string[];
	isError: boolean;
	pending: boolean;
	rawOutput?: unknown;
};

type NotebookCellConfig = {
	cellType: "code" | "markdown";
	language: string;
	kernelDisplayName: string;
	kernelLanguage: string;
	kernelName: string;
	languageInfoName: string;
	languageInfoMimetype: string;
	languageInfoFileExtension: string;
	languageInfoPygmentsLexer?: string;
	languageInfoNbconvertExporter?: string;
};

const getNotebookCellConfig = (lang: string): NotebookCellConfig => {
	const normalized = (lang || "").toLowerCase();

	if (normalized === "md" || normalized === "markdown") {
		return {
			cellType: "markdown",
			language: "markdown",
			kernelDisplayName: "Python 3",
			kernelLanguage: "python",
			kernelName: "python3",
			languageInfoName: "markdown",
			languageInfoMimetype: "text/markdown",
			languageInfoFileExtension: ".md",
		};
	}

	if (normalized === "r") {
		return {
			cellType: "code",
			language: "r",
			kernelDisplayName: "R",
			kernelLanguage: "R",
			kernelName: "ir",
			languageInfoName: "r",
			languageInfoMimetype: "text/x-rsrc",
			languageInfoFileExtension: ".r",
			languageInfoPygmentsLexer: "r",
			languageInfoNbconvertExporter: "script",
		};
	}

	if (normalized === "sql") {
		return {
			cellType: "code",
			language: "sql",
			kernelDisplayName: "Python 3",
			kernelLanguage: "python",
			kernelName: "python3",
			languageInfoName: "sql",
			languageInfoMimetype: "text/x-sql",
			languageInfoFileExtension: ".sql",
			languageInfoPygmentsLexer: "sql",
			languageInfoNbconvertExporter: "script",
		};
	}

	return {
		cellType: "code",
		language: "python",
		kernelDisplayName: "Python 3",
		kernelLanguage: "python",
		kernelName: "python3",
		languageInfoName: "python",
		languageInfoMimetype: "text/x-python",
		languageInfoFileExtension: ".py",
		languageInfoPygmentsLexer: "ipython3",
		languageInfoNbconvertExporter: "python",
	};
};

const createNotebookCell = (
	code: string,
	lang: string,
	options?: NotebookExecutionData,
) => {
	const config = getNotebookCellConfig(lang);

	if (config.cellType === "markdown") {
		return {
			cell_type: "markdown",
			metadata: {
				language: config.language,
			},
			source: normalizeSourceToArray(code),
		};
	}

	return {
		cell_type: "code",
		execution_count: options?.executionCount ?? null,
		metadata: {
			language: config.language,
		},
		outputs: options?.outputs ?? [],
		source: normalizeSourceToArray(code),
	};
};

const getNextExecutionCount = (ipynb: {
	cells?: Array<{ [key: string]: unknown }>;
}): number => {
	if (!Array.isArray(ipynb.cells)) return 1;

	let maxCount = 0;
	for (const cell of ipynb.cells) {
		if (!cell || typeof cell !== "object") continue;
		if (cell.cell_type !== "code") continue;
		const value = cell.execution_count;
		if (typeof value === "number" && Number.isFinite(value)) {
			maxCount = Math.max(maxCount, value);
		}
	}

	return maxCount + 1;
};

const ensureNotebookVersion = (ipynb: { [key: string]: unknown }) => {
	if (typeof ipynb.nbformat !== "number") {
		ipynb.nbformat = DEFAULT_NBFORMAT;
	}
	if (typeof ipynb.nbformat_minor !== "number") {
		ipynb.nbformat_minor = DEFAULT_NBFORMAT_MINOR;
	}
};

const applyNotebookLanguageMetadata = (
	ipynb: { [key: string]: unknown },
	lang: string,
	preserveExisting: boolean,
	metadataData?: NotebookMetadataData,
) => {
	const config = getNotebookCellConfig(lang);
	const existingMetadata =
		typeof ipynb.metadata === "object" && ipynb.metadata !== null
			? (ipynb.metadata as { [key: string]: unknown })
			: {};
	const existingKernelSpec =
		typeof existingMetadata.kernelspec === "object" &&
		existingMetadata.kernelspec !== null
			? (existingMetadata.kernelspec as { [key: string]: unknown })
			: {};
	const existingLanguageInfo =
		typeof existingMetadata.language_info === "object" &&
		existingMetadata.language_info !== null
			? (existingMetadata.language_info as { [key: string]: unknown })
			: {};

	const kernelspec = preserveExisting
		? {
				display_name:
					typeof existingKernelSpec.display_name === "string"
						? existingKernelSpec.display_name
						: config.kernelDisplayName,
				language:
					typeof existingKernelSpec.language === "string"
						? existingKernelSpec.language
						: config.kernelLanguage,
				name:
					typeof existingKernelSpec.name === "string"
						? existingKernelSpec.name
						: config.kernelName,
			}
		: {
				display_name: config.kernelDisplayName,
				language: config.kernelLanguage,
				name: config.kernelName,
			};

	const languageInfo = preserveExisting
		? {
				name:
					typeof existingLanguageInfo.name === "string"
						? existingLanguageInfo.name
						: config.languageInfoName,
				mimetype:
					typeof existingLanguageInfo.mimetype === "string"
						? existingLanguageInfo.mimetype
						: config.languageInfoMimetype,
				file_extension:
					typeof existingLanguageInfo.file_extension === "string"
						? existingLanguageInfo.file_extension
						: config.languageInfoFileExtension,
				...(metadataData?.languageVersion
					? { version: metadataData.languageVersion }
					: typeof existingLanguageInfo.version === "string"
						? { version: existingLanguageInfo.version }
						: {}),
				...(typeof existingLanguageInfo.pygments_lexer === "string"
					? { pygments_lexer: existingLanguageInfo.pygments_lexer }
					: config.languageInfoPygmentsLexer
						? { pygments_lexer: config.languageInfoPygmentsLexer }
						: {}),
				...(typeof existingLanguageInfo.nbconvert_exporter === "string"
					? {
							nbconvert_exporter:
								existingLanguageInfo.nbconvert_exporter,
						}
					: config.languageInfoNbconvertExporter
						? {
								nbconvert_exporter:
									config.languageInfoNbconvertExporter,
							}
						: {}),
			}
		: {
				name: config.languageInfoName,
				mimetype: config.languageInfoMimetype,
				file_extension: config.languageInfoFileExtension,
				...(metadataData?.languageVersion
					? { version: metadataData.languageVersion }
					: {}),
				...(config.languageInfoPygmentsLexer
					? { pygments_lexer: config.languageInfoPygmentsLexer }
					: {}),
				...(config.languageInfoNbconvertExporter
					? {
							nbconvert_exporter:
								config.languageInfoNbconvertExporter,
						}
					: {}),
			};

	ipynb.metadata = {
		...existingMetadata,
		kernelspec,
		language_info: languageInfo,
	};
};

export const toNotebookExecutionData = (
	result: NotebookExecutionResultInput | null,
): NotebookExecutionData | undefined => {
	if (!result || result.pending) return undefined;

	const outputs: JupyterCellOutput[] = [];

	if (result.logs.length > 0) {
		outputs.push({
			output_type: "stream",
			name: "stdout",
			text: normalizeSourceToArray(result.logs.join("\n")),
		});
	}

	const runtimeOutputs = runtimeOutputToJupyterOutputs(
		result.rawOutput ?? result.output,
		{
			isError: result.isError,
		},
	);

	outputs.push(...runtimeOutputs);

	return {
		outputs,
	};
};

// Normalize source to Jupyter array format
const normalizeSourceToArray = (source: string): string[] => {
	if (!source) return [];
	const lines = source.split("\n");
	return lines.map((line, idx) => {
		return idx === lines.length - 1 ? line : `${line}\n`;
	});
};

export const createNotebookFileContent = (
	code: string,
	lang: string,
	executionData?: NotebookExecutionData,
	metadataData?: NotebookMetadataData,
): string => {
	const content: { [key: string]: unknown } = {
		nbformat: DEFAULT_NBFORMAT,
		nbformat_minor: DEFAULT_NBFORMAT_MINOR,
		cells: [
			createNotebookCell(code, lang, {
				executionCount:
					typeof executionData?.executionCount === "number" ||
					executionData?.executionCount === null
						? executionData.executionCount
						: executionData
							? 1
							: null,
				outputs: executionData?.outputs,
			}),
		],
	};

	applyNotebookLanguageMetadata(content, lang, false, metadataData);

	return JSON.stringify(content, null, 2);
};

/**
 * Append a new code cell to an existing .ipynb notebook JSON string.
 * Returns the updated JSON string, or null if the existing content
 * cannot be parsed as a valid notebook.
 */
export const appendCellToNotebook = (
	existingIpynbJson: string,
	code: string,
	lang: string,
	executionData?: NotebookExecutionData,
	metadataData?: NotebookMetadataData,
): string | null => {
	try {
		const ipynb = JSON.parse(existingIpynbJson) as {
			cells?: Array<{ [key: string]: unknown }>;
			[key: string]: unknown;
		};

		ensureNotebookVersion(ipynb);
		applyNotebookLanguageMetadata(ipynb, lang, true, metadataData);
		if (!Array.isArray(ipynb.cells)) {
			ipynb.cells = [];
		}

		const resolvedExecutionCount =
			typeof executionData?.executionCount === "number" ||
			executionData?.executionCount === null
				? executionData.executionCount
				: executionData
					? getNextExecutionCount(ipynb)
					: null;

		const newCell = createNotebookCell(code, lang, {
			executionCount: resolvedExecutionCount,
			outputs: executionData?.outputs,
		});

		ipynb.cells.push(newCell);
		return JSON.stringify(ipynb, null, 2);
	} catch {
		return null;
	}
};

/**
 * Replace a specific cell in .ipynb format by row number.
 * The rowNumber maps directly to the cell index (1-based row → 0-based array index).
 * Returns updated JSON, or null when the target cell is not found.
 */
export const replaceNotebookCell = (
	existingIpynbJson: string,
	rowNumber: number,
	code: string,
	lang: string,
	executionData?: NotebookExecutionData,
	metadataData?: NotebookMetadataData,
): string | null => {
	try {
		const ipynb = JSON.parse(existingIpynbJson) as {
			cells?: Array<{ [key: string]: unknown }>;
			[key: string]: unknown;
		};

		ensureNotebookVersion(ipynb);
		applyNotebookLanguageMetadata(ipynb, lang, true, metadataData);

		if (!Array.isArray(ipynb.cells)) {
			return null;
		}

		// rowNumber is 1-based, convert to 0-based array index
		const cellIndex = rowNumber - 1;

		if (cellIndex < 0 || cellIndex >= ipynb.cells.length) {
			return null;
		}

		const existingCell = ipynb.cells[cellIndex];
		if (!existingCell || typeof existingCell !== "object") {
			return null;
		}

		const existingExecutionCount =
			"execution_count" in existingCell
				? (existingCell.execution_count as number | null)
				: null;

		const resolvedExecutionCount =
			typeof executionData?.executionCount === "number" ||
			executionData?.executionCount === null
				? executionData.executionCount
				: executionData
					? getNextExecutionCount(ipynb)
					: existingExecutionCount;

		ipynb.cells[cellIndex] = createNotebookCell(code, lang, {
			executionCount: resolvedExecutionCount,
			outputs: executionData?.outputs,
		});

		return JSON.stringify(ipynb, null, 2);
	} catch {
		return null;
	}
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
