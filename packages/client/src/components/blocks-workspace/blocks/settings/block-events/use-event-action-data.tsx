import { computed } from "mobx";
import { useMemo } from "react";
import { useBlocks } from "@semoss/renderer";

export const useEventActionData = (queryId: string) => {
	const { state } = useBlocks();

	const notebooks = useMemo(() => {
		return Object.values(state.notebooks).sort((a, b) => {
			const aId = a.id.toLowerCase();
			const bId = b.id.toLowerCase();
			return aId < bId ? -1 : aId > bId ? 1 : 0;
		});
	}, [state.notebooks]);

	const cells = useMemo(() => {
		if (!queryId) return [];

		return computed(() => {
			const notebook = state.notebooks[queryId];
			if (!notebook) return [];

			return notebook.list.map((cellId) => notebook.cells[cellId]);
		}).get();
	}, [queryId, state.notebooks]);

	const pages = useMemo(() => {
		return state.getAllBlocksOfType("page").map((page) => ({
			id: page.id,
			route: page.data.route,
		}));
	}, [state]);

	return { notebooks, cells, pages };
};
