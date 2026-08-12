import { CopyIcon } from "lucide-react";
import {
	Button,
	cn,
	Markdown,
	Muted,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { IMAGE_MIME_TYPES } from "../../utility/image";
import type { JupyterOutput } from "./notebook.types";
import {
	getMimeString,
	getOutputCopyText,
	normalizeSource,
	stripAnsi,
} from "./notebook.utility";

interface NotebookCellOutputProps {
	/** The nbformat output to render. */
	output: JupyterOutput;
}

/**
 * Render a single nbformat output with a hover-revealed button to copy its text
 * representation to the clipboard (shown only when there is text to copy). The
 * body is styled by output type: a `stream` (stdout / stderr), an `error`
 * traceback, or a rich `display_data` / `execute_result` MIME bundle (image,
 * then HTML, then a plain-text / JSON fallback).
 */
export const NotebookCellOutput: React.FC<NotebookCellOutputProps> = ({
	output,
}) => {
	const copyText = getOutputCopyText(output);

	const copyOutput = async () => {
		if (copyText === null) {
			return;
		}
		try {
			await navigator.clipboard.writeText(copyText);
			toast.success("Copied to clipboard");
		} catch {
			toast.error("Failed to copy");
		}
	};

	let body: React.ReactNode;
	if (output.output_type === "stream") {
		body = (
			<div className="w-full px-2 pb-2">
				<pre
					className={cn(
						"overflow-x-auto whitespace-pre-wrap rounded bg-muted/50 p-3 font-mono text-xs",
						output.name === "stderr"
							? "text-destructive"
							: "text-foreground",
					)}
				>
					{stripAnsi(normalizeSource(output.text))}
				</pre>
			</div>
		);
	} else if (output.output_type === "error") {
		const traceback =
			Array.isArray(output.traceback) && output.traceback.length
				? output.traceback.join("\n")
				: `${output.ename}: ${output.evalue}`;
		body = (
			<div className="w-full px-2 pb-2">
				<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-destructive/5 p-3 font-mono text-destructive text-xs">
					{stripAnsi(traceback)}
				</pre>
			</div>
		);
	} else {
		const { data } = output;

		// Rich (display_data / execute_result) outputs: prefer an image, then
		// HTML, then a plain-text/JSON fallback — how a notebook picks one
		// representation out of a MIME bundle.
		const imageMime = IMAGE_MIME_TYPES.find(
			(mime) => getMimeString(data, mime) !== null,
		);
		const html = getMimeString(data, "text/html");
		if (imageMime) {
			const base64 = (getMimeString(data, imageMime) ?? "").replace(
				/\s/g,
				"",
			);
			body = (
				<img
					alt="Notebook cell output"
					className="mr-auto max-w-auto rounded"
					src={`data:${imageMime};base64,${base64}`}
				/>
			);
		} else if (html !== null) {
			// text/html outputs (e.g. a pandas DataFrame _repr_html_) render
			// through the shared Markdown component, which permits raw HTML.
			// .ipynb files can come from untrusted sources, so this carries the
			// same trust assumption as the app's other Markdown rendering.
			body = (
				<div className="overflow-x-auto text-sm">
					<Markdown>{html}</Markdown>
				</div>
			);
		} else if ("application/vnd.jupyter.widget-view+json" in data) {
			body = (
				<Muted className="p-3 italic">
					Widget output (not renderable in this viewer)
				</Muted>
			);
		} else {
			const plain = getMimeString(data, "text/plain");
			body = (
				<div className="w-full px-2 pb-2">
					<pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted/50 p-3 font-mono text-foreground text-xs">
						{plain !== null
							? stripAnsi(plain)
							: JSON.stringify(data, null, 2)}
					</pre>
				</div>
			);
		}
	}

	return (
		<div className="group/output relative">
			{copyText !== null && (
				<div className="absolute top-0 right-2 z-10 opacity-0 transition-opacity focus-within:opacity-100 group-hover/output:opacity-100">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={(e) => {
									e.stopPropagation();
									void copyOutput();
								}}
								aria-label="Copy output"
								data-testid="notebook-cell-output-copy"
							>
								<CopyIcon className="size-3.5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Copy</TooltipContent>
					</Tooltip>
				</div>
			)}
			{body}
		</div>
	);
};
