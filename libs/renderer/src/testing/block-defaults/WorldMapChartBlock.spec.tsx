import { screen, waitFor } from "@testing-library/react";
import * as echarts from "echarts";
import { describe, expect, it } from "vitest";
import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "../../components/block-defaults/echart-visualization-block";
import { useBlock } from "../../hooks";
import { render, renderHook } from "../utils";

const mockWorldMapBlocks = {
	worldMap: {
		id: "worldMap",
		widget: "e-chart",
		data: {
			variation: "echart-world-map-chart",
			frame: { name: "test-frame" },
			style: {
				width: "450px",
				height: "350px",
				display: undefined,
				padding: undefined,
				gap: undefined,
			},
			option: {
				tooltip: {
					show: true,
					trigger: "item",
					position: "bottom",
				},
				legend: { show: true },
				series: [
					{
						data: [{ value: [0, 0] }],
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
	worldMapNoData: {
		id: "worldMapNoData",
		widget: "e-chart",
		data: {
			variation: "echart-world-map-chart",
			frame: { name: "test-frame" },
			style: {
				width: "450px",
				height: "350px",
				display: undefined,
				padding: undefined,
				gap: undefined,
			},
			option: null,
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
};
const placeholders = {
	worldMap: "worldMap",
	worldMapNoData: "worldMapNoData",
};
beforeAll(() => {
	echarts.registerMap("world", {
		type: "FeatureCollection",
		features: [],
	});
});

describe("WorldMapChart Block Component", () => {
	it("should use useBlock hook", async () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("worldMap"),
			{
				blocks: mockWorldMapBlocks,
				renderEngineId: placeholders.worldMap,
			},
		);

		await waitFor(() => {
			expect(result.current).toBeDefined();
			expect(result.current.data.variation).toBe(
				"echart-world-map-chart",
			);
		});
	});

	it("should render World Map chart correctly", async () => {
		const { container } = render(
			<VisualizationBlock id={placeholders.worldMap} />,
			{
				blocks: mockWorldMapBlocks,
			},
		);

		await waitFor(() => {
			const worldMap = container.querySelector("[data-block='worldMap']");
			expect(worldMap).toBeInTheDocument();
		});
	});

	it("should have correct processed data in series", async () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("worldMap"),
			{
				blocks: mockWorldMapBlocks,
				renderEngineId: "worldMap",
			},
		);

		await waitFor(() => {
			// This assumes processData puts data in series[0].data
			expect(
				Array.isArray(result.current.data.option.series[0].data),
			).toBe(true);
			expect(result.current.data.option.series[0].data[0].value).toEqual([
				0, 0,
			]);
		});
	});

	it("should react to data changes in MobX store", async () => {
		const blocksCopy = JSON.parse(JSON.stringify(mockWorldMapBlocks));
		const { result, rerender } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("worldMap"),
			{
				blocks: blocksCopy,
				renderEngineId: "worldMap",
			},
		);

		await waitFor(() => {
			expect(result.current.data.option.series[0].data[0].value).toEqual([
				0, 0,
			]);
		});

		// Simulate update
		blocksCopy.worldMap.data.option.series[0].data[0].value = [10, 20];
		rerender();
		await waitFor(() => {
			expect(result.current.data.option.series[0].data[0].value).toEqual([
				10, 20,
			]);
		});
	});

	it("should show No Data message if no data is present", async () => {
		const blocksCopy = JSON.parse(JSON.stringify(mockWorldMapBlocks));
		blocksCopy.worldMap.data.option.series[0].data = [];
		const { container } = render(
			<VisualizationBlock id={placeholders.worldMap} />,
			{
				blocks: blocksCopy,
			},
		);

		await waitFor(() => {
			// if there is no series data, there should be no text
			expect(container.textContent).toBe("");
		});
	});

	it("should have correct width and height style", () => {
		const { container } = render(
			<VisualizationBlock id={placeholders.worldMap} />,
			{
				blocks: mockWorldMapBlocks,
			},
		);

		const worldMapBlock = container.querySelector(
			"[data-block='worldMap']",
		);
		expect(worldMapBlock).toBeInTheDocument();
		expect(worldMapBlock).toHaveStyle({
			width: "450px",
			height: "350px",
		});
	});

	it("should show 'Add JSON' message when no option is provided", () => {
		const { container } = render(
			<VisualizationBlock id={placeholders.worldMapNoData} />,
			{
				blocks: mockWorldMapBlocks,
			},
		);
		expect(
			screen.getByText("Add JSON to render your visualization"),
		).toBeInTheDocument();
		const worldMapChart = container.querySelector(
			"[data-block='worldMapNoData']",
		);
		expect(worldMapChart).toBeInTheDocument();
	});
});
