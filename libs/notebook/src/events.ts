export const NOTEBOOK_FILE_REFRESH_EVENT = "SEMOSS_IPYNB_FILE_REFRESH";
export const NOTEBOOK_ROW_CLEAR_SELECTION_EVENT =
	"SEMOSS_IPYNB_ROW_CLEAR_SELECTION";

export const notifyNotebookFileRefresh = (path: string): void => {
	if (typeof window === "undefined") return;
	window.dispatchEvent(
		new CustomEvent(NOTEBOOK_FILE_REFRESH_EVENT, {
			detail: { path },
		}),
	);
};

export const notifyNotebookRowClearSelection = (path: string): void => {
	if (typeof window === "undefined") return;
	window.dispatchEvent(
		new CustomEvent(NOTEBOOK_ROW_CLEAR_SELECTION_EVENT, {
			detail: { path },
		}),
	);
};
