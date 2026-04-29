import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "../../components/block-defaults/echart-visualization-block";
import { useBlock } from "../../hooks";
import { render, renderHook } from "../utils";

const mockBarChartStackBlocks = {
	barChartStack: {
		id: "barChartStack",
		widget: "e-chart",
		data: {
			variation: "echart-stack-chart",
			frame: { name: "test-frame" },
			style: { width: "450px", height: "350px" },
			option: {
				xAxis: {
					type: "category",
					data: ["Q1", "Q2", "Q3", "Q4"],
				},
				yAxis: { type: "value" },
				series: [
					{
						name: "Product A",
						type: "bar",
						stack: "total",
						data: [120, 132, 101, 134],
					},
					{
						name: "Product B",
						type: "bar",
						stack: "total",
						data: [220, 182, 191, 234],
					},
					{
						name: "Product C",
						type: "bar",
						stack: "total",
						data: [150, 212, 201, 154],
					},
				],
				tooltip: { trigger: "axis" },
				legend: { show: true },
				_state: {
					fields: {
						xAxis: ["Quarter"],
						yAxis: ["Product A", "Product B", "Product C"],
						tooltip: ["Category"],
					},
				},
			},
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	barChartStackString: {
		id: "barChartStackString",
		widget: "e-chart",
		data: {
			variation: "echart-stack-chart",
			frame: { name: "test-frame" },
			style: { width: "400px", height: "300px" },
			option: JSON.stringify({
				xAxis: { type: "category", data: ["Jan", "Feb", "Mar"] },
				yAxis: { type: "value" },
				series: [
					{
						name: "Desktop",
						type: "bar",
						stack: "device",
						data: [320, 302, 301],
					},
					{
						name: "Mobile",
						type: "bar",
						stack: "device",
						data: [120, 132, 101],
					},
				],
				tooltip: { trigger: "axis" },
				legend: { show: true },
			}),
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	barChartStackPercentage: {
		id: "barChartStackPercentage",
		widget: "e-chart",
		data: {
			variation: "echart-stack-chart",
			frame: { name: "test-frame" },
			style: { width: "500px", height: "400px" },
			option: {
				xAxis: {
					type: "category",
					data: ["Week 1", "Week 2", "Week 3"],
				},
				yAxis: {
					type: "value",
					axisLabel: {
						formatter: "{value}%",
					},
				},
				series: [
					{
						name: "Task A",
						type: "bar",
						stack: "percentage",
						data: [30, 25, 35],
					},
					{
						name: "Task B",
						type: "bar",
						stack: "percentage",
						data: [40, 45, 35],
					},
					{
						name: "Task C",
						type: "bar",
						stack: "percentage",
						data: [30, 30, 30],
					},
				],
				tooltip: {
					trigger: "axis",
					formatter: "{b}: {c}%",
				},
				legend: { show: true },
				_state: {
					fields: {
						xAxis: ["Week"],
						yAxis: ["Task A", "Task B", "Task C"],
						tooltip: ["Percentage"],
					},
				},
			},
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	barChartStackHorizontal: {
		id: "barChartStackHorizontal",
		widget: "e-chart",
		data: {
			variation: "echart-stack-chart",
			frame: { name: "test-frame" },
			style: { width: "450px", height: "350px" },
			option: {
				xAxis: { type: "value" },
				yAxis: {
					type: "category",
					data: ["Team 1", "Team 2", "Team 3"],
				},
				series: [
					{
						name: "Frontend",
						type: "bar",
						stack: "hours",
						data: [20, 25, 30],
					},
					{
						name: "Backend",
						type: "bar",
						stack: "hours",
						data: [15, 20, 25],
					},
					{
						name: "Testing",
						type: "bar",
						stack: "hours",
						data: [10, 15, 12],
					},
				],
				tooltip: { trigger: "axis" },
				legend: { show: true },
				_state: {
					fields: {
						xAxis: ["Hours"],
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

	barChartStackMultipleStacks: {
		id: "barChartStackMultipleStacks",
		widget: "e-chart",
		data: {
			variation: "echart-stack-chart",
			frame: { name: "test-frame" },
			style: { width: "600px", height: "450px" },
			option: {
				xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr"] },
				yAxis: { type: "value" },
				series: [
					{
						name: "Online Sales",
						type: "bar",
						stack: "sales",
						data: [320, 302, 301, 334],
					},
					{
						name: "Offline Sales",
						type: "bar",
						stack: "sales",
						data: [120, 132, 101, 134],
					},
					{
						name: "Online Returns",
						type: "bar",
						stack: "returns",
						data: [20, 15, 25, 18],
					},
					{
						name: "Offline Returns",
						type: "bar",
						stack: "returns",
						data: [8, 12, 10, 15],
					},
				],
				tooltip: { trigger: "axis" },
				legend: { show: true },
				_state: {
					fields: {
						xAxis: ["Month"],
						yAxis: [
							"Online Sales",
							"Offline Sales",
							"Online Returns",
							"Offline Returns",
						],
						tooltip: ["Category"],
					},
				},
			},
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	barChartStackNoOption: {
		id: "barChartStackNoOption",
		widget: "e-chart",
		data: {
			variation: "echart-stack-chart",
			frame: { name: "test-frame" },
			style: { width: "400px", height: "300px" },
			option: null,
			show: "true",
		},
		listeners: {},
		slots: {},
	},

	barChartStackInvalidJson: {
		id: "barChartStackInvalidJson",
		widget: "e-chart",
		data: {
			variation: "echart-stack-chart",
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
	barChartStack: "barChartStack",
	barChartStackString: "barChartStackString",
	barChartStackPercentage: "barChartStackPercentage",
	barChartStackHorizontal: "barChartStackHorizontal",
	barChartStackMultipleStacks: "barChartStackMultipleStacks",
	barChartStackNoOption: "barChartStackNoOption",
	barChartStackInvalidJson: "barChartStackInvalidJson",
};

describe("BarChartStack Block Component", () => {
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
			() => useBlock<EchartVisualizationBlockDef>(blockIds.barChartStack),
			{
				blocks: mockBarChartStackBlocks,
				renderEngineId: blockIds.barChartStack,
			},
		);

		await waitFor(() => {
			expect(result.current).toBeDefined();
			expect(result.current.data.variation).toBe("echart-stack-chart");
		});
	});

	it("should render Stack chart correctly", async () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartStack} />,
			{
				blocks: mockBarChartStackBlocks,
			},
		);
		await waitFor(() => {
			const stackChart = container.querySelector(
				`[data-block='${blockIds.barChartStack}']`,
			);
			expect(stackChart).toBeInTheDocument();
		});
	});

	it("should render Stack chart with string option correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartStackString} />,
			{
				blocks: mockBarChartStackBlocks,
			},
		);

		const stackChart = container.querySelector(
			`[data-block='${blockIds.barChartStackString}']`,
		);
		expect(stackChart).toBeInTheDocument();
	});

	it("should render Stack chart with percentage values correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartStackPercentage} />,
			{
				blocks: mockBarChartStackBlocks,
			},
		);

		const stackChart = container.querySelector(
			`[data-block='${blockIds.barChartStackPercentage}']`,
		);
		expect(stackChart).toBeInTheDocument();
	});

	it("should render horizontal Stack chart correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartStackHorizontal} />,
			{
				blocks: mockBarChartStackBlocks,
			},
		);

		const stackChart = container.querySelector(
			`[data-block='${blockIds.barChartStackHorizontal}']`,
		);
		expect(stackChart).toBeInTheDocument();
	});

	it("should render Stack chart with multiple stacks correctly", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartStackMultipleStacks} />,
			{
				blocks: mockBarChartStackBlocks,
			},
		);

		const stackChart = container.querySelector(
			`[data-block='${blockIds.barChartStackMultipleStacks}']`,
		);
		expect(stackChart).toBeInTheDocument();
	});

	it("should show 'Add JSON' message when no option is provided", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartStackNoOption} />,
			{
				blocks: mockBarChartStackBlocks,
			},
		);

		expect(
			screen.getByText("Add JSON to render your visualization"),
		).toBeInTheDocument();
		const stackChart = container.querySelector(
			`[data-block='${blockIds.barChartStackNoOption}']`,
		);
		expect(stackChart).toBeInTheDocument();
	});

	it("should have correct chart data structure for stacked series", () => {
		const stackOption = mockBarChartStackBlocks.barChartStack.data.option;
		expect(stackOption.series).toHaveLength(3);
		expect(stackOption.series[0].type).toBe("bar");
		expect(stackOption.series[0].stack).toBe("total");
		expect(stackOption.series[0].name).toBe("Product A");
		expect(stackOption.series[0].data).toEqual([120, 132, 101, 134]);
		expect(stackOption.series[1].stack).toBe("total");
		expect(stackOption.series[2].stack).toBe("total");
		expect(stackOption.xAxis.data).toEqual(["Q1", "Q2", "Q3", "Q4"]);
	});

	it("should have correct chart data structure for multiple stacks", () => {
		const multiStack =
			mockBarChartStackBlocks.barChartStackMultipleStacks.data.option;
		expect(multiStack.series).toHaveLength(4);

		expect(multiStack.series[0].stack).toBe("sales");
		expect(multiStack.series[1].stack).toBe("sales");
		expect(multiStack.series[0].name).toBe("Online Sales");
		expect(multiStack.series[1].name).toBe("Offline Sales");

		expect(multiStack.series[2].stack).toBe("returns");
		expect(multiStack.series[3].stack).toBe("returns");
		expect(multiStack.series[2].name).toBe("Online Returns");
		expect(multiStack.series[3].name).toBe("Offline Returns");
	});

	it("should have correct chart configuration and axis setup", () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>(blockIds.barChartStack),
			{
				blocks: mockBarChartStackBlocks,
				renderEngineId: blockIds.barChartStack,
			},
		);

		const option = result.current.data.option as Record<string, unknown>;

		expect(option.tooltip).toEqual({ trigger: "axis" });
		expect(option.legend).toEqual({ show: true });
		expect((option._state as Record<string, unknown>).fields).toEqual({
			xAxis: ["Quarter"],
			yAxis: ["Product A", "Product B", "Product C"],
			tooltip: ["Category"],
		});

		expect((option.xAxis as { type: string }).type).toBe("category");
		expect((option.yAxis as { type: string }).type).toBe("value");
	});

	it("should handle horizontal stack chart configuration", () => {
		const horizontalChart =
			mockBarChartStackBlocks.barChartStackHorizontal.data.option;
		expect(horizontalChart.xAxis.type).toBe("value");
		expect(horizontalChart.yAxis.type).toBe("category");
		expect(horizontalChart.yAxis.data).toEqual([
			"Team 1",
			"Team 2",
			"Team 3",
		]);

		expect(horizontalChart.series[0].stack).toBe("hours");
		expect(horizontalChart.series[1].stack).toBe("hours");
		expect(horizontalChart.series[2].stack).toBe("hours");
	});

	it("should handle chart styling and dimensions correctly", () => {
		const { container: container1 } = render(
			<VisualizationBlock id={blockIds.barChartStack} />,
			{
				blocks: mockBarChartStackBlocks,
			},
		);
		const stackChart1 = container1.querySelector(
			`[data-block='${blockIds.barChartStack}']`,
		);
		expect(stackChart1).toHaveStyle({
			width: "450px",
			height: "350px",
		});

		const { container: container2 } = render(
			<VisualizationBlock id={blockIds.barChartStackMultipleStacks} />,
			{
				blocks: mockBarChartStackBlocks,
			},
		);
		const stackChart2 = container2.querySelector(
			`[data-block='${blockIds.barChartStackMultipleStacks}']`,
		);
		expect(stackChart2).toHaveStyle({
			width: "600px",
			height: "450px",
		});
	});

	it("should render block for invalid JSON string without crashing", () => {
		const { container } = render(
			<VisualizationBlock id={blockIds.barChartStackInvalidJson} />,
			{
				blocks: mockBarChartStackBlocks,
			},
		);

		const stackChart = container.querySelector(
			`[data-block='${blockIds.barChartStackInvalidJson}']`,
		);
		expect(stackChart).toBeInTheDocument();
	});

	it("should handle string option parsing correctly", () => {
		const stringOption =
			mockBarChartStackBlocks.barChartStackString.data.option;
		const parsedOption = JSON.parse(stringOption as string);

		expect(parsedOption.series).toHaveLength(2);
		expect(parsedOption.series[0].type).toBe("bar");
		expect(parsedOption.series[0].stack).toBe("device");
		expect(parsedOption.series[0].name).toBe("Desktop");
		expect(parsedOption.series[0].data).toEqual([320, 302, 301]);
		expect(parsedOption.series[1].stack).toBe("device");
		expect(parsedOption.xAxis.data).toEqual(["Jan", "Feb", "Mar"]);
	});

	it("should validate chart state fields for percentage chart", () => {
		const chartState =
			mockBarChartStackBlocks.barChartStackPercentage.data.option._state;
		expect(chartState.fields.xAxis).toEqual(["Week"]);
		expect(chartState.fields.yAxis).toEqual(["Task A", "Task B", "Task C"]);
		expect(chartState.fields.tooltip).toEqual(["Percentage"]);
	});

	it("should verify stack property consistency within same stack", () => {
		const stackChart = mockBarChartStackBlocks.barChartStack.data.option;
		const stackNames = stackChart.series.map(
			(series: { stack: string }) => series.stack,
		);

		expect(stackNames.every((stack: string) => stack === "total")).toBe(
			true,
		);
	});

	it("should handle percentage formatting in tooltip", () => {
		const percentageChart =
			mockBarChartStackBlocks.barChartStackPercentage.data.option;
		expect(percentageChart.tooltip.formatter).toBe("{b}: {c}%");
		expect(percentageChart.yAxis.axisLabel.formatter).toBe("{value}%");
	});

	it("should validate multiple stack groups", () => {
		const multiStackChart =
			mockBarChartStackBlocks.barChartStackMultipleStacks.data.option;
		const salesStack = multiStackChart.series.filter(
			(series: { stack: string; name: string }) =>
				series.stack === "sales",
		);
		const returnsStack = multiStackChart.series.filter(
			(series: { stack: string; name: string }) =>
				series.stack === "returns",
		);

		expect(salesStack).toHaveLength(2);
		expect(returnsStack).toHaveLength(2);
		expect(salesStack[0].name).toBe("Online Sales");
		expect(salesStack[1].name).toBe("Offline Sales");
		expect(returnsStack[0].name).toBe("Online Returns");
		expect(returnsStack[1].name).toBe("Offline Returns");
	});
});
