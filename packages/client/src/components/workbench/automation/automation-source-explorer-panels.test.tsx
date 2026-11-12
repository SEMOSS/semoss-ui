import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AUTOMATION_SOURCE_EXPLORER_FULL,
	AutomationSourceExplorerDockedPanel,
	AutomationSourceExplorerFullPanel,
} from "./automation-source-explorer-panels";

const mocks = vi.hoisted(() => ({
	selectPanel: vi.fn(),
	sourceExplorerPanel: vi.fn(),
	state: {
		layout: {
			actions: { selectPanel: vi.fn() },
			openPanelIds: [] as string[],
			panels: {} as Record<string, { type: string }>,
		},
	},
}));

vi.mock("@semoss/automation", () => ({
	AutomationSourceExplorerPanel: (props: { fullView?: boolean }) => {
		mocks.sourceExplorerPanel(props);
		return <div data-testid="source-explorer" />;
	},
}));

vi.mock("@semoss/workbench", () => ({
	useWorkbench: (selector: (state: typeof mocks.state) => unknown) =>
		selector(mocks.state),
}));

describe("Automation Source Explorer workbench panels", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.state.layout.actions.selectPanel = mocks.selectPanel;
		mocks.state.layout.openPanelIds = [];
		mocks.state.layout.panels = {};
	});

	afterEach(cleanup);

	it("renders the explorer in the dock when no full view exists", () => {
		render(
			<AutomationSourceExplorerDockedPanel id={crypto.randomUUID()} />,
		);

		expect(screen.getByTestId("source-explorer")).toBeInTheDocument();
		expect(mocks.sourceExplorerPanel).toHaveBeenCalledWith({});
	});

	it("replaces the docked explorer while the full view exists", () => {
		mocks.state.layout.openPanelIds = ["full-instance"];
		mocks.state.layout.panels = {
			"full-instance": { type: AUTOMATION_SOURCE_EXPLORER_FULL },
		};

		render(
			<AutomationSourceExplorerDockedPanel id={crypto.randomUUID()} />,
		);

		expect(screen.queryByTestId("source-explorer")).not.toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("button", { name: "Focus full view" }),
		);
		expect(mocks.selectPanel).toHaveBeenCalledWith(
			AUTOMATION_SOURCE_EXPLORER_FULL,
		);
	});

	it("marks the main explorer as full view", () => {
		render(<AutomationSourceExplorerFullPanel id={crypto.randomUUID()} />);

		expect(screen.getByTestId("source-explorer")).toBeInTheDocument();
		expect(mocks.sourceExplorerPanel).toHaveBeenCalledWith({
			fullView: true,
		});
	});
});
