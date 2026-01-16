import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "../../components/block-defaults/echart-visualization-block";
import { useBlock } from "../../hooks";
import { render, renderHook, screen } from "../utils";

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

		await waitFor(() => {
			expect(result).toBeDefined();
			expect(result.current.data.variation).toBe("echart-line-graph");
		});
	});

	it("should render Line chart correctly", async () => {
		const { container } = render(
			<VisualizationBlock id={mockLineChartBlocks.lineChart.id} />,
			{
				blocks: mockLineChartBlocks,
			},
		);

		await waitFor(() => {
			const lineChart = container.querySelector(
				"[data-block='lineChart']",
			);
			expect(lineChart).toBeInTheDocument();
		});
	});

	it("should render Line chart with string option correctly", async () => {
		const { container } = render(
			<VisualizationBlock id={mockLineChartBlocks.lineChartString.id} />,
			{
				blocks: mockLineChartBlocks,
			},
		);

		await waitFor(() => {
			const lineChart = container.querySelector(
				"[data-block='lineChartString']",
			);
			expect(lineChart).toBeInTheDocument();
		});
	});

	it("should show 'Add JSON' message when no option is provided", async () => {
		const { container } = render(
			<VisualizationBlock
				id={mockLineChartBlocks.lineChartNoOption.id}
			/>,
			{
				blocks: mockLineChartBlocks,
			},
		);

		await waitFor(() => {
			expect(
				screen.getByText("Add JSON to render your visualization"),
			).toBeInTheDocument();

			const lineChart = container.querySelector(
				"[data-block='lineChartNoOption']",
			);
			expect(lineChart).toBeInTheDocument();
		});
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

	it("should have correct chart configuration", async () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("lineChart"),
			{
				blocks: mockLineChartBlocks,
				renderEngineId: "lineChart",
			},
		);

		await waitFor(() => {
			const option = result.current.data.option as Record<
				string,
				unknown
			>;
			expect(option.tooltip).toEqual({ trigger: "axis" });
			expect(option.legend).toEqual({ show: true });
			expect((option._state as Record<string, unknown>).fields).toEqual({
				xAxis: ["Month"],
				yAxis: ["Sales"],
				tooltip: ["Category"],
			});
		});
	});

	it("should handle chart styling correctly", async () => {
		const { container } = render(
			<VisualizationBlock id={mockLineChartBlocks.lineChart.id} />,
			{
				blocks: mockLineChartBlocks,
			},
		);

		await waitFor(() => {
			const lineChart = container.querySelector(
				"[data-block='lineChart']",
			);
			expect(lineChart).toHaveStyle({
				width: "450px",
				height: "350px",
			});
		});
	});

	it("should show error message for invalid JSON string", async () => {
		const { container } = render(
			<VisualizationBlock
				id={mockLineChartBlocks.lineChartInvalidJson.id}
			/>,
			{
				blocks: mockLineChartBlocks,
			},
		);

		await waitFor(() => {
			expect(
				screen.getByText("There was an issue parsing your JSON."),
			).toBeInTheDocument();
			const lineChart = container.querySelector(
				"[data-block='lineChartInvalidJson']",
			);
			expect(lineChart).toBeInTheDocument();
		});
	});
});
