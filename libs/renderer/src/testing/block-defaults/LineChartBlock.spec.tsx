import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "../../components/block-defaults/echart-visualization-block";
import { useBlock } from "../../hooks";
import { render, renderHook } from "../utils";

const mockLineChartBlocks = {
	lineChart: {
		id: "lineChart",
		widget: "e-chart",
		data: {
			variation: "echart-line-graph",
			frame: { name: "test-frame" },
			style: { width: "450px", height: "350px" },
			option: {
				xAxis: { type: "category", data: ["Jan", "Feb", "Mar"] },
				yAxis: { type: "value" },
				series: [
					{ name: "Sales", type: "line", data: [120, 200, 150] },
				],
				tooltip: { trigger: "axis" },
				legend: { show: true },
				_state: {
					fields: {
						xAxis: ["Month"],
						yAxis: ["Sales"],
						tooltip: ["Category"],
					},
				},
			},
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	lineChartString: {
		id: "lineChartString",
		widget: "e-chart",
		data: {
			variation: "echart-line-graph",
			frame: { name: "test-frame" },
			style: { width: "400px", height: "300px" },
			option: JSON.stringify({
				xAxis: { type: "category", data: ["Q1", "Q2"] },
				yAxis: { type: "value" },
				series: [{ name: "Sales", type: "line", data: [1000, 1200] }],
			}),
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	lineChartNoOption: {
		id: "lineChartNoOption",
		widget: "e-chart",
		data: {
			variation: "echart-line-graph",
			frame: { name: "test-frame" },
			style: { width: "400px", height: "300px" },
			option: null,
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	lineChartInvalidJson: {
		id: "lineChartInvalidJson",
		widget: "e-chart",
		data: {
			variation: "echart-line-graph",
			frame: { name: "test-frame" },
			style: { width: "400px", height: "300px" },
			option: "{invalid json}",
			show: "true",
		},
		listeners: {},
		slots: {},
	},
};

describe("LineChart Block Component", () => {
	beforeEach(() => {
		Object.defineProperties(HTMLElement.prototype, {
			clientWidth: {
				configurable: true,
				value: 800,
			},
			clientHeight: {
				configurable: true,
				value: 600,
			},
		});
	});

	it("should use useBlock hook", async () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("lineChart"),
			{
				blocks: mockLineChartBlocks,
				renderEngineId: "lineChart",
			},
		);

		expect(result.current).toBeDefined();
		expect(result.current.data.variation).toBe("echart-line-graph");
	});

	it("should render Line chart correctly", () => {
		const { container } = render(<VisualizationBlock id="lineChart" />, {
			blocks: mockLineChartBlocks,
		});

		const lineChart = container.querySelector("[data-block='lineChart']");
		expect(lineChart).toBeInTheDocument();
	});

	it("should render Line chart with string option correctly", () => {
		const { container } = render(
			<VisualizationBlock id="lineChartString" />,
			{
				blocks: mockLineChartBlocks,
			},
		);

		const lineChart = container.querySelector(
			"[data-block='lineChartString']",
		);
		expect(lineChart).toBeInTheDocument();
	});

	it("should show 'Add JSON' message when no option is provided", () => {
		const { container } = render(
			<VisualizationBlock id="lineChartNoOption" />,
			{
				blocks: mockLineChartBlocks,
			},
		);

		expect(
			screen.getByText("Add JSON to render your visualization"),
		).toBeInTheDocument();
		const lineChart = container.querySelector(
			"[data-block='lineChartNoOption']",
		);
		expect(lineChart).toBeInTheDocument();
	});

	it("should have correct chart data structure", () => {
		expect(mockLineChartBlocks.lineChart.data.option.series[0].type).toBe(
			"line",
		);
		expect(mockLineChartBlocks.lineChart.data.option.series[0].name).toBe(
			"Sales",
		);
		expect(
			mockLineChartBlocks.lineChart.data.option.series[0].data,
		).toEqual([120, 200, 150]);
		expect(mockLineChartBlocks.lineChart.data.option.xAxis.data).toEqual([
			"Jan",
			"Feb",
			"Mar",
		]);
	});

	it("should have correct chart configuration", () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("lineChart"),
			{
				blocks: mockLineChartBlocks,
				renderEngineId: "lineChart",
			},
		);

		const option = result.current.data.option as Record<string, unknown>;
		expect(option.tooltip).toEqual({ trigger: "axis" });
		expect(option.legend).toEqual({ show: true });
		expect((option._state as Record<string, unknown>).fields).toEqual({
			xAxis: ["Month"],
			yAxis: ["Sales"],
			tooltip: ["Category"],
		});
	});

	it("should handle chart styling correctly", () => {
		const { container } = render(<VisualizationBlock id="lineChart" />, {
			blocks: mockLineChartBlocks,
		});

		const lineChart = container.querySelector("[data-block='lineChart']");
		expect(lineChart).toHaveStyle({
			width: "450px",
			height: "350px",
		});
	});

	it("should show error message for invalid JSON string", () => {
		const { container } = render(
			<VisualizationBlock id="lineChartInvalidJson" />,
			{
				blocks: mockLineChartBlocks,
			},
		);

		expect(
			screen.getByText("There was an issue parsing your JSON."),
		).toBeInTheDocument();
		const lineChart = container.querySelector(
			"[data-block='lineChartInvalidJson']",
		);
		expect(lineChart).toBeInTheDocument();
	});
});
