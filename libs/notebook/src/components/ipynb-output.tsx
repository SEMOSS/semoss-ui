import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import type { JupyterCellOutput } from "../types";
import { normalizeSource } from "../utils";

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

		const render = async () => {
			try {
				const plotlyModule = await import("plotly.js-dist-min");
				const plotly =
					"default" in plotlyModule
						? plotlyModule.default
						: plotlyModule;

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

		const render = async () => {
			try {
				const vegaEmbedModule = await import("vega-embed");
				const vegaEmbed =
					"default" in vegaEmbedModule
						? vegaEmbedModule.default
						: vegaEmbedModule;

				if (!isMounted || !containerRef.current) {
					return;
				}

				await vegaEmbed(containerRef.current, spec, {
					actions: false,
					renderer: "canvas",
				});
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

export const IpynbOutput: React.FC<IpynbOutputProps> = ({ output }) => {
	if (output.output_type === "stream") {
		return (
			<pre
				className={`whitespace-pre-wrap rounded border p-3 text-xs ${
					output.name === "stderr"
						? "text-destructive"
						: "text-foreground"
				}`}
			>
				{normalizeSource(output.text)}
			</pre>
		);
	}

	if (output.output_type === "error") {
		return (
			<pre className="whitespace-pre-wrap rounded border border-destructive/50 bg-destructive/5 p-3 text-destructive text-xs">
				{[
					`${output.ename}: ${output.evalue}`,
					...output.traceback,
				].join("\n")}
			</pre>
		);
	}

	const data = output.data;

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

	const svg = getMimeString(data, "image/svg+xml");
	if (svg) {
		return (
			<div
				className="overflow-auto rounded border bg-background p-2"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted notebook content
				dangerouslySetInnerHTML={{ __html: svg }}
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
				// biome-ignore lint/security/noDangerouslySetInnerHtml: trusted notebook markdown output
				dangerouslySetInnerHTML={{ __html: marked.parse(markdown) }}
			/>
		);
	}

	const latex = getMimeString(data, "text/latex");
	if (latex) {
		return (
			<pre className="whitespace-pre-wrap rounded border bg-muted/30 p-3 text-foreground text-xs">
				{latex}
			</pre>
		);
	}

	const pdf = getMimeString(data, "application/pdf");
	if (pdf) {
		return (
			<iframe
				title="Notebook PDF output"
				className="min-h-72 w-full rounded border bg-background"
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
	const json =
		jsonValue === undefined ? null : JSON.stringify(jsonValue, null, 2);

	if (json) {
		return (
			<pre className="whitespace-pre-wrap rounded border p-3 text-foreground text-xs">
				{json}
			</pre>
		);
	}

	const text =
		getMimeString(data, "text/plain") ?? JSON.stringify(data, null, 2);

	return (
		<pre className="whitespace-pre-wrap rounded border p-3 text-foreground text-xs">
			{text}
		</pre>
	);
};
