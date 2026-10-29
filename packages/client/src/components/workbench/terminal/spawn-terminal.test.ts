import { describe, expect, it } from "vitest";
import type { WorkbenchLayout } from "@semoss/workbench";
import { createWorkbenchStore } from "@semoss/workbench";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench/workbench.constants";
import { spawnTerminal } from "./spawn-terminal";

const TERMINAL = WORKBENCH_COMPONENTS.TERMINAL;

/** A dock holding one terminal, in the bottom border or the main tabset. */
const makeStore = (terminalIn: "bottom" | "main") => {
	const layout: WorkbenchLayout = {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: terminalIn === "main" ? [TERMINAL] : [],
			activeId: terminalIn === "main" ? TERMINAL : null,
		},
		panels: {
			[WORKBENCH_PANEL_RECORDS.TERMINAL.id]:
				WORKBENCH_PANEL_RECORDS.TERMINAL,
		},
		borders: {
			bottom: {
				panelIds: terminalIn === "bottom" ? [TERMINAL] : [],
				activeId: null,
				size: 300,
			},
		},
	};
	const store = createWorkbenchStore({
		components: { [TERMINAL]: { name: "Terminal", content: () => null } },
	});
	store.getState().layout.actions.loadSnapshot(layout);
	return store;
};

describe("spawnTerminal", () => {
	it("opens beside a terminal in a border, numbered after the open ones", () => {
		const store = makeStore("bottom");

		const second = spawnTerminal(
			store.getState().layout,
			TERMINAL,
			TERMINAL,
		);
		const third = spawnTerminal(store.getState().layout, TERMINAL, second);

		const { borders, panels } = store.getState().layout;
		expect(borders.bottom.panelIds).toEqual([TERMINAL, second, third]);
		expect(panels[second]).toMatchObject({
			type: TERMINAL,
			name: "Terminal 2",
			canClose: true,
			config: { terminalNumber: 2 },
		});
		expect(panels[third]).toMatchObject({
			name: "Terminal 3",
			config: { terminalNumber: 3 },
		});
	});

	it("joins the tabset a terminal was moved into", () => {
		const store = makeStore("main");

		const second = spawnTerminal(
			store.getState().layout,
			TERMINAL,
			TERMINAL,
		);

		const { borders, tabsets } = store.getState().layout;
		expect(
			tabsets.find((tabset) => tabset.id === "main")?.panelIds,
		).toEqual([TERMINAL, second]);
		expect(borders.bottom.panelIds).toEqual([]);
	});

	it("opens in the bottom border with no terminal to open beside", () => {
		const store = makeStore("main");

		const second = spawnTerminal(store.getState().layout, TERMINAL);

		expect(store.getState().layout.borders.bottom.panelIds).toEqual([
			second,
		]);
	});

	it("carries the numbering on past a restored terminal", () => {
		const store = makeStore("bottom");
		const restored = store.getState().layout.actions.spawnPanel(TERMINAL, {
			name: "Terminal 4",
			config: { terminalNumber: 4 },
			target: { kind: "border", side: "bottom" },
		});

		const next = spawnTerminal(store.getState().layout, TERMINAL, restored);

		expect(store.getState().layout.panels[next]).toMatchObject({
			name: "Terminal 5",
			config: { terminalNumber: 5 },
		});
	});
});
