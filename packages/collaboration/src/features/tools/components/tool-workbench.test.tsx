import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { useId } from "react";
import { FILE_PANEL_COMPONENTS, FILE_PANEL_TYPES } from "@semoss/panels";
import { useToolWorkbench } from "../tool-workbench.context";
import type { ToolWorkbenchContextValue } from "../types/tool-workbench";
import { ToolWorkbench } from "./tool-workbench";
import { ToolWorkbenchProvider } from "./tool-workbench-provider";

const components = {
	[FILE_PANEL_TYPES.FILE_EXPLORER]: {
		...FILE_PANEL_COMPONENTS[FILE_PANEL_TYPES.FILE_EXPLORER],
		content: () => <p>Room files</p>,
	},
};
let workbench: ToolWorkbenchContextValue;

function Harness() {
	workbench = useToolWorkbench();
	const triggerId = useId();
	return (
		<>
			<button
				type="button"
				id={triggerId}
				onClick={() => workbench.openWorkbench(undefined, triggerId)}
			>
				Open dock
			</button>
			<button type="button" onClick={workbench.closeWorkbench}>
				Close dock
			</button>
			<div hidden={!workbench.isOpen}>
				<ToolWorkbench />
			</div>
		</>
	);
}

function setup() {
	render(
		<ToolWorkbenchProvider
			roomId="room-1"
			insightId="bound-room-insight"
			tools={{}}
			pendingApprovals={[]}
			components={components}
			autoReveal={false}
			onApproveTool={vi.fn()}
			onRejectTool={vi.fn()}
		>
			<Harness />
		</ToolWorkbenchProvider>,
	);
	expect(
		screen.queryByRole("button", { name: "File" }),
	).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Open dock" }));
}

beforeEach(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	});
});

it("opens room files from the rail without a redundant File bar", async () => {
	setup();
	expect(
		screen.queryByRole("button", { name: "File" }),
	).not.toBeInTheDocument();
	expect(
		screen.queryByTestId("workbench-border-top"),
	).not.toBeInTheDocument();
	expect(workbench.store.getState().layout.borders.left.activeId).toBeNull();
	fireEvent.keyDown(screen.getByRole("tab", { name: "Files" }), {
		key: "Enter",
	});
	await waitFor(() =>
		expect(workbench.store.getState().layout.borders.left.activeId).toBe(
			FILE_PANEL_TYPES.FILE_EXPLORER,
		),
	);
	expect(
		workbench.store.getState().layout.panels[FILE_PANEL_TYPES.FILE_EXPLORER]
			.config,
	).toMatchObject({
		mode: { type: "INSIGHT", insightId: "bound-room-insight" },
	});
	fireEvent.keyDown(screen.getByRole("tab", { name: "Files" }), {
		key: "Enter",
	});
	fireEvent.keyDown(screen.getByRole("tab", { name: "Files" }), {
		key: "Enter",
	});
	expect(workbench.store.getState().layout.borders.left.activeId).toBe(
		FILE_PANEL_TYPES.FILE_EXPLORER,
	);
	expect(
		workbench.store.getState().layout.borders.left.panelIds,
	).toHaveLength(1);
});

it("returns focus to the composer after hiding the dock", async () => {
	setup();
	fireEvent.click(screen.getByRole("button", { name: "Close dock" }));
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Open dock" })).toHaveFocus(),
	);
});

it("suspends workbench shortcuts while hidden and restores them on reopening", async () => {
	setup();
	fireEvent.click(screen.getByRole("button", { name: "Close dock" }));
	fireEvent.keyDown(window, { key: "F1" });
	fireEvent.keyDown(window, { key: "m", ctrlKey: true });
	expect(workbench.store.getState().command.isCommandOpen).toBe(false);
	expect(workbench.store.getState().layout.maximizedTabsetId).toBeFalsy();
	fireEvent.click(screen.getByRole("button", { name: "Open dock" }));
	fireEvent.keyDown(window, { key: "F1" });
	expect(workbench.store.getState().command.isCommandOpen).toBe(true);
	expect(await screen.findByRole("dialog")).toBeVisible();
});

it("opens the command palette from the icon at the bottom of the left rail", async () => {
	setup();
	const button = screen.getByRole("button", { name: "Open command palette" });
	expect(button.closest('[data-rail="left"]')).not.toBeNull();
	fireEvent.click(button);
	expect(await screen.findByRole("dialog")).toBeVisible();
});

it("focuses the mobile back control after revealing a retained dock", async () => {
	const width = window.innerWidth;
	Object.defineProperty(window, "innerWidth", {
		configurable: true,
		value: 360,
	});
	try {
		setup();
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Back to conversation" }),
			).toHaveFocus(),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Back to conversation" }),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Open dock" }),
			).toHaveFocus(),
		);
		fireEvent.click(screen.getByRole("button", { name: "Open dock" }));
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Back to conversation" }),
			).toHaveFocus(),
		);
	} finally {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: width,
		});
	}
});

it("uses compact navigation when its container is narrow on a desktop viewport", async () => {
	const observers = new Map<Element, () => void>();
	const originalObserver = Object.getOwnPropertyDescriptor(
		globalThis,
		"ResizeObserver",
	);
	class MeasuredObserver {
		constructor(private callback: ResizeObserverCallback) {}
		observe(element: Element) {
			observers.set(element, () =>
				this.callback([], this as unknown as ResizeObserver),
			);
		}
		unobserve(element: Element) {
			observers.delete(element);
		}
		disconnect() {}
	}
	Object.defineProperty(globalThis, "ResizeObserver", {
		configurable: true,
		value: MeasuredObserver,
	});
	try {
		setup();
		const dock = screen.getByLabelText("Workbench panels");
		let width = 600;
		vi.spyOn(dock, "getBoundingClientRect").mockImplementation(() => ({
			width,
			height: 500,
			x: 0,
			y: 0,
			left: 0,
			top: 0,
			right: width,
			bottom: 500,
			toJSON: () => ({}),
		}));
		act(() => observers.get(dock)?.());
		await waitFor(() =>
			expect(workbench.store.getState().layout.isMobileLayout).toBe(true),
		);
		expect(
			screen.getByRole("button", { name: "Back to conversation" }),
		).toBeVisible();
		width = 800;
		act(() => observers.get(dock)?.());
		await waitFor(() =>
			expect(workbench.store.getState().layout.isMobileLayout).toBe(
				false,
			),
		);
		expect(
			screen.queryByRole("button", { name: "Back to conversation" }),
		).not.toBeInTheDocument();
	} finally {
		if (originalObserver) {
			Object.defineProperty(
				globalThis,
				"ResizeObserver",
				originalObserver,
			);
		}
	}
});
