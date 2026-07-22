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

const INLINE_IMAGE_BEGIN_PREFIX = "__SEMOSS_IPYNB_IMAGE_BEGIN__:";
const INLINE_IMAGE_CHUNK_PREFIX = "__SEMOSS_IPYNB_IMAGE_CHUNK__:";
const INLINE_IMAGE_END_MARKER = "__SEMOSS_IPYNB_IMAGE_END__";

export const isPythonCellLanguage = (language: string): boolean => {
	return language === "python" || language === "py";
};

export const buildNotebookExecutionSource = (
	language: string,
	source: string,
): string => {
	if (!isPythonCellLanguage(language)) {
		return source;
	}

	const preamble = `\ntry:\n    import io as __semoss_io\n    import base64 as __semoss_base64\n    import matplotlib as __semoss_matplotlib\n    __semoss_matplotlib.use("Agg", force=True)\n    import matplotlib.pyplot as __semoss_plt\n    try:\n        __semoss_plt.switch_backend("Agg")\n    except Exception:\n        pass\n    __semoss_plt.ioff()\n\n    __semoss_inline_chunk_size = 1000\n    __semoss_initial_fig_nums = set(__semoss_plt.get_fignums())\n    __semoss_capture_state = {"did_show": False}\n\n    def __semoss_emit_figures():\n        __semoss_all_fig_nums = list(__semoss_plt.get_fignums())\n        __semoss_fig_nums = [__n for __n in __semoss_all_fig_nums if __n not in __semoss_initial_fig_nums]\n        if not __semoss_fig_nums:\n            __semoss_fig_nums = __semoss_all_fig_nums\n\n        for __semoss_fig_num in __semoss_fig_nums:\n            __semoss_fig = __semoss_plt.figure(__semoss_fig_num)\n            __semoss_buf = __semoss_io.BytesIO()\n            __semoss_fig.savefig(__semoss_buf, format="png", bbox_inches="tight")\n            __semoss_buf.seek(0)\n            __semoss_png = __semoss_base64.b64encode(__semoss_buf.getvalue()).decode("ascii")\n            print("${INLINE_IMAGE_BEGIN_PREFIX}image/png")\n            for __semoss_idx in range(0, len(__semoss_png), __semoss_inline_chunk_size):\n                print("${INLINE_IMAGE_CHUNK_PREFIX}" + __semoss_png[__semoss_idx:__semoss_idx + __semoss_inline_chunk_size])\n            print("${INLINE_IMAGE_END_MARKER}")\n            __semoss_buf.close()\n            __semoss_plt.close(__semoss_fig)\n\n    def __semoss_show_wrapper(*args, **kwargs):\n        __semoss_capture_state["did_show"] = True\n        __semoss_emit_figures()\n        return None\n\n    __semoss_plt.show = __semoss_show_wrapper\nexcept Exception:\n    pass\n`;

	const suffix = `\n\ntry:\n    if not __semoss_capture_state.get("did_show", False):\n        __semoss_emit_figures()\nexcept Exception:\n    pass\n`;
	return `${preamble}\n${source}${suffix}`;
};

export const extractNotebookInlineImageOutputsFromLogs = (logs: string[]) => {
	const cleanedLogLines: string[] = [];
	const imageOutputs: JupyterCellOutput[] = [];
	let collectingImage = false;
	let currentMimeType = "image/png";
	let currentBase64Chunks: string[] = [];

	const flushImage = () => {
		if (!collectingImage) {
			return;
		}

		const base64Data = currentBase64Chunks.join("").replace(/\s+/g, "");
		if (base64Data) {
			imageOutputs.push({
				output_type: "display_data",
				data: {
					[currentMimeType]: base64Data,
					"text/plain": `data:${currentMimeType};base64,${base64Data}`,
				},
				metadata: {},
			});
		}

		collectingImage = false;
		currentMimeType = "image/png";
		currentBase64Chunks = [];
	};

	for (const chunk of logs) {
		for (const line of chunk.split(/\r?\n/)) {
			if (line.startsWith(INLINE_IMAGE_BEGIN_PREFIX)) {
				flushImage();
				collectingImage = true;
				currentMimeType =
					line.slice(INLINE_IMAGE_BEGIN_PREFIX.length).trim() ||
					"image/png";
				currentBase64Chunks = [];
				continue;
			}

			if (line.startsWith(INLINE_IMAGE_CHUNK_PREFIX)) {
				if (collectingImage) {
					currentBase64Chunks.push(
						line.slice(INLINE_IMAGE_CHUNK_PREFIX.length).trim(),
					);
				}
				continue;
			}

			if (line.trim() === INLINE_IMAGE_END_MARKER) {
				flushImage();
				continue;
			}

			cleanedLogLines.push(line);
		}
	}

	flushImage();

	const hasCapturedImages = imageOutputs.length > 0;
	const filteredLogLines = hasCapturedImages
		? cleanedLogLines.filter((line) => {
				const trimmed = line.trim();
				if (/^Figure\(\d+x\d+\)\s*$/.test(trimmed)) {
					return false;
				}

				if (
					trimmed.includes(
						"UserWarning: Starting a Matplotlib GUI outside of the main thread will likely fail.",
					)
				) {
					return false;
				}

				return true;
			})
		: cleanedLogLines;

	return {
		cleanedLogs: filteredLogLines,
		imageOutputs,
	};
};

