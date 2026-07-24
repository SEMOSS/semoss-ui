import DOMPurify from "dompurify";
import { useEffect, useRef, useState } from "react";
import { ansiToSafeHtml, hasAnsiCodes } from "../ansi";
import { renderLatexToHtml, renderMarkdownToHtml } from "../markdown";
import type { JupyterCellOutput } from "../types";
import {
	MAX_TEXT_OUTPUT_LENGTH,
	normalizeSource,
	truncateTextOutput,
} from "../utils";

const getMimeString = (
	data: Record<string, unknown>,
	mimeType: string,
): string | null => {
	const value = data[mimeType];
	if (typeof value === "string") return value;
	if (Array.isArray(value))
		return value.map((entry) => String(entry)).join("");
	return null;
};

const getMimeObject = (
	data: Record<string, unknown>,
	mimeType: string,
): Record<string, unknown> | null => {
	const value = data[mimeType];
	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return null;
};

const getFirstMimeObject = (
	data: Record<string, unknown>,
	mimeTypes: string[],
): Record<string, unknown> | null => {
	for (const mimeType of mimeTypes) {
		const value = getMimeObject(data, mimeType);
		if (value) {
			return value;
		}
	}

	return null;
};

interface IpynbOutputProps {
	output: JupyterCellOutput;
}

interface PlotlyFigure {
	data: unknown[];
	layout?: Record<string, unknown>;
	config?: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

// Minimal collapsible tree for application/json output. Uses native
// <details>/<summary> instead of a charting-style library so large JSON
// payloads (common from pandas/dict dumps) don't render as an unreadable
// wall of text and don't require a new dependency.
const JsonTreeValue: React.FC<{ value: unknown; label?: string }> = ({
	value,
	label,
}) => {
	if (Array.isArray(value)) {
		return (
			<details className="ml-2">
				<summary className="cursor-pointer select-none text-foreground">
					{label !== undefined ? `${label}: ` : ""}Array(
					{value.length})
				</summary>
				<div className="ml-3 border-border border-l pl-2">
					{value.map((item, index) => (
						<JsonTreeValue
							// biome-ignore lint/suspicious/noArrayIndexKey: array order is stable for a given output
							key={index}
							value={item}
							label={String(index)}
						/>
					))}
				</div>
			</details>
		);
	}

	if (isRecord(value)) {
		const entries = Object.entries(value);
		return (
			<details className="ml-2" open={label === undefined}>
				<summary className="cursor-pointer select-none text-foreground">
					{label !== undefined ? `${label}: ` : ""}Object(
					{entries.length})
				</summary>
				<div className="ml-3 border-border border-l pl-2">
					{entries.map(([key, entryValue]) => (
						<JsonTreeValue
							key={key}
							value={entryValue}
							label={key}
						/>
					))}
				</div>
			</details>
		);
	}

	return (
		<div className="ml-2 text-foreground">
			{label !== undefined ? `${label}: ` : ""}
			<span className="text-muted-foreground">
				{JSON.stringify(value)}
			</span>
		</div>
	);
};

const parsePlotlyFigure = (value: unknown): PlotlyFigure | null => {
	if (!isRecord(value)) {
		return null;
	}

	const figureData = value.data;
	if (!Array.isArray(figureData)) {
		return null;
	}

	const layout = isRecord(value.layout) ? value.layout : undefined;
	const config = isRecord(value.config) ? value.config : undefined;

	return {
		data: figureData,
		layout,
		config,
	};
};

const PlotlyOutput: React.FC<{ figure: PlotlyFigure }> = ({ figure }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [renderError, setRenderError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;
		let plotlyInstance: {
			purge: (root: HTMLElement) => void;
		} | null = null;

		const render = async () => {
			try {
				// Lazy-load heavy plotting runtime only when a plotly MIME output is present.
				const plotlyModule = await import("plotly.js-dist-min");
				const plotly =
					"default" in plotlyModule
						? plotlyModule.default
						: plotlyModule;
				plotlyInstance = plotly as {
					purge: (root: HTMLElement) => void;
				};

				if (!isMounted || !containerRef.current) {
					return;
				}

				await plotly.newPlot(
					containerRef.current,
					figure.data,
					figure.layout,
					{
						responsive: true,
						...figure.config,
					},
				);
				setRenderError(null);
			} catch (error) {
				if (!isMounted) {
					return;
				}
				setRenderError(
					error instanceof Error
						? error.message
						: "Failed to render Plotly output.",
				);
			}
		};

		void render();

		return () => {
			isMounted = false;
			if (containerRef.current) {
				if (plotlyInstance?.purge) {
					plotlyInstance.purge(containerRef.current);
				}
				containerRef.current.replaceChildren();
			}
		};
	}, [figure]);

	if (renderError) {
		return (
			<pre className="whitespace-pre-wrap rounded border border-destructive/50 bg-destructive/5 p-3 text-destructive text-xs">
				{`[Plotly render error]\n${renderError}`}
			</pre>
		);
	}

