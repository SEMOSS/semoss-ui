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

const isRecordObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toSafeJsonString = (value: unknown): string => {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
};

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

const getNotebookLanguageFromMetadata = (
	metadata: Record<string, unknown> | undefined,
): string | undefined => {
	if (!metadata) return undefined;
	const languageInfo = metadata.language_info;
	if (!isRecordObject(languageInfo)) return undefined;
	const language = languageInfo.name;
	if (typeof language !== "string" || !language.trim()) return undefined;
	return language.trim().toLowerCase();
};

const getCellLanguage = (
	cellType: JupyterCell["cell_type"],
	metadata: Record<string, unknown>,
	notebookLanguage?: string,
): string => {
	if (cellType === "markdown") return "markdown";
	if (cellType === "raw") return "raw";

	const metadataLanguage = metadata.language;
	if (typeof metadataLanguage === "string" && metadataLanguage.trim()) {
		return metadataLanguage.trim().toLowerCase();
	}

	return notebookLanguage?.trim()
		? notebookLanguage.trim().toLowerCase()
		: "python";
};

const ensureCellMetadata = (
	cell: JupyterCell,
	notebookLanguage?: string,
): Record<string, unknown> => {
	const metadata = ensureCellMetadataId(cell.metadata);
	return {
		...metadata,
		language: getCellLanguage(cell.cell_type, metadata, notebookLanguage),
	};
};

