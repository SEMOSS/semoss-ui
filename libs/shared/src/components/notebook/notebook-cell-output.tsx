import { Markdown, Muted } from "@semoss/ui/next";
import { IMAGE_MIME_TYPES } from "../../utility/image";
import type { JupyterOutput } from "./notebook.types";
import { normalizeSource } from "./notebook.utility";

// Strip ANSI SGR escape sequences (colored tracebacks/logs) so they render as
// plain text. Built from a char code to avoid a control character in a regex
const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

/** Read a MIME entry from an output data bundle as a single string. */
const getMimeString = (
	data: Record<string, unknown>,
	mimeType: string,
): string | null => {
	const value = data[mimeType];
	if (typeof value === "string") return value;
	if (Array.isArray(value)) {
		return value.map((entry) => String(entry)).join("");
	}
	return null;
};

/** Strip ANSI SGR escape sequences so colored logs/tracebacks render as plain text. */
const stripAnsi = (value: string): string => value.replace(ANSI_ESCAPE, "");

interface NotebookCellOutputProps {
	/** The nbformat output to render. */
	output: JupyterOutput;
}

/**
 * Render a single nbformat output, styled by its type: a `stream` (stdout /
 * stderr), an `error` traceback, or a rich `display_data` / `execute_result`
 * MIME bundle (image, then HTML, then a plain-text / JSON fallback).
 */
export const NotebookCellOutput: React.FC<NotebookCellOutputProps> = ({
	output,
}) => {
	if (output.output_type === "stream") {
		return (
			<div className="w-full px-2 pb-2">
				<pre
					className={`overflow-x-auto whitespace-pre-wrap rounded bg-muted/50 p-3 font-mono text-xs ${
						output.name === "stderr"
							? "text-destructive"
							: "text-foreground"
					}`}
				>
					{stripAnsi(normalizeSource(output.text))}
				</pre>
			</div>
		);
	}

	if (output.output_type === "error") {
		const traceback =
			Array.isArray(output.traceback) && output.traceback.length
				? output.traceback.join("\n")
				: `${output.ename}: ${output.evalue}`;
		return (
			<div className="w-full px-2 pb-2">
				<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-destructive/5 p-3 font-mono text-destructive text-xs">
					{stripAnsi(traceback)}
				</pre>
			</div>
		);
	}

	const { data } = output;

	// Rich (display_data / execute_result) outputs: prefer an image, then HTML,
	// then a plain-text/JSON fallback — how a notebook picks one representation
	// out of a MIME bundle.
	const imageMime = IMAGE_MIME_TYPES.find(
		(mime) => getMimeString(data, mime) !== null,
	);
	if (imageMime) {
		const base64 = (getMimeString(data, imageMime) ?? "").replace(
			/\s/g,
			"",
		);
		return (
			<img
				alt="Notebook cell output"
				className="mr-auto max-w-auto rounded"
				src={`data:${imageMime};base64,${base64}`}
			/>
		);
	}

	const html = getMimeString(data, "text/html");
	if (html !== null) {
		// text/html outputs (e.g. a pandas DataFrame _repr_html_) render through
		// the shared Markdown component, which permits raw HTML. .ipynb files can
		// come from untrusted sources, so this carries the same trust assumption
		// as the app's other Markdown rendering.
		return (
			<div className="overflow-x-auto text-sm">
				<Markdown>{html}</Markdown>
			</div>
		);
	}

	if ("application/vnd.jupyter.widget-view+json" in data) {
		return (
			<Muted className="p-3 italic">
				Widget output (not renderable in this viewer)
			</Muted>
		);
	}

	const plain = getMimeString(data, "text/plain");
	return (
		<div className="w-full px-2 pb-2">
			<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted/50 p-3 font-mono text-foreground text-xs">
				{plain !== null
					? stripAnsi(plain)
					: JSON.stringify(data, null, 2)}
			</pre>
		</div>
	);
};
