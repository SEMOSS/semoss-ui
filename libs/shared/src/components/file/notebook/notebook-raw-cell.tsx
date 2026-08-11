import type { JupyterRawCell } from "./notebook.types";
import { normalizeSource } from "./notebook.utility";
import { NotebookCell, type NotebookCellBaseProps } from "./notebook-cell";

interface NotebookRawCellProps extends NotebookCellBaseProps {
	/** The raw cell to render. */
	cell: JupyterRawCell;
}

/** Raw cell: read-only plain-text body inside the shared frame. */
export const NotebookRawCell: React.FC<NotebookRawCellProps> = ({
	cell,
	...chrome
}) => {
	return (
		<NotebookCell cell={cell} {...chrome}>
			<pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-foreground text-xs">
				{normalizeSource(cell.source)}
			</pre>
		</NotebookCell>
	);
};
