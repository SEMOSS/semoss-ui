import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { VisualizationFilterBlock } from "../../components/block-defaults/visualization-filter-block/VisualizationFilterBlock";
import { render } from "../utils";

class ResizeObserverMock {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const mockState = {
	runSideEffect: vi.fn().mockResolvedValue({
		pixelReturn: [
			{ output: { data: { values: [["Option 1"], ["Option 2"]] } } },
		],
	}),
};

vi.mock("@semoss/ui/next", async () => ({
	...(await vi.importActual("@semoss/ui/next")),
	toast: {
		error: vi.fn(),
		warning: vi.fn(),
		success: vi.fn(),
	},
}));

vi.mock("../../../hooks", () => ({
	useBlock: (id: string) => {
		const blockData = (
			blocks as Record<string, typeof blocks.dropdownFilter>
		)[id];
		return {
			attrs: { "data-block": id },
			data: blockData.data,
			setData: vi.fn(),
			listeners: blockData.listeners,
		};
	},
	useBlocks: () => ({ state: mockState }),
}));

const createBlock = (
	id: string,
	overrides: Partial<typeof defaultData> = {},
) => ({
	id,
	widget: "visualization-filter",
	data: {
		...defaultData,
		...overrides,
	},
	listeners: { preProcess: { type: "sync", order: [] } },
	slots: {},
});

const defaultData = {
	style: { padding: "4px" },
	frame: ["testFrame"],
	column: "testColumn",
	displayType: "Dropdown",
	showPanelTitle: true,
	searchable: false,
	multipleSelection: false,
	show: "true",
	filterLabel: "",
	sliderSensitivity: 0,
	listOptions: ["Option 1", "Option 2"],
	selectedValues: [],
	color: "primary",
	size: "medium",
};

const blocks = {
	dropdownFilter: createBlock("dropdownFilter", {
		showPanelTitle: true,
		searchable: true,
	}),
	sliderFilter: createBlock("sliderFilter", {
		displayType: "Slider",
		column: "numericColumn",
		listOptions: ["1", "10", "20"],
	}),
	checklistFilter: createBlock("checklistFilter", {
		displayType: "Checklist",
		showPanelTitle: false,
		searchable: true,
		column: "categoryColumn",
	}),
	multiselectFilter: createBlock("multiselectFilter", {
		displayType: "Multiselect",
		column: "tagsColumn",
	}),
	emptyFilter: createBlock("emptyFilter", {
		listOptions: [],
		showPanelTitle: false,
	}),
};

describe("VisualizationFilterBlock", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders dropdown filter with title and options", () => {
		const { container } = render(
			<VisualizationFilterBlock id={blocks.dropdownFilter.id} />,
			{ blocks },
		);

		const element = container.querySelector(
			"[data-block='dropdownFilter']",
		);
		expect(element).toBeInTheDocument();
		expect(screen.getByText("Filter by testColumn")).toBeInTheDocument();
		expect(element?.querySelector("div")).toBeInTheDocument();
	});

	it("renders slider filter correctly", () => {
		const { container } = render(
			<VisualizationFilterBlock id={blocks.sliderFilter.id} />,
			{ blocks },
		);

		expect(
			container.querySelector("[data-block='sliderFilter']"),
		).toBeInTheDocument();
		expect(screen.getByText("Filter by numericColumn")).toBeInTheDocument();
	});

	it("renders checklist filter without title when showPanelTitle is false", () => {
		const { container } = render(
			<VisualizationFilterBlock id={blocks.checklistFilter.id} />,
			{ blocks },
		);

		expect(
			container.querySelector("[data-block='checklistFilter']"),
		).toBeInTheDocument();
		expect(
			screen.queryByText("Filter by categoryColumn"),
		).not.toBeInTheDocument();
	});

	it("renders multiselect filter with title", () => {
		const { container } = render(
			<VisualizationFilterBlock id={blocks.multiselectFilter.id} />,
			{ blocks },
		);

		expect(
			container.querySelector("[data-block='multiselectFilter']"),
		).toBeInTheDocument();
		expect(screen.getByText("Filter by tagsColumn")).toBeInTheDocument();
	});

	it("handles empty filter options gracefully", () => {
		const { container } = render(
			<VisualizationFilterBlock id={blocks.emptyFilter.id} />,
			{ blocks },
		);

		expect(
			container.querySelector("[data-block='emptyFilter']"),
		).toBeInTheDocument();
	});

	it("applies custom styles", () => {
		const { container } = render(
			<VisualizationFilterBlock id={blocks.checklistFilter.id} />,
			{ blocks },
		);

		expect(
			container.querySelector("[data-block='checklistFilter']"),
		).toHaveStyle({ padding: "4px" });
	});

	it("renders all display types correctly", () => {
		const testCases = [
			{ id: "dropdownFilter" },
			{ id: "sliderFilter" },
			{ id: "checklistFilter" },
			{ id: "multiselectFilter" },
		];

		testCases.forEach(({ id }) => {
			const { container } = render(
				<VisualizationFilterBlock
					id={
						(
							blocks as Record<
								string,
								typeof blocks.dropdownFilter
							>
						)[id].id
					}
				/>,
				{ blocks },
			);
			expect(
				container.querySelector(`[data-block='${id}']`),
			).toBeInTheDocument();
		});
	});
});
