import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { fireEvent, waitFor } from "@testing-library/react";
import { TabBlock } from "../../components/block-defaults/tab-block/TabBlock";
import { render, screen } from "../utils";

const blocks = {
	basicTab: {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
			},
			activeTab: 1,
			tabOrientation: "horizontal" as const,
			showTabIndicator: true,
			textColor: "primary" as const,
			indicatorColor: "primary" as const,
			variant: "standard" as const,
			tabLabels: ["Tab 1", "Tab 2", "Tab 3"],
		},
		id: "basicTab",
		widget: "tab",
		slots: {
			"1": {
				name: "1",
				children: [],
			},
			"2": {
				name: "2",
				children: [],
			},
			"3": {
				name: "3",
				children: [],
			},
		},
		listeners: {
			preProcess: {
				type: "sync" as const,
				order: [],
			},
			onChange: {
				type: "sync" as const,
				order: [],
			},
		},
	},

	verticalTab: {
		data: {
			style: {
				width: "300px",
				height: "400px",
			},
			activeTab: 2,
			tabOrientation: "vertical" as const,
			showTabIndicator: false,
			textColor: "secondary" as const,
			indicatorColor: "secondary" as const,
			variant: "fullWidth" as const,
			tabLabels: ["First", "Second"],
		},
		id: "verticalTab",
		widget: "tab",
		slots: {
			"1": {
				name: "1",
				children: [],
			},
			"2": {
				name: "2",
				children: [],
			},
		},
		listeners: {
			preProcess: {
				type: "sync" as const,
				order: [],
			},
			onChange: {
				type: "sync" as const,
				order: [],
			},
		},
	},
};

describe("tab block", () => {
	it("renders tab block with correct structure, labels, and content visibility", () => {
		// biome-ignore lint/correctness/useUniqueElementIds: Test uses static ID that matches test data
		const { container } = render(<TabBlock id="basicTab" />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='basicTab']");
		expect(element).toBeInTheDocument();

		expect(screen.getByText("Tab 1")).toBeInTheDocument();
		expect(screen.getByText("Tab 2")).toBeInTheDocument();
		expect(screen.getByText("Tab 3")).toBeInTheDocument();
	});

	it("applies styling correctly including orientation and custom styles", () => {
		// biome-ignore lint/correctness/useUniqueElementIds: Test uses static ID that matches test data
		const { container } = render(<TabBlock id="verticalTab" />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='verticalTab']");
		expect(element).toHaveStyle({
			width: "300px",
			height: "400px",
		});

		const tabsContainer = container.querySelector(".MuiTabs-root");
		expect(tabsContainer).toHaveClass("MuiTabs-vertical");
	});

	it("handles tab indicator visibility correctly", () => {
		const { container: basicContainer } = render(
			// biome-ignore lint/correctness/useUniqueElementIds: Test uses static ID that matches test data
			<TabBlock id="basicTab" />,
			{
				blocks: blocks,
			},
		);

		const shownIndicator =
			basicContainer.querySelector(".MuiTabs-indicator");
		expect(shownIndicator).toHaveStyle({ display: "block" });

		const { container: verticalContainer } = render(
			// biome-ignore lint/correctness/useUniqueElementIds: Test uses static ID that matches test data
			<TabBlock id="verticalTab" />,
			{
				blocks: blocks,
			},
		);

		const hiddenIndicator =
			verticalContainer.querySelector(".MuiTabs-indicator");
		expect(hiddenIndicator).toHaveStyle({ display: "none" });
	});

	it("switches tabs correctly when clicked", async () => {
		// biome-ignore lint/correctness/useUniqueElementIds: Test uses static ID that matches test data
		const { container } = render(<TabBlock id="basicTab" />, {
			blocks: blocks,
		});

		const tab2 = screen.getByText("Tab 2");
		fireEvent.click(tab2);

		await waitFor(() => {
			const activeTabPanel = container.querySelector(
				"[id='simple-tabpanel-2']:not([hidden])",
			);
			expect(activeTabPanel).toBeInTheDocument();
		});
	});
});
