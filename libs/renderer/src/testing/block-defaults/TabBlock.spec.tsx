import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { TabBlock } from "../../components/block-defaults/tab-block/TabBlock";
import { render } from "../utils";

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
		const { container, getByText } = render(
			<TabBlock id={blocks.basicTab.id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector("[data-block='basicTab']");
		expect(element).toBeInTheDocument();

		expect(getByText("Tab 1")).toBeInTheDocument();
		expect(getByText("Tab 2")).toBeInTheDocument();
		expect(getByText("Tab 3")).toBeInTheDocument();
	});

	it("applies styling correctly including orientation and custom styles", () => {
		const { container } = render(<TabBlock id={blocks.verticalTab.id} />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='verticalTab']");
		expect(element).toHaveStyle({
			width: "300px",
			height: "400px",
		});

		const tabsContainer = container.querySelector(
			"[data-slot='tabs']",
		) as HTMLElement;
		expect(tabsContainer).toBeInTheDocument();
		expect(tabsContainer).toHaveAttribute("data-orientation", "vertical");
	});

	it("handles tab indicator visibility correctly", () => {
		const { container: basicContainer } = render(
			<TabBlock id={blocks.basicTab.id} />,
			{
				blocks: blocks,
			},
		);

		const tabsList = basicContainer.querySelector(
			"[data-slot='tabs-list']",
		) as HTMLElement;
		expect(tabsList).toBeInTheDocument();

		const activeTrigger = basicContainer.querySelector(
			"[data-slot='tabs-trigger'][data-state='active']",
		) as HTMLElement;
		expect(activeTrigger).toBeInTheDocument();
	});

	it("sets the correct initial active tab", () => {
		const { container } = render(<TabBlock id={blocks.basicTab.id} />, {
			blocks: blocks,
		});

		const activeTrigger = container.querySelector(
			"[data-slot='tabs-trigger'][data-state='active']",
		) as HTMLElement;
		expect(activeTrigger).toBeInTheDocument();
		expect(activeTrigger.textContent).toBe("Tab 1");

		const activeContent = container.querySelector(
			"[data-slot='tabs-content'][data-state='active']",
		) as HTMLElement;
		expect(activeContent).toBeInTheDocument();
	});
});
