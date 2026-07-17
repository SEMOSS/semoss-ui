import type {
	JupyterCell,
	JupyterCellOutput,
	JupyterCodeCell,
	JupyterErrorOutput,
	JupyterNotebook,
	NotebookExecutionData,
	NotebookExecutionResultInput,
	NotebookMetadataData,
} from "./types";

const DEFAULT_NBFORMAT = 4;
const DEFAULT_NBFORMAT_MINOR = 5;

const createCellId = (): string => {
	return `cell-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const ensureCellMetadataId = (
	metadata: Record<string, unknown> | undefined,
): Record<string, unknown> => {
	const nextMetadata = { ...(metadata ?? {}) };
	if (typeof nextMetadata.id !== "string" || nextMetadata.id.length === 0) {
		nextMetadata.id = createCellId();
	}

	return nextMetadata;
};

const ensureNotebookCellMetadataIds = (cells: JupyterCell[]): JupyterCell[] => {
	return cells.map((cell) => {
		return {
			...cell,
			metadata: ensureCellMetadataId(cell.metadata),
		};
	});
};

const normalizeSourceToArray = (source: string): string[] => {
	if (!source) return [];
	const lines = source.split("\n");
	return lines.map((line, idx) => {
		return idx === lines.length - 1 ? line : `${line}\n`;
	});
};

export const normalizeSource = (source: string | string[]): string => {
	if (Array.isArray(source)) {
		return source.join("");
	}
	return source ?? "";
};

const stripHtml = (value: string): string => {
	return value.replace(/<[^>]*>/g, "").trim();
};

const isPlotlySpec = (value: unknown): value is Record<string, unknown> => {
	return (
		typeof value === "object" &&
		value !== null &&
		Array.isArray((value as { data?: unknown }).data) &&
		typeof (value as { layout?: unknown }).layout === "object"
	);
};

const isAltairSpec = (value: unknown): value is Record<string, unknown> => {
	if (typeof value !== "object" || value === null) return false;
	const schema = (value as { $schema?: unknown }).$schema;
	if (
		typeof schema === "string" &&
		schema.toLowerCase().includes("vega-lite")
	) {
		return true;
	}

	return "mark" in value && "encoding" in value;
};

const toErrorOutput = (output: unknown): JupyterErrorOutput => {
	if (typeof output === "object" && output !== null) {
		const maybeError = output as {
			ename?: unknown;
			evalue?: unknown;
			traceback?: unknown;
			message?: unknown;
			name?: unknown;
		};

		const ename =
			typeof maybeError.ename === "string"
				? maybeError.ename
				: typeof maybeError.name === "string"
					? maybeError.name
					: "Error";

		const evalue =
			typeof maybeError.evalue === "string"
				? maybeError.evalue
				: typeof maybeError.message === "string"
					? maybeError.message
					: JSON.stringify(output);

		const traceback = Array.isArray(maybeError.traceback)
			? maybeError.traceback.map((entry) => String(entry))
			: [evalue];

		return {
			output_type: "error",
			ename,
			evalue,
			traceback,
		};
	}

	if (output instanceof Error) {
		return {
			output_type: "error",
			ename: output.name || "Error",
			evalue: output.message || "",
			traceback: [output.stack || output.message || ""],
		};
	}

	const message = typeof output === "string" ? output : String(output);
	return {
		output_type: "error",
		ename: "Error",
		evalue: message,
		traceback: [message],
	};
};

const toMimeBundleFromOutput = (output: unknown): Record<string, unknown> => {
	if (typeof output === "string") {
		const trimmed = output.trim();

		if (trimmed.startsWith("<svg") && trimmed.includes("</svg>")) {
			return {
				"image/svg+xml": output,
				"text/plain": stripHtml(output) || output,
			};
		}

		if (
			trimmed.startsWith("<table") ||
			trimmed.startsWith("<div") ||
			trimmed.startsWith("<html")
		) {
			return {
				"text/html": output,
				"text/plain": stripHtml(output) || output,
			};
		}

		if (trimmed.startsWith("data:image/png;base64,")) {
			return {
				"image/png": trimmed.slice("data:image/png;base64,".length),
				"text/plain": output,
			};
		}

		if (trimmed.startsWith("data:image/jpeg;base64,")) {
			return {
				"image/jpeg": trimmed.slice("data:image/jpeg;base64,".length),
				"text/plain": output,
			};
		}

		const normalized = trimmed.replace(/\s+/g, "");
		if (/^iVBOR[0-9A-Za-z+/=]+$/.test(normalized)) {
			return {
				"image/png": normalized,
				"text/plain": output,
			};
		}

		if (/^\/9j\/[0-9A-Za-z+/=]+$/.test(normalized)) {
			return {
				"image/jpeg": normalized,
				"text/plain": output,
			};
		}

		try {
			const parsed = JSON.parse(trimmed);
			if (isPlotlySpec(parsed)) {
				return {
					"application/vnd.plotly.v1+json": parsed,
					"text/plain": output,
				};
			}

			if (isAltairSpec(parsed)) {
				return {
					"application/vnd.vegalite.v5+json": parsed,
					"text/plain": output,
				};
			}

			if (typeof parsed === "object" && parsed !== null) {
				return {
					"application/json": parsed,
					"text/plain": output,
				};
			}
		} catch {
			// keep plain text fallback
		}

		return {
			"text/plain": output,
		};
	}

	if (typeof output === "object" && output !== null) {
		const maybeBundle = output as {
			data?: unknown;
		};

		if (typeof maybeBundle.data === "object" && maybeBundle.data !== null) {
			return maybeBundle.data as Record<string, unknown>;
		}

		if (isPlotlySpec(output)) {
			return {
				"application/vnd.plotly.v1+json": output,
				"text/plain": JSON.stringify(output),
			};
		}

		if (isAltairSpec(output)) {
			return {
				"application/vnd.vegalite.v5+json": output,
				"text/plain": JSON.stringify(output),
			};
		}

		return {
			"application/json": output,
			"text/plain": JSON.stringify(output, null, 2),
		};
	}

	return {
		"text/plain": String(output),
	};
};

export const runtimeOutputToJupyterOutputs = (
	output: unknown,
	options?: { isError?: boolean },
): JupyterCellOutput[] => {
	if (output === undefined || output === null) {
		return [];
	}

	if (Array.isArray(output)) {
		const asOutputs = output as Array<{ output_type?: unknown }>;
		if (asOutputs.every((item) => typeof item?.output_type === "string")) {
			return output as JupyterCellOutput[];
		}
	}

	if (options?.isError) {
		return [toErrorOutput(output)];
	}

	const data = toMimeBundleFromOutput(output);
	return [
		{
			output_type: "display_data",
			data,
			metadata: {},
		},
	];
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

	outputs.push(
		...runtimeOutputToJupyterOutputs(result.rawOutput ?? result.output, {
			isError: result.isError,
		}),
	);

	return {
		outputs,
	};
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
	};
};

const createNotebookCell = (
	code: string,
	lang: string,
	executionData?: NotebookExecutionData,
	existingMetadata?: Record<string, unknown>,
): JupyterCell => {
	const config = getNotebookCellConfig(lang);
	const metadata = ensureCellMetadataId({
		...(existingMetadata ?? {}),
		language: config.language,
	});

	if (config.cellType === "markdown") {
		return {
			cell_type: "markdown",
			metadata,
			source: normalizeSourceToArray(code),
		};
	}

	return {
		cell_type: "code",
		execution_count:
			typeof executionData?.executionCount === "number" ||
			executionData?.executionCount === null
				? executionData.executionCount
				: null,
		metadata,
		outputs: executionData?.outputs ?? [],
		source: normalizeSourceToArray(code),
	};
};

const applyNotebookLanguageMetadata = (
	ipynb: {
		metadata?: Record<string, unknown>;
	},
	lang: string,
	metadataData?: NotebookMetadataData,
	options?: { preserveExisting?: boolean },
): void => {
	const config = getNotebookCellConfig(lang);
	const currentMetadata = ipynb.metadata ?? {};
	const hasKernelSpec =
		typeof currentMetadata.kernelspec === "object" &&
		currentMetadata.kernelspec !== null;
	const hasLanguageInfo =
		typeof currentMetadata.language_info === "object" &&
		currentMetadata.language_info !== null;

	ipynb.metadata = {
		...currentMetadata,
		kernelspec:
			options?.preserveExisting && hasKernelSpec
				? (currentMetadata.kernelspec as Record<string, unknown>)
				: {
						display_name: config.kernelDisplayName,
						language: config.kernelLanguage,
						name: config.kernelName,
					},
		language_info:
			options?.preserveExisting && hasLanguageInfo
				? {
						...(currentMetadata.language_info as Record<
							string,
							unknown
						>),
						...(metadataData?.languageVersion
							? { version: metadataData.languageVersion }
							: {}),
					}
				: {
						name: config.languageInfoName,
						mimetype: config.languageInfoMimetype,
						file_extension: config.languageInfoFileExtension,
						...(metadataData?.languageVersion
							? { version: metadataData.languageVersion }
							: {}),
					},
	};
};

const ensureNotebookVersion = (ipynb: {
	nbformat?: number;
	nbformat_minor?: number;
}) => {
	ipynb.nbformat = DEFAULT_NBFORMAT;
	if (typeof ipynb.nbformat_minor !== "number") {
		ipynb.nbformat_minor = DEFAULT_NBFORMAT_MINOR;
	}
};

const getNextExecutionCount = (ipynb: {
	cells?: Array<{ cell_type?: string; execution_count?: unknown }>;
}): number => {
	if (!Array.isArray(ipynb.cells)) return 1;
	let maxCount = 0;
	for (const cell of ipynb.cells) {
		if (
			cell?.cell_type === "code" &&
			typeof cell.execution_count === "number" &&
			Number.isFinite(cell.execution_count)
		) {
			maxCount = Math.max(maxCount, cell.execution_count);
		}
	}
	return maxCount + 1;
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

export const createNotebookFileContent = (
	code: string,
	lang: string,
	executionData?: NotebookExecutionData,
	metadataData?: NotebookMetadataData,
): string => {
	const content: JupyterNotebook = {
		nbformat: DEFAULT_NBFORMAT,
		nbformat_minor: DEFAULT_NBFORMAT_MINOR,
		metadata: {},
		cells: [createNotebookCell(code, lang, executionData)],
	};

	applyNotebookLanguageMetadata(content, lang, metadataData);
	content.cells = ensureNotebookCellMetadataIds(content.cells);

	return JSON.stringify(content, null, 2);
};

export const appendCellToNotebook = (
	existingIpynbJson: string,
	code: string,
	lang: string,
	executionData?: NotebookExecutionData,
	metadataData?: NotebookMetadataData,
): string | null => {
	try {
		const ipynb = JSON.parse(existingIpynbJson) as {
			nbformat?: number;
			nbformat_minor?: number;
			metadata?: Record<string, unknown>;
			cells?: JupyterCell[];
			[key: string]: unknown;
		};

		ensureNotebookVersion(ipynb);
		applyNotebookLanguageMetadata(ipynb, lang, metadataData, {
			preserveExisting: true,
		});
		if (!Array.isArray(ipynb.cells)) {
			ipynb.cells = [];
		}

		ipynb.cells = ensureNotebookCellMetadataIds(ipynb.cells);

		const resolvedExecutionCount =
			typeof executionData?.executionCount === "number" ||
			executionData?.executionCount === null
				? executionData.executionCount
				: executionData
					? getNextExecutionCount(ipynb)
					: null;

		ipynb.cells.push(
			createNotebookCell(code, lang, {
				executionCount: resolvedExecutionCount,
				outputs: executionData?.outputs,
			}),
		);

		return JSON.stringify(ipynb, null, 2);
	} catch {
		return null;
	}
};

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
			nbformat?: number;
			nbformat_minor?: number;
			metadata?: Record<string, unknown>;
			cells?: JupyterCell[];
			[key: string]: unknown;
		};

		if (!Array.isArray(ipynb.cells)) {
			return null;
		}

		ensureNotebookVersion(ipynb);
		applyNotebookLanguageMetadata(ipynb, lang, metadataData, {
			preserveExisting: true,
		});
		ipynb.cells = ensureNotebookCellMetadataIds(ipynb.cells);

		const index = rowNumber - 1;
		if (index < 0 || index >= ipynb.cells.length) {
			return null;
		}

		const existingCell = ipynb.cells[index];
		const existingExecutionCount =
			existingCell &&
			existingCell.cell_type === "code" &&
			typeof existingCell.execution_count === "number"
				? existingCell.execution_count
				: null;

		ipynb.cells[index] = createNotebookCell(
			code,
			lang,
			{
				executionCount:
					typeof executionData?.executionCount === "number" ||
					executionData?.executionCount === null
						? executionData.executionCount
						: existingExecutionCount,
				outputs: executionData?.outputs,
			},
			existingCell?.metadata,
		);

		return JSON.stringify(ipynb, null, 2);
	} catch {
		return null;
	}
};

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

export const unwrapPixelOutput = (last: {
	operationType?: string[];
	output?: unknown;
}): unknown => {
	if (!last) return undefined;
	const op = last.operationType ?? [];
	const out = last.output as
		| Record<string, unknown>
		| Array<Record<string, unknown>>
		| unknown;

	if (op.indexOf("CUSTOM_DATA_STRUCTURE") > -1) return out;
	if (op.indexOf("FORMATTED_DATA_SET") > -1)
		return (out as Array<unknown>)?.[0];
	if (op.indexOf("CODE_EXECUTION") > -1)
		return (out as Array<{ output?: unknown }>)?.[0]?.output;
	if (op.indexOf("CODE") > -1)
		return (out as Array<{ value?: unknown[] }>)?.[0]?.value?.[0];
	if (op.indexOf("ERROR") > -1) return (out as Array<unknown>)?.[0];
	if (op.indexOf("CONST_STRING") > -1) return (out as Array<unknown>)?.[0];
	if (op.indexOf("INVALID_SYNTAX") > -1) return (out as Array<unknown>)?.[0];
	if (op.indexOf("VECTOR") > -1) return (out as Array<unknown>)?.[0];
	return out;
};

export const parseNotebookJson = (
	raw: string,
): { notebook: JupyterNotebook | null; error: string | null } => {
	try {
		const parsed = JSON.parse(raw) as JupyterNotebook;
		if (!parsed || parsed.nbformat !== 4 || !Array.isArray(parsed.cells)) {
			return {
				notebook: null,
				error: "Invalid .ipynb content",
			};
		}

		return {
			notebook: {
				...parsed,
				cells: ensureNotebookCellMetadataIds(parsed.cells),
			},
			error: null,
		};
	} catch (error) {
		return {
			notebook: null,
			error:
				error instanceof Error
					? error.message
					: "Unable to parse .ipynb",
		};
	}
};

export const updateNotebookCellExecution = (
	notebook: JupyterNotebook,
	cellIndex: number,
	outputs: JupyterCellOutput[],
	executionCount?: number | null,
): JupyterNotebook => {
	const cells = notebook.cells.slice();
	const cell = cells[cellIndex];

	if (!cell || cell.cell_type !== "code") {
		return notebook;
	}

	const currentCount =
		typeof cell.execution_count === "number" ? cell.execution_count : 0;

	const nextCell: JupyterCodeCell = {
		...cell,
		outputs,
		execution_count:
			executionCount === null
				? null
				: typeof executionCount === "number"
					? executionCount
					: currentCount + 1,
	};

	cells[cellIndex] = nextCell;

	return {
		...notebook,
		cells,
	};
};
