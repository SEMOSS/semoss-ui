/**
 * Scans an existing notebook's code cells for the highest execution_count
 * and returns the next one, mirroring how a real kernel increments In[n].
 */
export const getNextNotebookExecutionCount = (notebook: {
	cells?: Array<{ cell_type?: string; execution_count?: unknown }>;
}): number => {
	if (!Array.isArray(notebook.cells)) return 1;
	let maxCount = 0;
	for (const cell of notebook.cells) {
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
