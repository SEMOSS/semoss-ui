import { describe, it, expect } from "vitest";
import { render, renderHook } from "@/testing/utils"; // Assuming 'customRender' is exported as 'render'
import { act, fireEvent, screen } from "@testing-library/react";
import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "@/components/block-defaults/echart-visualization-block";
import { useBlock, useBlockSettings } from "@/hooks";
import { ToogleDonut } from "@/components/block-defaults/echart-visualization-block/variant/pie-chart/ToggleDonut";

// Mock data for testing
const mockBlocks = {
	pieChart: {
		id: "pieChart",
		widget: "e-chart",
		data: {
			variation: "echart-pie-chart",
			frame: {
				name: "",
			},
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
				width: "450px",
				height: "350px",
			},
			option: {
				dataset: {
					source: [
						{
							name: "a",
							value: 85,
						},
						{
							name: "b",
							value: 79,
						},
					],
				},
				color: [
					"#ff6f61",
					"#6b5b95",
					"#88b04b",
					"#f7cac9",
					"#92a8d1",
					"#034f84",
					"#f7786b",
					"#deeaee",
				],
				title: {
					text: "",
					left: "center",
					show: true,
					textStyle: {
						fontSize: 18,
						color: "#ff6f61",
						fontWeight: "normal",
					},
				},
				tooltip: {
					trigger: "item",
					show: false,
				},
				legend: {
					show: false,
					orient: "vertical",
					left: "left",
					top: "top",
					textStyle: {
						fontSize: 10,
						color: "#000000",
					},
				},
				series: [
					{
						name: "Access From",
						type: "pie",
						radius: "50%",
						label: {
							show: true,
							position: "outside",
							fontSize: 10,
							color: "#000000",
							backgroundColor: "",
							rotate: 0,
						},
						labelLine: {
							length: 30,
						},
						data: [
							{
								value: 1048,
								name: "Search Engine",
							},
							{
								value: 735,
								name: "Direct",
							},
							{
								value: 580,
								name: "Email",
							},
							{
								value: 484,
								name: "Union Ads",
							},
							{
								value: 300,
								name: "Video Ads",
							},
						],
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: "rgba(0.5, 0, 0, 0.5)",
							},
						},
					},
				],
				reset: {
					radius: "50%",
					title: {
						text: "",
						left: "center",
						show: true,
						textStyle: {
							fontSize: 18,
							color: "#ff6f61",
							fontWeight: "normal",
							fontFamily: "",
						},
					},
					label: {
						show: true,
						position: "outside",
						fontSize: 10,
						color: "#000000",
						backgroundColor: "",
						rotate: 0,
						fontFamily: "",
					},
					labelLine: {
						length: 30,
					},
				},
			},
			specJson:
				'{\n  "$schema": "",\n  "title": "E Pie Chart",\n  "width": 300,\n  "height": 200,\n  "data": {\n    "values": [\n      {\n        "a": "A",\n        "b": 28\n      },\n      {\n        "a": "B",\n        "b": 55\n      },\n      {\n        "a": "C",\n        "b": 43\n      },\n      {\n        "a": "D",\n        "b": 91\n      },\n      {\n        "a": "E",\n        "b": 81\n      },\n      {\n        "a": "F",\n        "b": 53\n      },\n      {\n        "a": "G",\n        "b": 19\n      },\n      {\n        "a": "H",\n        "b": 87\n      },\n      {\n        "a": "I",\n        "b": 52\n      }\n    ]\n  },\n  "mark": "pie",\n  "encoding": {\n    "x": {\n      "field": "a",\n      "type": "ordinal"\n    },\n    "y": {\n      "field": "b",\n      "type": "quantitative"\n    }\n  }\n}',
			show: "true",
		},
		listeners: {},
		slots: {},
	},
};

describe("Pie Block Component", () => {
	// Mock clientWidth and clientHeight to avoid ECharts error
	beforeEach(() => {
		Object.defineProperties(HTMLElement.prototype, {
			clientWidth: {
				configurable: true,
				value: 800, // Arbitrary non-zero width
			},
			clientHeight: {
				configurable: true,
				value: 600, // Arbitrary non-zero height
			},
		});
	});

	it("use useBlock", async () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("pieChart"),
			{
				blocks: mockBlocks,
				renderEngineId: "pieChart",
			},
		);

		expect(result.current).toBeDefined();
	});
	it("should set title of chart to DEMO", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("pieChart"),
			{
				blocks: mockBlocks,
				renderEngineId: "pieChart",
			},
		);

		expect(result.current).toBeDefined();
		act(() => {
			// result.current.setData("option", {"Test1": 1, "Test2": 1})
			result.current.setData("option", { title: { text: "DEMO" } });
		});

		// console.log({ result: result.current.data.option });
		expect(result.current.data.option.title.text).toBe("DEMO");
	});

	it("should render Pie chart correctly", () => {
		const { container } = render(<VisualizationBlock id="pieChart" />, {
			blocks: mockBlocks,
		});

		// const {data} = useBlock("pieChart")
		// console.log({data})

		// screen.debug();
		const pichart = container.querySelector("[data-block='pieChart']");
		expect(pichart).toBeInTheDocument();
	});

	it("should set radius for donut of pie chart via useBlockSettings", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("pieChart"),
			{
				renderEngineId: "pieChart",
				blocks: mockBlocks,
			},
		);

		act(() => {
			result.current.setData("option", {
				series: [{ radius: ["20%", "50%"] }],
			});
		});

		// console.log("radius", result.current.data.option.series[0].radius)
		expect(result.current.data.option.series[0].radius).toEqual(["20%", "50%"]);
	});

	it("should set radius for donut of pie chart via blocks", () => {
		const { result } = renderHook(() => useBlock("pieChart"), {
			blocks: {
				// Modify the mockBlocks to test there's a donut chart
				pieChart: {
					...mockBlocks.pieChart,
					data: {
						...mockBlocks.pieChart.data,
						option: {
							...mockBlocks.pieChart.data.option,
							series: [
								{
									...mockBlocks.pieChart.data.option.series[0],
									radius: ["20%", "50%"],
								},
							],
						},
					},
				},
			},
			renderEngineId: "pieChart",
		});

		expect(result.current.data.option.series[0].radius).toEqual(["20%", "50%"]);

		// console.log({ chartInstance: chartInstance.getAttribute("data-option") });
	});

	it("should toggle donut", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("pieChart"),
			{
				renderEngineId: "pieChart",
				blocks: mockBlocks,
				customChildren: <ToogleDonut id="pieChart" path={"option"} />,
			},
		);

		/**
		 * BUG
			The label element associated with checkbox inputs must have an htmlFor attribute that corresponds to the id of the checkbox. 
			This ensures proper accessibility support and allows assistive technologies to correctly associate labels with form elements.
		 */
		const toggleSwitch = screen.getByRole("checkbox", { hidden: true }); //workaround for getting checkbox

		// screen.debug();
		expect(toggleSwitch).not.toBeChecked();
		fireEvent.click(toggleSwitch);
		expect(toggleSwitch).toBeChecked();
		expect(result.current.data.option.series[0].radius).toEqual(["20%", "50%"]);
	});
	it("set data of the pie chart", () => {
		expect(mockBlocks.pieChart.data.option.series[0].type).toBe("pie");
		expect(
			mockBlocks.pieChart.data.option.series[0].data.map((data) => data.name),
		).toEqual(["Search Engine", "Direct", "Email", "Union Ads", "Video Ads"]);
		expect(
			mockBlocks.pieChart.data.option.series[0].data.map((data) => data.value),
		).toEqual([1048, 735, 580, 484, 300]);
	});
});
