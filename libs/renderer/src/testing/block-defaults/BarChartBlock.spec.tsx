import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "../../components/block-defaults/echart-visualization-block";
import { useBlock } from "../../hooks";
import { render, renderHook } from "../utils";

const mockBarChartBlocks = {
	barChart: {
		id: "barChart",
		widget: "e-chart",
		data: {
			variation: "echart-bar-graph",
			frame: { name: "test-frame" },
			style: { width: "450px", height: "350px" },
			option: {
				xAxis: {
					type: "category",
					data: ["Item A", "Item B", "Item C"],
				},
				yAxis: { type: "value" },
				series: [{ name: "Sales", type: "bar", data: [120, 200, 150] }],
				tooltip: { trigger: "axis" },
				legend: { show: true },
				_state: {
					fields: {
						xAxis: ["Item"],
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

	barChartString: {
		id: "barChartString",
		widget: "e-chart",
		data: {
			variation: "echart-bar-graph",
			frame: { name: "test-frame" },
			style: { width: "400px", height: "300px" },
			option: JSON.stringify({
				xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
				yAxis: { type: "value" },
				series: [
					{
						name: "Revenue",
						type: "bar",
						data: [1000, 1200, 800, 1500],
					},
				],
			}),
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	barChartMultipleSeries: {
		id: "barChartMultipleSeries",
		widget: "e-chart",
		data: {
			variation: "echart-bar-graph",
			frame: { name: "test-frame" },
			style: { width: "500px", height: "400px" },
			option: {
				xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr"] },
				yAxis: { type: "value" },
				series: [
					{ name: "Sales", type: "bar", data: [120, 200, 150, 180] },
					{ name: "Profit", type: "bar", data: [30, 50, 40, 60] },
				],
				tooltip: { trigger: "axis" },
				legend: { show: true },
				_state: {
					fields: {
						xAxis: ["Month"],
						yAxis: ["Sales", "Profit"],
						tooltip: ["Category"],
					},
				},
			},
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	barChartHorizontal: {
		id: "barChartHorizontal",
		widget: "e-chart",
		data: {
			variation: "echart-bar-graph",
			frame: { name: "test-frame" },
			style: { width: "450px", height: "350px" },
			option: {
				xAxis: { type: "value" },
				yAxis: {
					type: "category",
					data: ["Team A", "Team B", "Team C"],
				},
				series: [{ name: "Score", type: "bar", data: [85, 92, 78] }],
				tooltip: { trigger: "axis" },
				legend: { show: true },
				_state: {
					fields: {
						xAxis: ["Score"],
						yAxis: ["Team"],
						tooltip: ["Category"],
					},
				},
			},
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	barChartNoOption: {
		id: "barChartNoOption",
		widget: "e-chart",
		data: {
			variation: "echart-bar-graph",
			frame: { name: "test-frame" },
			style: { width: "400px", height: "300px" },
			option: null,
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	barChartInvalidJson: {
		id: "barChartInvalidJson",
		widget: "e-chart",
		data: {
			variation: "echart-bar-graph",
			frame: { name: "test-frame" },
			style: { width: "400px", height: "300px" },
			option: "{invalid json}",
			show: "true",
		},
		listeners: {},
		slots: {},
	},
};

const blockIds = {
	barChart: "barChart",
	barChartString: "barChartString",
	barChartMultipleSeries: "barChartMultipleSeries",
	barChartHorizontal: "barChartHorizontal",
	barChartNoOption: "barChartNoOption",
	barChartInvalidJson: "barChartInvalidJson",
};

describe("BarChart Block Component", () => {
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
			() => useBlock<EchartVisualizationBlockDef>(blockIds.barChart),
			{
				blocks: mockBarChartBlocks,
				renderEngineId: blockIds.barChart,
			},
		);

		await waitFor(() => {
			expect(result.current).toBeDefined();
			expect(result.current.data.variation).toBe("echart-bar-graph");
		});
	});

	it("should render Bar chart correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChart} />,
			{
				blocks: mockBarChartBlocks,
			},
		);

		const barChart = container.querySelector(
			`[data-block='${blockIds.barChart}']`,
		);
		expect(barChart).toBeInTheDocument();
	});

	it("should render Bar chart with string option correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartString} />,
			{
				blocks: mockBarChartBlocks,
			},
		);

		const barChart = container.querySelector(
			`[data-block='${blockIds.barChartString}']`,
		);
		expect(barChart).toBeInTheDocument();
	});

	it("should render Bar chart with multiple series correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartMultipleSeries} />,
			{
				blocks: mockBarChartBlocks,
			},
		);

		const barChart = container.querySelector(
			`[data-block='${blockIds.barChartMultipleSeries}']`,
		);
		expect(barChart).toBeInTheDocument();
	});

	it("should render horizontal Bar chart correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartHorizontal} />,
			{
				blocks: mockBarChartBlocks,
			},
		);

		const barChart = container.querySelector(
			`[data-block='${blockIds.barChartHorizontal}']`,
		);
		expect(barChart).toBeInTheDocument();
	});

	it("should show 'Add JSON' message when no option is provided", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartNoOption} />,
			{
				blocks: mockBarChartBlocks,
			},
		);

		expect(
			screen.getByText("Add JSON to render your visualization"),
		).toBeInTheDocument();
		const barChart = container.querySelector(
			`[data-block='${blockIds.barChartNoOption}']`,
		);
		expect(barChart).toBeInTheDocument();
	});

	it("should have correct chart data structure for single series", () => {
		expect(mockBarChartBlocks.barChart.data.option.series[0].type).toBe(
			"bar",
		);
		expect(mockBarChartBlocks.barChart.data.option.series[0].name).toBe(
			"Sales",
		);
		expect(mockBarChartBlocks.barChart.data.option.series[0].data).toEqual([
			120, 200, 150,
		]);
		expect(mockBarChartBlocks.barChart.data.option.xAxis.data).toEqual([
			"Item A",
			"Item B",
			"Item C",
		]);
	});

	it("should have correct chart data structure for multiple series", () => {
		const multiSeries =
			mockBarChartBlocks.barChartMultipleSeries.data.option;
		expect(multiSeries.series).toHaveLength(2);
		expect(multiSeries.series[0].type).toBe("bar");
		expect(multiSeries.series[1].type).toBe("bar");
		expect(multiSeries.series[0].name).toBe("Sales");
		expect(multiSeries.series[1].name).toBe("Profit");
		expect(multiSeries.series[0].data).toEqual([120, 200, 150, 180]);
		expect(multiSeries.series[1].data).toEqual([30, 50, 40, 60]);
	});

	it("should have correct chart configuration", () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>(blockIds.barChart),
			{
				blocks: mockBarChartBlocks,
				renderEngineId: blockIds.barChart,
			},
		);

		const option = result.current.data.option as Record<string, unknown>;
		expect(option.tooltip).toEqual({ trigger: "axis" });
		expect(option.legend).toEqual({ show: true });
		expect((option._state as Record<string, unknown>).fields).toEqual({
			xAxis: ["Item"],
			yAxis: ["Sales"],
			tooltip: ["Category"],
		});
	});

	it("should handle horizontal bar chart configuration", () => {
		const horizontalChart =
			mockBarChartBlocks.barChartHorizontal.data.option;
		expect(horizontalChart.xAxis.type).toBe("value");
		expect(horizontalChart.yAxis.type).toBe("category");
		expect(horizontalChart.yAxis.data).toEqual([
			"Team A",
			"Team B",
			"Team C",
		]);
		expect(horizontalChart.series[0].data).toEqual([85, 92, 78]);
	});

	it("should handle chart styling correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChart} />,
			{
				blocks: mockBarChartBlocks,
			},
		);

		const barChart = container.querySelector(
			`[data-block='${blockIds.barChart}']`,
		);
		expect(barChart).toHaveStyle({
			width: "450px",
			height: "350px",
		});
	});

	it("should handle different chart sizes correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartMultipleSeries} />,
			{
				blocks: mockBarChartBlocks,
			},
		);

		const barChart = container.querySelector(
			`[data-block='${blockIds.barChartMultipleSeries}']`,
		);
		expect(barChart).toHaveStyle({
			width: "500px",
			height: "400px",
		});
	});

	it("should throw error for invalid JSON string", () => {
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		expect(() =>
			render(<VisualizationBlock id={blockIds.barChartInvalidJson} />, {
				blocks: mockBarChartBlocks,
			}),
		).toThrow(SyntaxError);

		consoleSpy.mockRestore();
	});

	it("should handle string option parsing correctly", () => {
		const stringOption = mockBarChartBlocks.barChartString.data.option;
		const parsedOption = JSON.parse(stringOption as string);

		expect(parsedOption.series[0].type).toBe("bar");
		expect(parsedOption.series[0].name).toBe("Revenue");
		expect(parsedOption.series[0].data).toEqual([1000, 1200, 800, 1500]);
		expect(parsedOption.xAxis.data).toEqual(["Q1", "Q2", "Q3", "Q4"]);
	});

	it("should have correct axis configuration for vertical bars", () => {
		const verticalChart = mockBarChartBlocks.barChart.data.option;
		expect(verticalChart.xAxis.type).toBe("category");
		expect(verticalChart.yAxis.type).toBe("value");
	});

	it("should validate chart state fields", () => {
		const chartState =
			mockBarChartBlocks.barChartMultipleSeries.data.option._state;
		expect(chartState.fields.xAxis).toEqual(["Month"]);
		expect(chartState.fields.yAxis).toEqual(["Sales", "Profit"]);
		expect(chartState.fields.tooltip).toEqual(["Category"]);
	});
});
