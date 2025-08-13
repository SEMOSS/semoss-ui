import { computed } from "mobx";
import { useMemo } from "react";
import { useBlocks } from "@semoss/renderer";

export const useEventActionData = (queryId: string) => {
	const { state } = useBlocks();

	const queries = useMemo(() => {
		return Object.values(state.queries).sort((a, b) => {
			const aId = a.id.toLowerCase();
			const bId = b.id.toLowerCase();
			return aId < bId ? -1 : aId > bId ? 1 : 0;
		});
	}, [state.queries]);

	const cells = useMemo(() => {
		if (!queryId) return [];

		return computed(() => {
			const query = state.queries[queryId];
			if (!query) return [];

			return query.list.map((cellId) => query.cells[cellId]);
		}).get();
	}, [queryId, state.queries]);

	const pages = useMemo(() => {
		return state.getAllBlocksOfType("page").map((page) => ({
			id: page.id,
			route: page.data.route,
		}));
	}, [state]);

	return { queries, cells, pages };
};