	return (
		<div
			ref={containerRef}
			className="w-full overflow-auto rounded border p-2"
		/>
	);
};

const VegaOutput: React.FC<{ spec: Record<string, unknown> }> = ({ spec }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [renderError, setRenderError] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;
		let cleanupView: (() => void) | null = null;

		const render = async () => {
			try {
				// Vega-Lite rendering is optional at runtime and loaded on demand.
				const vegaEmbedModule = await import("vega-embed");
				const vegaEmbed =
					"default" in vegaEmbedModule
						? vegaEmbedModule.default
						: vegaEmbedModule;

				if (!isMounted || !containerRef.current) {
					return;
				}

				const embedResult = await vegaEmbed(
					containerRef.current,
					spec,
					{
						actions: false,
						renderer: "canvas",
					},
				);
				cleanupView = () => {
					embedResult.view.finalize();
				};
				setRenderError(null);
			} catch (error) {
				if (!isMounted) {
					return;
				}
				setRenderError(
					error instanceof Error
						? error.message
						: "Failed to render Vega-Lite output.",
				);
			}
		};

		void render();

		return () => {
			isMounted = false;
			if (cleanupView) {
				cleanupView();
			}
			if (containerRef.current) {
				containerRef.current.replaceChildren();
			}
		};
	}, [spec]);

	if (renderError) {
		return (
			<pre className="whitespace-pre-wrap rounded border border-destructive/50 bg-destructive/5 p-3 text-destructive text-xs">
				{`[Vega-Lite render error]\n${renderError}`}
			</pre>
		);
	}

	return (
		<div
			ref={containerRef}
			className="w-full overflow-auto rounded border p-2"
		/>
	);
};

// Shared renderer for plain-text-ish outputs (stream, error, text/plain
// fallback): converts ANSI color codes to HTML when present (colorama/rich/
// pytest output), and caps runaway-length output with a visible truncation
// notice, mirroring Jupyter's own output size guard.
const TextOutputBlock: React.FC<{ text: string; className: string }> = ({
	text,
	className,
}) => {
	const {
		text: displayText,
		truncated,
		originalLength,
	} = truncateTextOutput(text);
	const ansi = hasAnsiCodes(displayText);

	return (
		<div className={className}>
			{ansi ? (
				<pre
					className="whitespace-pre-wrap"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify in ansiToSafeHtml
					dangerouslySetInnerHTML={{
						__html: ansiToSafeHtml(displayText),
					}}
				/>
			) : (
				<pre className="whitespace-pre-wrap">{displayText}</pre>
			)}
			{truncated && (
				<div className="mt-2 text-muted-foreground italic">
					Output truncated ({MAX_TEXT_OUTPUT_LENGTH.toLocaleString()}{" "}
					of {originalLength.toLocaleString()} characters shown)
				</div>
			)}
		</div>
	);
};

export const IpynbOutput: React.FC<IpynbOutputProps> = ({ output }) => {
	if (output.output_type === "stream") {
		return (
			<TextOutputBlock
				text={normalizeSource(output.text)}
				className={`rounded border p-3 text-xs ${
					output.name === "stderr"
						? "text-destructive"
						: "text-foreground"
				}`}
			/>
		);
	}

	if (output.output_type === "error") {
		return (
			<TextOutputBlock
				text={[
					`${output.ename}: ${output.evalue}`,
					...output.traceback,
				].join("\n")}
				className="rounded border border-destructive/50 bg-destructive/5 p-3 text-destructive text-xs"
			/>
		);
	}

	const content = renderMimeBundleOutput(output.data);

	// execute_result is the cell's "return value" (as opposed to display_data,
	// which is a side-effect print/plot); Jupyter labels it Out[n] using its
	// own execution_count, distinct from the cell's In[n] count.
	if (output.output_type === "execute_result") {
		return (
			<div className="flex items-start gap-2">
				<div className="shrink-0 pt-1 font-mono text-muted-foreground text-xs">
					Out[{output.execution_count ?? " "}]:
				</div>
				<div className="min-w-0 flex-1">{content}</div>
			</div>
		);
	}

	return content;
};

