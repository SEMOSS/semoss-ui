import { screen } from "@testing-library/react";
import * as reactVega from "react-vega";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { VisualizationBlock } from "../../components/block-defaults/echart-visualization-block";
import {
	VegaVisualizationBlock,
	type VegaVisualizationBlockDef,
} from "../../components/block-defaults/vega-visualization-block/VegaVisualizationBlock";
import { useBlock } from "../../hooks";
import { render, renderHook } from "../utils";

// Mock clientWidth/clientHeight for consistent rendering (like GanttChartBlock)
beforeAll(() => {
	Object.defineProperty(HTMLElement.prototype, "clientWidth", {
		configurable: true,
		value: 300,
	});
	Object.defineProperty(HTMLElement.prototype, "clientHeight", {
		configurable: true,
		value: 300,
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

// Minimal mock for Area Chart block
const mockBlocks = {
	areaChart: {
		id: "areaChart",
		widget: "vega",
		data: {
			variation: "area-chart",
			specJson: JSON.stringify({
				$schema: "https://vega.github.io/schema/vega-lite/v5.json",
				title: "Area Chart",
				width: 300,
				height: 300,
				data: {
					values: [
						{ a: "A", b: 28 },
						{ a: "B", b: 55 },
						{ a: "D", b: 91 },
						{ a: "E", b: 81 },
						{ a: "E", b: 81 },
						{ a: "G", b: 19 },
						{ a: "H", b: 87 },
					],
				},
				mark: "area",
				encoding: {
					x: { field: "a" },
					y: { aggregate: "sum", field: "b", title: "count" },
				},
			}),
		},
		listeners: {},
		slots: {},
	},
	areaChartNoSpec: {
		id: "areaChartNoSpec",
		widget: "vega",
		data: {
			variation: "area-chart",
			specJson: "",
		},
		listeners: {},
		slots: {},
	},
	areaChartInvalidSpec: {
		id: "areaChartInvalidSpec",
		widget: "vega",
		data: {
			variation: "area-chart",
			specJson: "{invalid: true,}", // invalid JSON
		},
		listeners: {},
		slots: {},
	},
};

const placeholders = {
	areaChart: "areaChart",
	areaChartNoSpec: "areaChartNoSpec",
	areaChartInvalidSpec: "areaChartInvalidSpec",
};

describe("AreaChart Block Component", () => {
	it("should use useBlock hook", async () => {
		const { result } = renderHook(
			() => useBlock<VegaVisualizationBlockDef>("areaChart"),
			{
				blocks: mockBlocks,
				renderEngineId: placeholders.areaChart,
			},
		);
		expect(result.current).toBeDefined();
		expect(result.current.data.variation).toBe("area-chart");
	});
	it("should render Area Chart block", () => {
		const { container } = render(
			<VegaVisualizationBlock id={placeholders.areaChart} />,
			{
				blocks: mockBlocks,
			},
		);
		const areaChart = container.querySelector("[data-block='areaChart']");
		expect(areaChart).toBeInTheDocument();
	});

	it("should render data correctly", () => {
		const { result } = renderHook(
			() => useBlock<VegaVisualizationBlockDef>("areaChart"),
			{
				blocks: mockBlocks,
				renderEngineId: placeholders.areaChart,
			},
		);
		const spec = JSON.parse(result.current.data.specJson as string);

		// Check that the data values match expected
		expect(spec.data.values).toEqual([
			{ a: "A", b: 28 },
			{ a: "B", b: 55 },
			{ a: "D", b: 91 },
			{ a: "E", b: 81 },
			{ a: "E", b: 81 },
			{ a: "G", b: 19 },
			{ a: "H", b: 87 },
		]);
	});

	it("should show Add JSON message if no json present", () => {
		const { container } = render(
			<VisualizationBlock id={placeholders.areaChartNoSpec} />,
			{
				blocks: mockBlocks,
			},
		);
		const areaChartBlock = container.querySelector(
			"[data-block='areaChartNoSpec']",
		);
		expect(areaChartBlock).toBeInTheDocument();
		expect(
			screen.getByText("Add JSON to render your visualization"),
		).toBeInTheDocument();
	});
	it("passes the chart dimensions to Vega", () => {
		const createChart = vi.spyOn(reactVega, "createClassFromSpec");
		render(<VegaVisualizationBlock id={placeholders.areaChart} />, {
			blocks: mockBlocks,
		});
		expect(createChart).toHaveBeenCalledWith(
			expect.objectContaining({
				spec: expect.objectContaining({ width: 300, height: 300 }),
			}),
		);
	});
	it("should show error message for invalid JSON spec", () => {
		const { container } = render(
			<VegaVisualizationBlock id={placeholders.areaChartInvalidSpec} />,
			{
				blocks: mockBlocks,
			},
		);
		const areaChartBlock = container.querySelector(
			"[data-block='areaChartInvalidSpec']",
		);
		expect(areaChartBlock).toBeInTheDocument();
		expect(
			screen.getByText("There was an issue parsing your JSON."),
		).toBeInTheDocument();
	});
});
