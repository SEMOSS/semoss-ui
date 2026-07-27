import { uint8ArrayToBase64 } from "./base64";
import { isRecordObject } from "./json";

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

/**
 * Best-effort conversion of a raw Pixel execution result into a Jupyter MIME
 * data dict. Pixel only ever hands back plain JSON-shaped values, so this
 * looks for well-known conventions (data URIs, base64 signatures, markdown
 * image syntax, Plotly/Altair JSON specs, a live rich-repr object, ...)
 * before falling back to a plain text/plain rendering of the value.
 */
export const toMimeBundleFromOutput = (
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