const renderMimeBundleOutput = (
	data: Record<string, unknown>,
): React.ReactNode => {
	const png = getMimeString(data, "image/png");
	if (png) {
		return (
			<img
				src={`data:image/png;base64,${png.replace(/\s+/g, "")}`}
				alt="Notebook output"
				className="max-h-[28rem] max-w-full rounded border"
			/>
		);
	}

	const jpeg = getMimeString(data, "image/jpeg");
	if (jpeg) {
		return (
			<img
				src={`data:image/jpeg;base64,${jpeg.replace(/\s+/g, "")}`}
				alt="Notebook output"
				className="max-h-[28rem] max-w-full rounded border"
			/>
		);
	}

	const gif = getMimeString(data, "image/gif");
	if (gif) {
		return (
			<img
				src={`data:image/gif;base64,${gif.replace(/\s+/g, "")}`}
				alt="Notebook output"
				className="max-h-[28rem] max-w-full rounded border"
			/>
		);
	}

	const webp = getMimeString(data, "image/webp");
	if (webp) {
		return (
			<img
				src={`data:image/webp;base64,${webp.replace(/\s+/g, "")}`}
				alt="Notebook output"
				className="max-h-[28rem] max-w-full rounded border"
			/>
		);
	}

	const bmp = getMimeString(data, "image/bmp");
	if (bmp) {
		return (
			<img
				src={`data:image/bmp;base64,${bmp.replace(/\s+/g, "")}`}
				alt="Notebook output"
				className="max-h-[28rem] max-w-full rounded border"
			/>
		);
	}

	const svg = getMimeString(data, "image/svg+xml");
	if (svg) {
		return (
			<div
				className="overflow-auto rounded border bg-background p-2"
				// SVG output can originate from an untrusted/malformed .ipynb file and
				// may embed <script>/event-handler payloads; sanitize before injecting.
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify above
				dangerouslySetInnerHTML={{
					__html: DOMPurify.sanitize(svg, {
						USE_PROFILES: { svg: true, svgFilters: true },
					}),
				}}
			/>
		);
	}

	const html = getMimeString(data, "text/html");
	if (html) {
		return (
			<iframe
				title="Notebook HTML output"
				className="min-h-52 w-full rounded border bg-background"
				sandbox="allow-scripts"
				srcDoc={html}
			/>
		);
	}

	const markdown = getMimeString(data, "text/markdown");
	if (markdown) {
		return (
			<div
				className="prose prose-sm max-w-none overflow-auto rounded border bg-background p-3"
				// Same untrusted-content concern as SVG above: renderMarkdownToHtml
				// sanitizes via DOMPurify and renders $..$/$$..$$ math via KaTeX.
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify in renderMarkdownToHtml
				dangerouslySetInnerHTML={{
					__html: renderMarkdownToHtml(markdown),
				}}
			/>
		);
	}

	const latex = getMimeString(data, "text/latex");
	if (latex) {
		return (
			<div
				className="overflow-auto rounded border bg-muted/30 p-3 text-foreground text-xs"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify in renderLatexToHtml
				dangerouslySetInnerHTML={{ __html: renderLatexToHtml(latex) }}
			/>
		);
	}

	const pdf = getMimeString(data, "application/pdf");
	if (pdf) {
		return (
			<iframe
				title="Notebook PDF output"
				className="min-h-72 w-full rounded border bg-background"
				// Defense-in-depth: block script/plugin execution even though PDFs
				// are rendered by the browser's built-in viewer, not this document.
				sandbox=""
				src={`data:application/pdf;base64,${pdf.replace(/\s+/g, "")}`}
			/>
		);
	}

	const javascript = getMimeString(data, "application/javascript");
	if (javascript) {
		return (
			<iframe
				title="Notebook JavaScript output"
				className="min-h-52 w-full rounded border bg-background"
				sandbox="allow-scripts"
				srcDoc={`<script>${javascript}</script>`}
			/>
		);
	}

	const plotly = getFirstMimeObject(data, [
		"application/vnd.plotly.v3+json",
		"application/vnd.plotly.v2+json",
		"application/vnd.plotly.v1+json",
	]);
	if (plotly) {
		const plotlyFigure = parsePlotlyFigure(plotly);
		if (plotlyFigure) {
			return <PlotlyOutput figure={plotlyFigure} />;
		}
	}

	const vega = getFirstMimeObject(data, [
		"application/vnd.vegalite.v5+json",
		"application/vnd.vegalite.v4+json",
		"application/vnd.vegalite.v3+json",
		"application/vnd.vega.v5+json",
		"application/vnd.vega.v4+json",
	]);

	if (vega) {
		return <VegaOutput spec={vega} />;
	}

	const widgetView = getMimeObject(
		data,
		"application/vnd.jupyter.widget-view+json",
	);
	if (widgetView) {
		return (
			<pre className="whitespace-pre-wrap rounded border bg-muted/30 p-3 text-foreground text-xs">
				{`[Jupyter widget output]\n${JSON.stringify(widgetView, null, 2)}`}
			</pre>
		);
	}

	const jsonValue = data["application/json"];
	if (jsonValue !== undefined) {
		return (
			<div className="overflow-auto rounded border bg-background p-3 font-mono text-xs">
				<JsonTreeValue value={jsonValue} />
			</div>
		);
	}

	const text =
		getMimeString(data, "text/plain") ?? JSON.stringify(data, null, 2);

	return (
		<TextOutputBlock
			text={text}
			className="rounded border p-3 text-foreground text-xs"
		/>
	);
};
