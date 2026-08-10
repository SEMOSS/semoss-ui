import { Markdown } from "@semoss/ui/next";
import type { JupyterCell } from "./notebook.types";
import { normalizeSource } from "./notebook.utility";
import { NotebookCodeCellView } from "./notebook-code-cell-view";

interface NotebookCellInputProps {
	/** The cell whose editable body is rendered. */
	cell: JupyterCell;
	/** For markdown cells: show the Monaco editor instead of the preview. */
	isEditing: boolean;
	/** Called with the new source when the cell body is edited. */
	onChange: (source: string) => void;
	/** Ctrl+Enter: run in place (code cells only). */
	onRunInPlace?: () => void;
	/** Shift+Enter: run and advance (code cells only). */
	onRunAndAdvance?: () => void;
}

/**
 * Render a cell's editable body by type: code (and markdown while editing) use
 * the Monaco editor; markdown otherwise previews as rendered Markdown; raw shows
 * its plain text. The surrounding chrome (header, border, outputs) lives in
 * `NotebookCell`.
 */
export const NotebookCellInput: React.FC<NotebookCellInputProps> = ({
	cell,
	isEditing,
	onChange,
	onRunInPlace,
	onRunAndAdvance,
}) => {
	const source = normalizeSource(cell.source);

	if (cell.cell_type === "markdown" && !isEditing) {
		return (
			<div className="p-4">
				{source.trim() ? (
					<Markdown>{source}</Markdown>
				) : (
					<span className="text-muted-foreground text-sm italic">
						Empty markdown cell — click Edit to add content.
					</span>
				)}
			</div>
		);
	}

	if (cell.cell_type === "raw") {
		return (
			<pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-foreground text-xs">
				{source}
			</pre>
		);
	}

	return (
		<NotebookCodeCellView
			value={source}
			language={cell.cell_type === "markdown" ? "markdown" : "python"}
			onChange={onChange}
			onRunInPlace={onRunInPlace}
			onRunAndAdvance={onRunAndAdvance}
		/>
	);
};