const ensureNotebookCellMetadataIds = (
	cells: JupyterCell[],
	notebookLanguage?: string,
): JupyterCell[] => {
	return cells.map((cell) => {
		return {
			...cell,
			metadata: ensureCellMetadata(cell, notebookLanguage),
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

const normalizeUnknownSourceToArray = (source: unknown): string[] => {
	if (Array.isArray(source)) {
		return source.map((line) => String(line));
	}

	if (typeof source === "string") {
		return normalizeSourceToArray(source);
	}

	if (source === undefined || source === null) {
		return [];
	}

	return normalizeSourceToArray(String(source));
};

export const normalizeSource = (source: string | string[]): string => {
	if (Array.isArray(source)) {
		return source.join("");
	}
	return source ?? "";
};

const ATTACHMENT_IMAGE_RE = /(!\[[^\]]*\]\()attachment:([^)\s]+)(\))/g;

/**
 * nbformat markdown cells can embed images via `![alt](attachment:name.png)`
 * plus a `cell.attachments` map of name -> mimeType -> base64, instead of an
 * inline data URI or external link. Markdown renderers don't know about that
 * convention, so this rewrites each attachment: reference to a real data URI
 * before the source is handed to marked.
 */
export const resolveMarkdownAttachments = (
	source: string,
	attachments?: Record<string, Record<string, string>>,
): string => {
	if (!attachments) return source;

	return source.replace(
		ATTACHMENT_IMAGE_RE,
		(match, prefix: string, name: string, suffix: string) => {
			const mimeMap = attachments[name];
			if (!isRecordObject(mimeMap)) return match;

			const mimeType = Object.keys(mimeMap)[0];
			const data = mimeType ? mimeMap[mimeType] : undefined;
			if (!mimeType || typeof data !== "string") return match;

			return `${prefix}data:${mimeType};base64,${data}${suffix}`;
		},
	);
};

// A runaway print loop or a huge printed object can produce output that
// would otherwise render as a multi-megabyte <pre> block; capping it (with a
// visible notice) mirrors Jupyter's own "output exceeds size limit" guard.
export const MAX_TEXT_OUTPUT_LENGTH = 20_000;

export interface TruncatedText {
	text: string;
	truncated: boolean;
	originalLength: number;
}

export const truncateTextOutput = (text: string): TruncatedText => {
	if (text.length <= MAX_TEXT_OUTPUT_LENGTH) {
		return { text, truncated: false, originalLength: text.length };
	}

	return {
		text: text.slice(0, MAX_TEXT_OUTPUT_LENGTH),
		truncated: true,
		originalLength: text.length,
	};
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

	// Playground executes Python through Pixel; this shim captures matplotlib
	// figures and emits them through stdout markers so we can rebuild proper
	// Jupyter display_data image outputs on the client side.
	const matplotlibPreamble = `\ntry:\n    import io as __semoss_io\n    import base64 as __semoss_base64\n    import matplotlib as __semoss_matplotlib\n    __semoss_matplotlib.use("Agg", force=True)\n    import matplotlib.pyplot as __semoss_plt\n    try:\n        __semoss_plt.switch_backend("Agg")\n    except Exception:\n        pass\n    __semoss_plt.ioff()\n\n    __semoss_inline_chunk_size = 1000\n    __semoss_initial_fig_nums = set(__semoss_plt.get_fignums())\n    __semoss_capture_state = {"did_show": False}\n\n    def __semoss_emit_figures():\n        __semoss_all_fig_nums = list(__semoss_plt.get_fignums())\n        __semoss_fig_nums = [__n for __n in __semoss_all_fig_nums if __n not in __semoss_initial_fig_nums]\n        if not __semoss_fig_nums:\n            __semoss_fig_nums = __semoss_all_fig_nums\n\n        for __semoss_fig_num in __semoss_fig_nums:\n            __semoss_fig = __semoss_plt.figure(__semoss_fig_num)\n            __semoss_buf = __semoss_io.BytesIO()\n            __semoss_fig.savefig(__semoss_buf, format="png", bbox_inches="tight")\n            __semoss_buf.seek(0)\n            __semoss_png = __semoss_base64.b64encode(__semoss_buf.getvalue()).decode("ascii")\n            print("${INLINE_IMAGE_BEGIN_PREFIX}image/png")\n            for __semoss_idx in range(0, len(__semoss_png), __semoss_inline_chunk_size):\n                print("${INLINE_IMAGE_CHUNK_PREFIX}" + __semoss_png[__semoss_idx:__semoss_idx + __semoss_inline_chunk_size])\n            print("${INLINE_IMAGE_END_MARKER}")\n            __semoss_buf.close()\n            __semoss_plt.close(__semoss_fig)\n\n    def __semoss_show_wrapper(*args, **kwargs):\n        __semoss_capture_state["did_show"] = True\n        __semoss_emit_figures()\n        return None\n\n    __semoss_plt.show = __semoss_show_wrapper\nexcept Exception:\n    pass\n`;

	// Real Jupyter kernels auto-render IPython.display objects (HTML, Image,
	// Markdown, ...) via the interactive displayhook and explicit display()
	// calls. Playground's Py() reactor is a plain script runner with neither,
	// so without this shim `HTML(...)`/`Image(...)`/`display(...)` silently
	// produce nothing. This reimplements both mechanisms: a display() /
	// IPython.display.display() shim that inspects an object's _repr_*_
	// methods, and an ast-based rewrite of the cell so its trailing bare
	// expression (if any) is captured and run through the same shim - exactly
	// mirroring Jupyter's "last expression is auto-displayed" behavior.
	const displayPreamble = `
try:
    import base64 as __semoss_disp_b64
    import json as __semoss_disp_json

    __semoss_disp_chunk_size = 1000

    def __semoss_emit_mime(mime_type, payload_bytes):
        try:
            __semoss_encoded = __semoss_disp_b64.b64encode(payload_bytes).decode("ascii")
            print("${INLINE_IMAGE_BEGIN_PREFIX}" + mime_type)
            for __semoss_i in range(0, len(__semoss_encoded), __semoss_disp_chunk_size):
                print("${INLINE_IMAGE_CHUNK_PREFIX}" + __semoss_encoded[__semoss_i:__semoss_i + __semoss_disp_chunk_size])
            print("${INLINE_IMAGE_END_MARKER}")
        except Exception:
            pass

    def __semoss_display_hook(value):
        if value is None:
            return
        try:
            __semoss_html = getattr(value, "_repr_html_", None)
            if callable(__semoss_html):
                __semoss_result = __semoss_html()
                if isinstance(__semoss_result, str):
                    __semoss_emit_mime("text/html", __semoss_result.encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_svg = getattr(value, "_repr_svg_", None)
            if callable(__semoss_svg):
                __semoss_result = __semoss_svg()
                if isinstance(__semoss_result, str):
                    __semoss_emit_mime("image/svg+xml", __semoss_result.encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_png = getattr(value, "_repr_png_", None)
            if callable(__semoss_png):
                __semoss_result = __semoss_png()
                if __semoss_result:
                    __semoss_bytes = __semoss_result if isinstance(__semoss_result, (bytes, bytearray)) else __semoss_disp_b64.b64decode(__semoss_result)
                    __semoss_emit_mime("image/png", __semoss_bytes)
                    return
        except Exception:
            pass
        try:
            __semoss_jpeg = getattr(value, "_repr_jpeg_", None)
            if callable(__semoss_jpeg):
                __semoss_result = __semoss_jpeg()
                if __semoss_result:
                    __semoss_bytes = __semoss_result if isinstance(__semoss_result, (bytes, bytearray)) else __semoss_disp_b64.b64decode(__semoss_result)
                    __semoss_emit_mime("image/jpeg", __semoss_bytes)
                    return
        except Exception:
            pass
        try:
            __semoss_md = getattr(value, "_repr_markdown_", None)
            if callable(__semoss_md):
                __semoss_result = __semoss_md()
                if isinstance(__semoss_result, str):
                    __semoss_emit_mime("text/markdown", __semoss_result.encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_json_fn = getattr(value, "_repr_json_", None)
            if callable(__semoss_json_fn):
                __semoss_result = __semoss_json_fn()
                if __semoss_result is not None:
                    __semoss_emit_mime("application/json", __semoss_disp_json.dumps(__semoss_result).encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_latex = getattr(value, "_repr_latex_", None)
            if callable(__semoss_latex):
                __semoss_result = __semoss_latex()
                if isinstance(__semoss_result, str):
                    __semoss_emit_mime("text/latex", __semoss_result.encode("utf-8"))
                    return
        except Exception:
            pass
        try:
            __semoss_bundle_fn = getattr(value, "_repr_mimebundle_", None)
            if callable(__semoss_bundle_fn):
                __semoss_bundle = __semoss_bundle_fn()
                if isinstance(__semoss_bundle, tuple):
                    __semoss_bundle = __semoss_bundle[0] if __semoss_bundle else None
                if isinstance(__semoss_bundle, dict):
                    for __semoss_mime, __semoss_data in __semoss_bundle.items():
                        if isinstance(__semoss_data, str):
                            __semoss_emit_mime(__semoss_mime, __semoss_data.encode("utf-8"))
                        elif isinstance(__semoss_data, (bytes, bytearray)):
                            __semoss_emit_mime(__semoss_mime, __semoss_data)
                    return
        except Exception:
            pass
        try:
            print(repr(value))
        except Exception:
            pass

    def __semoss_display(*args, **kwargs):
        for __semoss_arg in args:
            __semoss_display_hook(__semoss_arg)

    try:
        import IPython.display as __semoss_ipy_display
        __semoss_ipy_display.display = __semoss_display
    except Exception:
        pass
    try:
        import IPython.core.display as __semoss_ipy_core_display
        __semoss_ipy_core_display.display = __semoss_display
    except Exception:
        pass
    try:
        import builtins as __semoss_builtins
        __semoss_builtins.display = __semoss_display
    except Exception:
        pass
except Exception:
    pass
`;

	// The cell source is base64-encoded so it can travel as an inert Python
	// string literal (never spliced in as raw code) - ast.parse needs the
	// exact source text at runtime to detect/evaluate a trailing bare
	// expression, and base64's [A-Za-z0-9+/=] alphabet can't break out of the
	// surrounding string literal the way raw user code (quotes/backslashes)
	// could.
	const encodedSource = uint8ArrayToBase64(new TextEncoder().encode(source));
	const executionBlock = `
__semoss_source = __semoss_disp_b64.b64decode("${encodedSource}").decode("utf-8")
try:
    # Only our own scaffolding (ast parsing/splitting/compiling) is guarded
    # here; the user's actual code always runs unguarded below so a real
    # SyntaxError/NameError/etc. in their cell still propagates and surfaces
    # as an execution error, instead of being silently swallowed by this
    # try/except.
    import ast as __semoss_ast
    __semoss_tree = __semoss_ast.parse(__semoss_source, mode="exec")
    __semoss_last_node = None
    if __semoss_tree.body and isinstance(__semoss_tree.body[-1], __semoss_ast.Expr):
        __semoss_last_node = __semoss_tree.body.pop()
    __semoss_exec_code = compile(__semoss_tree, "<notebook-cell>", "exec")
    __semoss_eval_code = (
        compile(__semoss_ast.Expression(__semoss_last_node.value), "<notebook-cell>", "eval")
        if __semoss_last_node is not None
        else None
    )
    __semoss_use_ast_path = True
except Exception:
    __semoss_use_ast_path = False

if __semoss_use_ast_path:
    exec(__semoss_exec_code, globals())
    if __semoss_eval_code is not None:
        __semoss_display_hook(eval(__semoss_eval_code, globals()))
else:
    exec(__semoss_source, globals())
`;

	const suffix = `\n\ntry:\n    if not __semoss_capture_state.get("did_show", False):\n        __semoss_emit_figures()\nexcept Exception:\n    pass\n`;
	return `${matplotlibPreamble}${displayPreamble}${executionBlock}${suffix}`;
};

export const extractNotebookInlineDisplayOutputsFromLogs = (logs: string[]) => {
	const cleanedLogLines: string[] = [];
	const displayOutputs: JupyterCellOutput[] = [];
	let collecting = false;
	let currentMimeType = "image/png";
	let currentBase64Chunks: string[] = [];

	const flush = () => {
		if (!collecting) {
			return;
		}

		// Marker-delimited chunks are stitched back into a MIME bundle so the
		// output lands in a standard display_data cell output. Binary image
		// mimetypes keep the base64 payload as-is (nbformat's own encoding for
		// image data); image/svg+xml is XML text, not binary, and text-based
		// mimetypes need base64-decoding back to their real text/JSON value
		// so they render the same as any other output.
		const base64Data = currentBase64Chunks.join("").replace(/\s+/g, "");
		if (base64Data) {
			if (
				currentMimeType.startsWith("image/") &&
				currentMimeType !== "image/svg+xml"
			) {
				displayOutputs.push({
					output_type: "display_data",
					data: {
						[currentMimeType]: base64Data,
						"text/plain": `data:${currentMimeType};base64,${base64Data}`,
					},
					metadata: {},
				});
			} else if (currentMimeType === "application/json") {
				const decoded = base64ToText(base64Data);
				try {
					displayOutputs.push({
						output_type: "display_data",
						data: {
							"application/json": JSON.parse(decoded),
							"text/plain": decoded,
						},
						metadata: {},
					});
				} catch {
					displayOutputs.push({
						output_type: "display_data",
						data: { "text/plain": decoded },
						metadata: {},
					});
				}
			} else {
				const decoded = base64ToText(base64Data);
				displayOutputs.push({
					output_type: "display_data",
					data: {
						[currentMimeType]: decoded,
						"text/plain": decoded,
					},
					metadata: {},
				});
			}
		}

		collecting = false;
		currentMimeType = "image/png";
		currentBase64Chunks = [];
	};

	for (const chunk of logs) {
		for (const line of chunk.split(/\r?\n/)) {
			if (line.startsWith(INLINE_IMAGE_BEGIN_PREFIX)) {
				flush();
				collecting = true;
				currentMimeType =
					line.slice(INLINE_IMAGE_BEGIN_PREFIX.length).trim() ||
					"image/png";
				currentBase64Chunks = [];
				continue;
			}

			if (line.startsWith(INLINE_IMAGE_CHUNK_PREFIX)) {
				if (collecting) {
					currentBase64Chunks.push(
						line.slice(INLINE_IMAGE_CHUNK_PREFIX.length).trim(),
					);
				}
				continue;
			}

			if (line.trim() === INLINE_IMAGE_END_MARKER) {
				flush();
				continue;
			}

			cleanedLogLines.push(line);
		}
	}

	flush();

	const hasCapturedOutputs = displayOutputs.length > 0;
	const filteredLogLines = hasCapturedOutputs
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
		displayOutputs,
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

const BASE64_CHARS =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Encodes raw bytes to base64 in both browser (btoa) and Node/test runners
// (no global btoa) so IPython-style rich-repr bytes can be embedded as
// nbformat-compatible base64 strings regardless of runtime. Encodes manually
// instead of depending on Buffer/@types/node so this stays browser-safe.
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
	if (typeof btoa === "function") {
		let binary = "";
		for (let i = 0; i < bytes.length; i += 1) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	let result = "";
	for (let i = 0; i < bytes.length; i += 3) {
		const b0 = bytes[i];
		const b1 = bytes[i + 1];
		const b2 = bytes[i + 2];
		const triple = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
		result += BASE64_CHARS[(triple >> 18) & 0x3f];
		result += BASE64_CHARS[(triple >> 12) & 0x3f];
		result += b1 !== undefined ? BASE64_CHARS[(triple >> 6) & 0x3f] : "=";
		result += b2 !== undefined ? BASE64_CHARS[triple & 0x3f] : "=";
	}
	return result;
};

const BASE64_CHAR_INDEX = new Map(
	Array.from(BASE64_CHARS).map((char, index) => [char, index] as const),
);

// Inverse of uint8ArrayToBase64 - used to recover the real text/JSON value
// of a text-based MIME output captured through the inline display marker
// protocol (only image/* mimetypes keep their base64 form as the final
// value; everything else needs to be decoded back to UTF-8 text).
const base64ToUint8Array = (base64: string): Uint8Array => {
	if (typeof atob === "function") {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i += 1) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	const cleaned = base64.replace(/=+$/, "");
	const bytes: number[] = [];
	for (let i = 0; i < cleaned.length; i += 4) {
		const chars = Array.from(cleaned.slice(i, i + 4));
		const values = chars.map((char) => BASE64_CHAR_INDEX.get(char) ?? 0);
		const combined =
			(values[0] << 18) |
			((values[1] ?? 0) << 12) |
			((values[2] ?? 0) << 6) |
			(values[3] ?? 0);
		bytes.push((combined >> 16) & 0xff);
		if (chars.length > 2) bytes.push((combined >> 8) & 0xff);
		if (chars.length > 3) bytes.push(combined & 0xff);
	}
	return Uint8Array.from(bytes);
};

const base64ToText = (base64: string): string => {
	try {
		return new TextDecoder().decode(base64ToUint8Array(base64));
	} catch {
		return "";
	}
};

// A rich-repr mimebundle may carry raw bytes (e.g. a PNG captured before it
// crosses the Pixel/JSON boundary); normalize those to base64 strings so the
// resulting data dict matches what nbformat/JSON.stringify expect.
const normalizeMimeBundleBytes = (
	bundle: Record<string, unknown>,
): Record<string, unknown> => {
	const normalized: Record<string, unknown> = {};
	for (const [mimeType, value] of Object.entries(bundle)) {
		normalized[mimeType] =
			value instanceof Uint8Array ? uint8ArrayToBase64(value) : value;
	}
	return normalized;
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

	if (mimeType?.startsWith("image/")) {
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

const sanitizeOutputData = (value: unknown): Record<string, unknown> => {
	if (isRecordObject(value)) {
		return value;
	}

	const text = value === undefined || value === null ? "" : String(value);
	return {
		"text/plain": text,
	};
};

const sanitizeJupyterOutput = (output: unknown): JupyterCellOutput => {
	if (!isRecordObject(output)) {
		return {
			output_type: "display_data",
			data: {
				"text/plain": toSafeJsonString(output),
			},
			metadata: {},
		};
	}

	const outputType = output.output_type;
	if (outputType === "stream") {
		return {
			output_type: "stream",
			name: output.name === "stderr" ? "stderr" : "stdout",
			text: normalizeUnknownSourceToArray(output.text),
		};
	}

	if (outputType === "error") {
		const ename =
			typeof output.ename === "string" && output.ename
				? output.ename
				: "Error";
		const evalue =
			typeof output.evalue === "string" ? output.evalue : "Unknown error";
		const traceback = Array.isArray(output.traceback)
			? output.traceback.map((entry) => String(entry))
			: [evalue];

		return {
			output_type: "error",
			ename,
			evalue,
			traceback,
		};
	}

	if (outputType === "execute_result") {
		return {
			output_type: "execute_result",
			data: sanitizeOutputData(output.data),
			metadata: isRecordObject(output.metadata) ? output.metadata : {},
			execution_count:
				typeof output.execution_count === "number" &&
				Number.isFinite(output.execution_count)
					? output.execution_count
					: null,
		};
	}

	if (outputType === "update_display_data") {
		return {
			output_type: "update_display_data",
			data: sanitizeOutputData(output.data),
			metadata: isRecordObject(output.metadata) ? output.metadata : {},
			transient: isRecordObject(output.transient)
				? output.transient
				: undefined,
		};
	}

	if (outputType === "display_data") {
		return {
			output_type: "display_data",
			data: sanitizeOutputData(output.data),
			metadata: isRecordObject(output.metadata) ? output.metadata : {},
		};
	}

	return {
		output_type: "display_data",
		data: {
			"text/plain": toSafeJsonString(output),
		},
		metadata: {},
	};
};

const sanitizeJupyterOutputs = (outputs: unknown): JupyterCellOutput[] => {
	if (!Array.isArray(outputs)) {
		return [];
	}

	return outputs.map((entry) => sanitizeJupyterOutput(entry));
};

const sanitizeNotebookCell = (
	cell: unknown,
	notebookLanguage?: string,
): JupyterCell => {
	if (!isRecordObject(cell)) {
		return {
			cell_type: "raw",
			metadata: ensureCellMetadataId({ language: "raw" }),
			source: [],
		};
	}

	const cellType =
		cell.cell_type === "code" ||
		cell.cell_type === "markdown" ||
		cell.cell_type === "raw"
			? cell.cell_type
			: "raw";
	const metadata = ensureCellMetadataId(
		isRecordObject(cell.metadata) ? cell.metadata : {},
	);
	metadata.language = getCellLanguage(cellType, metadata, notebookLanguage);
	const source = normalizeUnknownSourceToArray(cell.source);

	if (cellType === "code") {
		return {
			cell_type: "code",
			execution_count:
				typeof cell.execution_count === "number" &&
				Number.isFinite(cell.execution_count)
					? cell.execution_count
					: null,
			metadata,
			outputs: sanitizeJupyterOutputs(cell.outputs),
			source,
		};
	}

	if (cellType === "markdown") {
		return {
			cell_type: "markdown",
			metadata,
			source,
		};
	}

	return {
		cell_type: "raw",
		metadata,
		source,
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
		// Prefer rich Jupyter MIME payloads when we can infer the content type;
		// fall back to text/plain so every output remains readable.
		const trimmed = output.trim();

		const markdownImageMatch = trimmed.match(/^!\[[^\]]*\]\(([^)]+)\)$/);
		if (markdownImageMatch?.[1]) {
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

		// Support IPython-style rich-repr objects (_repr_mimebundle_/_repr_png_)
		// or a plain `mimebundle` bag, in case an execution path hands us a
		// live/pre-shaped bundle instead of a raw string or JSON payload.
		if (typeof asRecord._repr_mimebundle_ === "function") {
			const bundle = (asRecord._repr_mimebundle_ as () => unknown)();
			if (isRecordObject(bundle)) {
				return normalizeMimeBundleBytes(bundle);
			}
		}

		if (isRecordObject(asRecord.mimebundle)) {
			return normalizeMimeBundleBytes(
				asRecord.mimebundle as Record<string, unknown>,
			);
		}

		if (typeof asRecord._repr_png_ === "function") {
			const png = (asRecord._repr_png_ as () => unknown)();
			if (png instanceof Uint8Array) {
				return {
					"image/png": uint8ArrayToBase64(png),
					"text/plain": "",
				};
			}
			if (typeof png === "string" && png.length > 0) {
				return { "image/png": png, "text/plain": "" };
			}
		}

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
			return sanitizeJupyterOutputs(output);
		}
	}

	if (options?.isError) {
		return [toErrorOutput(output)];
	}

	const data = toMimeBundleFromOutput(output, options?.operationType);

	// Guarantee a text/plain fallback regardless of which branch of
	// toMimeBundleFromOutput produced `data` (e.g. a pre-shaped `{ data }`
	// envelope may omit it) so every renderer always has something to fall
	// back to instead of an empty/unrenderable output.
	if (typeof data["text/plain"] !== "string") {
		data["text/plain"] = toSafeJsonString(output);
	}

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
			languageInfoName: "python",
			languageInfoMimetype: "text/x-python",
			languageInfoFileExtension: ".py",
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

	if (normalized === "pixel") {
		// Pixel isn't a real Jupyter kernel, but it must stay distinguishable
		// from python: buildExecutePixel/buildNotebookExecutionSource key off
		// this exact language string when a saved pixel cell is later re-run
		// from the notebook viewer, so falling through to the python default
		// below would silently try to execute raw Pixel syntax as Python.
		return {
			cellType: "code",
			language: "pixel",
			kernelDisplayName: "Pixel",
			kernelLanguage: "pixel",
			kernelName: "pixel",
			languageInfoName: "pixel",
			languageInfoMimetype: "text/x-pixel",
			languageInfoFileExtension: ".pixel",
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
		// Keep existing kernelspec/language_info when editing an existing file,
		// but still backfill required fields for newly created notebooks.
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
	content.cells = ensureNotebookCellMetadataIds(
		content.cells,
		getNotebookLanguageFromMetadata(content.metadata),
	);

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

		const notebookLanguage = getNotebookLanguageFromMetadata(
			ipynb.metadata,
		);
		ipynb.cells = ipynb.cells.map((cell) =>
			sanitizeNotebookCell(cell, notebookLanguage),
		);

		ipynb.cells = ensureNotebookCellMetadataIds(
			ipynb.cells,
			notebookLanguage,
		);

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
		const notebookLanguage = getNotebookLanguageFromMetadata(
			ipynb.metadata,
		);
		ipynb.cells = ipynb.cells.map((cell) =>
			sanitizeNotebookCell(cell, notebookLanguage),
		);
		ipynb.cells = ensureNotebookCellMetadataIds(
			ipynb.cells,
			notebookLanguage,
		);

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

	// Only languages with a server-side Pixel reactor can be executed;
	// Python/R route through their reactor, raw "pixel" is sent as-is, and
	// anything else returns null so callers can surface an unsupported-language error.
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

	// Each operationType stores its user-facing payload in a different slot of
	// the Pixel response envelope; pick the right slot so notebook output
	// mapping renders the actual value instead of the wrapper. Mirrors the
	// terminal REPL's unwrap (terminal-console.tsx / cell.state.ts).
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
	if (!raw || !raw.trim()) {
		// An empty response body (new/not-yet-written file, or a transient
		// load race) is a distinct, expected case - report it plainly instead
		// of surfacing a raw "Unexpected end of JSON input" parser exception.
		return {
			notebook: null,
			error: "Notebook file is empty",
		};
	}

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!isRecordObject(parsed)) {
			return {
				notebook: null,
				error: "Invalid .ipynb content",
			};
		}

		if (!Array.isArray(parsed.cells)) {
			return {
				notebook: null,
				error: "Invalid .ipynb content",
			};
		}

		// A missing/unexpected nbformat (e.g. an older export, or a hand-edited
		// file that omits the field) is still recoverable as long as `cells` is
		// a real array - we coerce nbformat to 4 below instead of rejecting the
		// whole file. Only reject payloads that aren't shaped like a notebook.
		const metadata = isRecordObject(parsed.metadata) ? parsed.metadata : {};
		const notebookLanguage = getNotebookLanguageFromMetadata(metadata);
		const cells = parsed.cells.map((cell) =>
			sanitizeNotebookCell(cell, notebookLanguage),
		);

		return {
			notebook: {
				...parsed,
				nbformat: DEFAULT_NBFORMAT,
				nbformat_minor:
					typeof parsed.nbformat_minor === "number"
						? parsed.nbformat_minor
						: DEFAULT_NBFORMAT_MINOR,
				metadata,
				cells: ensureNotebookCellMetadataIds(cells, notebookLanguage),
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