const stripHtml = (value: string): string => {
	return value.replace(/<[^>]*>/g, "").trim();
};

const escapeHtmlAttribute = (value: string): string => {
	return value
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
};

const isLikelyUrlOrPath = (value: string): boolean => {
	return /^(https?:\/\/|\/|\.\.?\/)/i.test(value);
};

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i;

const isLikelyImageSource = (value: string): boolean => {
	return (
		value.startsWith("data:image/") ||
		IMAGE_EXT_RE.test(value) ||
		(value.startsWith("http") && value.toLowerCase().includes("image"))
	);
};

const getRecordString = (
	record: Record<string, unknown>,
	keys: string[],
): string | null => {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.trim().length > 0) {
			return value;
		}
	}

	return null;
};

const toImageMimeBundle = (
	source: string,
	mimeType?: string,
): Record<string, unknown> => {
	if (source.startsWith("data:image/")) {
		const match = source.match(
			/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
		);
		if (match) {
			return {
				[match[1]]: match[2].replace(/\s+/g, ""),
				"text/plain": source,
			};
		}
	}

	if (/^iVBOR[0-9A-Za-z+/=]+$/.test(source.replace(/\s+/g, ""))) {
		return {
			"image/png": source.replace(/\s+/g, ""),
			"text/plain": source,
		};
	}

	if (/^\/9j\/[0-9A-Za-z+/=]+$/.test(source.replace(/\s+/g, ""))) {
		return {
			"image/jpeg": source.replace(/\s+/g, ""),
			"text/plain": source,
		};
	}

	if (isLikelyImageSource(source) && isLikelyUrlOrPath(source)) {
		return {
			"text/html": `<img src="${escapeHtmlAttribute(source)}" alt="Generated output" />`,
			"text/plain": source,
		};
	}

	if (mimeType && mimeType.startsWith("image/")) {
		return {
			[mimeType]: source.replace(/\s+/g, ""),
			"text/plain": source,
		};
	}

	return {
		"text/plain": source,
	};
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

const toMimeBundleFromOutput = (
	output: unknown,
	operationType?: string | string[],
): Record<string, unknown> => {
	const operationTypes = Array.isArray(operationType)
		? operationType
		: typeof operationType === "string"
			? [operationType]
			: [];
	const isFileDownload = operationTypes.includes("FILE_DOWNLOAD");

	if (typeof output === "string") {
		const trimmed = output.trim();

		const markdownImageMatch = trimmed.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
		if (markdownImageMatch && markdownImageMatch[1]) {
			return toImageMimeBundle(markdownImageMatch[1]);
		}

		if (
			trimmed.startsWith("<img") ||
			trimmed.includes("<img ") ||
			trimmed.includes("<img\n")
		) {
			return {
				"text/html": output,
				"text/plain": stripHtml(output) || output,
			};
		}

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

		if (isLikelyImageSource(trimmed) && isLikelyUrlOrPath(trimmed)) {
			return {
				"text/html": `<img src="${escapeHtmlAttribute(trimmed)}" alt="Generated output" />`,
				"text/plain": output,
			};
		}

		if (isFileDownload && isLikelyUrlOrPath(trimmed)) {
			const href = escapeHtmlAttribute(trimmed);
			return {
				"text/markdown": `[Download generated file](${trimmed})`,
				"text/html": `<a href="${href}" target="_blank" rel="noopener noreferrer">Download generated file</a>`,
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
		const asRecord = output as Record<string, unknown>;
		const maybeImageData = getRecordString(asRecord, [
			"base64",
			"base64Data",
			"imageBase64",
			"b64",
		]);
		const maybeImageSource = getRecordString(asRecord, [
			"image",
			"imageUrl",
			"url",
			"src",
			"path",
		]);
		const maybeImageMime = getRecordString(asRecord, [
			"mimeType",
			"contentType",
			"mime",
		]);

		if (maybeImageData) {
			const normalizedMime =
				typeof maybeImageMime === "string" &&
				maybeImageMime.startsWith("image/")
					? maybeImageMime
					: "image/png";
			return toImageMimeBundle(maybeImageData, normalizedMime);
		}

		if (maybeImageSource && isLikelyImageSource(maybeImageSource)) {
			return toImageMimeBundle(
				maybeImageSource,
				maybeImageMime ?? undefined,
			);
		}

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
	options?: { isError?: boolean; operationType?: string | string[] },
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

	const data = toMimeBundleFromOutput(output, options?.operationType);
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

export const getNextNotebookExecutionCount = (ipynb: {
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
					? getNextNotebookExecutionCount(ipynb)
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
