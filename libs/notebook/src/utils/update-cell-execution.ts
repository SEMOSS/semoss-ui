import type {
	JupyterCellOutput,
	JupyterCodeCell,
	JupyterNotebook,
} from "../types";

/**
 * Returns a new notebook with one cell's outputs/execution_count updated
 * after running it, used by the notebook viewer's Run/Run All actions.
 */
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
