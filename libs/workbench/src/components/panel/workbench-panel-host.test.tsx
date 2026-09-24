import { act, fireEvent, render, screen } from "@testing-library/react";
import { type FC, useEffect, useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { WorkbenchStoreContext } from "../../contexts/workbench.context";
import { createWorkbenchStore } from "../../stores/workbench.store";
import type {
	WorkbenchPanelConfigAny,
	WorkbenchPanelProps,
	WorkbenchSnapshot,
} from "../../types";
import { WorkbenchPanelHost } from "./workbench-panel-host";

const PANEL_TYPE = "STATEFUL";
const PANEL_ID = "stateful-panel";
const TABSET_ID = "main";

let mountCount = 0;
let unmountCount = 0;

const StatefulPanel: FC<WorkbenchPanelProps> = () => {
	const [count, setCount] = useState(0);

	useEffect(() => {
		mountCount += 1;
		return () => {
			unmountCount += 1;
		};
	}, []);

	return (
		<button
			type="button"
			onClick={() => setCount((current) => current + 1)}
		>
			Count {count}
		</button>
	);
};

const COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[PANEL_TYPE]: {
		name: "Stateful",
		content: StatefulPanel,
	},
};

const SNAPSHOT: WorkbenchSnapshot = {
	tree: {
		type: "tabset",
		id: TABSET_ID,
		size: 1,
		panelIds: [PANEL_ID],
		activeId: PANEL_ID,
		split: { dir: "row", ratio: 0.5 },
	},
	panels: {
		[PANEL_ID]: {
			id: PANEL_ID,
			type: PANEL_TYPE,
			name: "Stateful",
		},
	},
	selectedPanelId: PANEL_ID,
};

const rect = (
	left: number,
	top: number,
	width: number,
	height: number,
): DOMRect => ({
	x: left,
	y: top,
	left,
	top,
	right: left + width,
	bottom: top + height,
	width,
	height,
	toJSON: () => ({}),
});

describe("WorkbenchPanelHost maximize geometry", () => {
	beforeEach(() => {
		mountCount = 0;
		unmountCount = 0;
	});

	it("switches maximized bodies to viewport geometry and restores without remounting", () => {
		const store = createWorkbenchStore({ components: COMPONENTS });
		const actions = store.getState().layout.actions;
		actions.loadSnapshot(SNAPSHOT);

		const root = document.createElement("div");
		const primarySlot = document.createElement("div");
		const secondarySlot = document.createElement("div");
		primarySlot.dataset.radius = "0.5rem";
		secondarySlot.dataset.radius = "0.5rem";
		root.append(primarySlot, secondarySlot);
		document.body.append(root);

		root.getBoundingClientRect = () => rect(100, 200, 800, 600);
		primarySlot.getBoundingClientRect = () =>
			store.getState().layout.maximizedTabsetId
				? rect(16, 48, 340, 500)
				: rect(116, 248, 340, 500);
		secondarySlot.getBoundingClientRect = () =>
			store.getState().layout.maximizedTabsetId
				? rect(376, 48, 340, 500)
				: rect(476, 248, 340, 500);

		actions.registerRootElement(root);
		actions.registerSlotElement(TABSET_ID, primarySlot);
		actions.registerSlotElement(`${TABSET_ID}::b`, secondarySlot);
		actions.measureSlots();

		const normalRects = store.getState().layout.slotRects;
		expect(normalRects[TABSET_ID]).toMatchObject({
			left: 16,
			top: 48,
			width: 340,
			height: 500,
			coordinateMode: "root",
		});
		expect(normalRects[`${TABSET_ID}::b`]).toMatchObject({
			left: 376,
			coordinateMode: "root",
		});

		const view = render(
			<WorkbenchStoreContext.Provider value={store}>
				<WorkbenchPanelHost pid={PANEL_ID} />
			</WorkbenchStoreContext.Provider>,
		);
		const host = screen.getByTestId(`workbench-panel-host-${PANEL_ID}`);
		expect(host).toHaveStyle({
			position: "absolute",
			left: "16px",
			top: "48px",
			width: "340px",
			height: "500px",
		});

		fireEvent.click(screen.getByRole("button", { name: "Count 0" }));
		expect(screen.getByRole("button", { name: "Count 1" })).toBeVisible();

		act(() => {
			actions.toggleMaximize(TABSET_ID);
			actions.measureSlots();
		});

		const maximizedRects = store.getState().layout.slotRects;
		expect(maximizedRects[TABSET_ID]).toMatchObject({
			left: 16,
			top: 48,
			width: 340,
			height: 500,
			coordinateMode: "viewport",
		});
		expect(maximizedRects[`${TABSET_ID}::b`]).toMatchObject({
			left: 376,
			coordinateMode: "viewport",
		});
		expect(maximizedRects[TABSET_ID]).not.toBe(normalRects[TABSET_ID]);
		expect(host).toHaveStyle({ position: "fixed" });
		expect(screen.getByRole("button", { name: "Count 1" })).toBeVisible();
		expect(mountCount).toBe(1);
		expect(unmountCount).toBe(0);

		act(() => {
			actions.toggleMaximize(TABSET_ID);
			actions.measureSlots();
		});

		const restoredRects = store.getState().layout.slotRects;
		expect(restoredRects[TABSET_ID]).toMatchObject({
			left: 16,
			top: 48,
			width: 340,
			height: 500,
			coordinateMode: "root",
		});
		expect(restoredRects[`${TABSET_ID}::b`]).toMatchObject({
			left: 376,
			coordinateMode: "root",
		});
		expect(restoredRects[TABSET_ID]).not.toBe(maximizedRects[TABSET_ID]);
		expect(host).toHaveStyle({ position: "absolute" });
		expect(screen.getByRole("button", { name: "Count 1" })).toBeVisible();
		expect(mountCount).toBe(1);
		expect(unmountCount).toBe(0);

		view.unmount();
		actions.registerRootElement(null);
		root.remove();
	});
});
