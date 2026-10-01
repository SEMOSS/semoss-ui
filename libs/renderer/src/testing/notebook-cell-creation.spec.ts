import { describe, expect, it } from "vitest";
import type { CellStateConfig } from "../store/state/cell.state";
import { ActionMessages } from "../store/state/state.actions";
import { StateStore } from "../store/state/state.store";
import type { Variable } from "../store/state/state.types";

const queryId = "mcp_driver";
const codeCell = (id: string, code: string): CellStateConfig => ({
	id,
	widget: "code",
	parameters: { type: "pixel", code },
});

function createStore(
	cells: CellStateConfig[] = [],
	variables: Record<string, Variable> = {},
) {
	return new StateStore({
		mode: "interactive",
		insightId: "test-insight",
		cellRegistry: {},
		state: {
			version: "1",
			executionOrder: [],
			blocks: {},
			queries: { [queryId]: { id: queryId, cells } },
			variables,
		},
	});
}

async function addCell(state: StateStore, previousCellId = "", code = "") {
	const cellId = await state.dispatch({
		message: ActionMessages.NEW_CELL,
		payload: {
			queryId,
			previousCellId,
			config: { widget: "code", parameters: { type: "pixel", code } },
		},
	});
	if (typeof cellId !== "string") {
		throw new Error(
			"Creating a cell must return its ID for naming and selection",
		);
	}
	await state.dispatch({
		message: ActionMessages.ADD_VARIABLE,
		payload: {
			id: `${queryId}--${cellId}`,
			type: "cell",
			to: queryId,
			cellId,
		},
	});
	return cellId;
}

describe("notebook cell creation", () => {
	it("returns the first cell ID so an empty notebook gets a usable name", async () => {
		const state = createStore();
		const cellId = await addCell(state);

		expect(cellId).toBe("1");
		expect(state.notebooks[queryId].list).toEqual([cellId]);
		expect(state.getAlias(queryId, cellId)).toBe("mcp_driver--1");
		expect(state.variables["mcp_driver--1"]).toEqual({
			type: "cell",
			to: queryId,
			cellId: "1",
		});
	});

	it("keeps the first cell's code and name when the second cell is inserted", async () => {
		const state = createStore();
		const firstId = await addCell(state, "", "2+2");
		const secondId = await addCell(state, firstId, "3+3");

		expect(secondId).not.toBe(firstId);
		expect(state.notebooks[queryId].list).toEqual([firstId, secondId]);
		expect(state.notebooks[queryId].cells[firstId].parameters.code).toBe(
			"2+2",
		);
		expect(state.notebooks[queryId].cells[secondId].parameters.code).toBe(
			"3+3",
		);
		expect(state.getAlias(queryId, firstId)).toBe(`${queryId}--${firstId}`);
		expect(state.getAlias(queryId, secondId)).toBe(
			`${queryId}--${secondId}`,
		);
	});

	it.each(["", "missing"])(
		"appends unique cells when the previous cell is %j",
		async (previousCellId) => {
			const state = createStore([codeCell("4", "4+4")]);
			const firstId = await addCell(state, previousCellId);
			const secondId = await addCell(state, previousCellId);

			expect(state.notebooks[queryId].list).toEqual(["4", "5", "6"]);
			expect(firstId).toBe("5");
			expect(secondId).toBe("6");
			expect(Object.keys(state.notebooks[queryId].cells)).toHaveLength(3);
		},
	);

	it("can name a cell after all cells have been deleted without reusing an ID", async () => {
		const state = createStore();
		const firstId = await addCell(state);
		await state.dispatch({
			message: ActionMessages.DELETE_CELL,
			payload: { queryId, cellId: firstId },
		});
		const nextId = await addCell(state);

		expect(nextId).toBe("2");
		expect(state.notebooks[queryId].list).toEqual([nextId]);
		expect(state.getAlias(queryId, nextId)).toBe(`${queryId}--${nextId}`);
		expect(state.variables[`${queryId}--${firstId}`]).toBeUndefined();
	});

	it("preserves saved cell IDs and custom aliases when inserting into a loaded notebook", async () => {
		const cells = [codeCell("4", "4+4"), codeCell("9", "9+9")];
		const state = createStore(cells, {
			custom_name: { type: "cell", to: queryId, cellId: "4" },
		});
		const cellId = await addCell(state, "4");

		expect(cellId).toBe("10");
		expect(state.notebooks[queryId].list).toEqual(["4", "10", "9"]);
		expect(state.getAlias(queryId, "4")).toBe("custom_name");
		expect(
			state
				.toJSON()
				.queries[queryId].cells.filter((cell) => cell.id !== cellId),
		).toEqual(cells);
	});
});
