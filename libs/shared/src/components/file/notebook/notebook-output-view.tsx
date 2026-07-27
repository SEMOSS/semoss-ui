import { Markdown } from "@semoss/ui/next";
import type { JupyterOutput } from "./notebook.utility";
import { getMimeString, normalizeSource, stripAnsi } from "./notebook.utility";

/** Render a single nbformat output (stream / error / rich MIME bundle). */
export const NotebookOutputView: React.FC<{ output: JupyterOutput }> = ({
	output,
}) => {
	if (output.output_type === "stream") {
		return (
			<pre
				className={`overflow-x-auto whitespace-pre-wrap rounded bg-muted/30 p-3 font-mono text-xs ${
					output.name === "stderr"
						? "text-destructive"
						: "text-foreground"
				}`}
			>
				{stripAnsi(normalizeSource(output.text))}
			</pre>
		);
	}

	if (output.output_type === "error") {
		const traceback =
			Array.isArray(output.traceback) && output.traceback.length
				? output.traceback.join("\n")
				: `${output.ename}: ${output.evalue}`;
		return (
			<pre className="overflow-x-auto whitespace-pre-wrap rounded border border-destructive/40 bg-destructive/5 p-3 font-mono text-destructive text-xs">
				{stripAnsi(traceback)}
			</pre>
		);
	}

	const data = output.data;

	// Rich (display_data / execute_result) outputs: prefer an image, then HTML,
	// then a plain-text/JSON fallback — how a notebook picks one representation
	// out of a MIME bundle.
	const imageMime = ["image/png", "image/jpeg", "image/gif"].find(
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
				className="max-w-full rounded border"
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

	const plain = getMimeString(data, "text/plain");
	return (
		<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted/30 p-3 font-mono text-foreground text-xs">
			{plain !== null ? stripAnsi(plain) : JSON.stringify(data, null, 2)}
		</pre>
	);
};
