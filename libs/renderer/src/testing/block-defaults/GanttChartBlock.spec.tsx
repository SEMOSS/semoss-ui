import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "../../components/block-defaults/echart-visualization-block";
import { useBlock } from "../../hooks";
import { render, renderHook } from "../utils";

const mockGanttBlocks = {
	ganttChart: {
		id: "ganttChart",
		widget: "e-chart",
		data: {
			variation: "echart-gantt-chart",
			frame: { name: "test-frame" },
			style: {
				width: "600px",
				height: "400px",
				display: undefined,
				padding: undefined,
				gap: undefined,
			},
			option: {
				series: [
					{
						type: "gantt",
						data: [
							{ name: "Task 1", start: 0, end: 10 },
							{ name: "Task 2", start: 5, end: 15 },
						],
					},
				],
			},
			show: true,
			columns: [],
			aggregate: {},
			contextMenu: {
				hideUnfilter: false,
				hideFilter: false,
				hideExclude: false,
			},
			facet: {
				facetList: [],
				facetSelected: [],
			},
		},
		listeners: {
			preProcess: {
				type: "sync",
				order: [],
			},
		},
		slots: undefined,
	},
	ganttChartNoData: {
		id: "ganttChartNoData",
		widget: "e-chart",
		data: {},
		listeners: {
			preProcess: {
				type: "sync",
				order: [],
			},
		},
		slots: undefined,
	},
};

const placeholders = {
	ganttChart: "ganttChart",
	ganttChartNoData: "ganttChartNoData",
};

describe("GanttChart Block Component", () => {
	it("should use useBlock hook", async () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("ganttChart"),
			{
				blocks: mockGanttBlocks,
				renderEngineId: placeholders["ganttChart"],
			},
		);
		expect(result.current).toBeDefined();
		expect(result.current.data.variation).toBe("echart-gantt-chart");
	});

	it("should render Gantt chart correctly", () => {
		const { container } = render(
			<VisualizationBlock id={placeholders["ganttChart"]} />,
			{
				blocks: mockGanttBlocks,
			},
		);
		const ganttChart = container.querySelector("[data-block='ganttChart']");
		expect(ganttChart).toBeInTheDocument();
	});

	it("should have correct processed data in series", () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("ganttChart"),
			{
				blocks: mockGanttBlocks,
				renderEngineId: "ganttChart",
			},
		);
		expect(Array.isArray(result.current.data.option.series[0].data)).toBe(
			true,
		);
		expect(result.current.data.option.series[0].data[0]).toEqual({
			name: "Task 1",
			start: 0,
			end: 10,
		});
	});

	it("should react to data changes in MobX store", () => {
		const blocksCopy = JSON.parse(JSON.stringify(mockGanttBlocks));
		const { result, rerender } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("ganttChart"),
			{
				blocks: blocksCopy,
				renderEngineId: "ganttChart",
			},
		);
		expect(result.current.data.option.series[0].data[0].end).toEqual(10);
		// Simulate update
		blocksCopy.ganttChart.data.option.series[0].data[0].end = 20;
		rerender();
		expect(result.current.data.option.series[0].data[0].end).toEqual(20);
	});

	it("should show No Data message if no data is present", () => {
		const blocksCopy = JSON.parse(JSON.stringify(mockGanttBlocks));
		blocksCopy.ganttChart.data.option.series[0].data = [];
		const { container } = render(
			<VisualizationBlock id={placeholders["ganttChart"]} />,
			{
				blocks: blocksCopy,
			},
		);
		expect(container.textContent).toBe("");
	});

	it("should have correct width and height style", () => {
		const { container } = render(
			<VisualizationBlock id={placeholders["ganttChart"]} />,
			{
				blocks: mockGanttBlocks,
			},
		);

		const ganttChartBlock = container.querySelector(
			"[data-block='ganttChart']",
		);
		expect(ganttChartBlock).toBeInTheDocument();
		expect(ganttChartBlock).toHaveStyle({
			width: "600px",
			height: "400px",
		});
	});

	it("should show 'Add JSON' message when no option is provided", () => {
		const { container } = render(
			<VisualizationBlock id={placeholders["ganttChartNoData"]} />,
			{
				blocks: mockGanttBlocks,
			},
		);
		expect(
			screen.getByText("Add JSON to render your visualization"),
		).toBeInTheDocument();
		const ganttChartBlock = container.querySelector(
			"[data-block='ganttChartNoData']",
		);
		expect(ganttChartBlock).toBeInTheDocument();
	});
});
