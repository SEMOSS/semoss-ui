// tests/components/Pie.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@/testing/utils"; // Assuming 'customRender' is exported as 'render'
// import { Pie } from '../../src/components/block-defaults/echart-visualization-block/variant/pie-chart/Pie';
import { screen } from "@testing-library/react";
import { Pie } from "@/components/block-defaults/echart-visualization-block/variant/pie-chart/Pie";
import { VisualizationBlock } from "@/components/block-defaults/echart-visualization-block";

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
	it("should render Pie chart correctly", () => {
		const { container } = render(<VisualizationBlock id="pieChart" />, {
			blocks: mockBlocks,
		});

		// screen.debug();
		const pichart = container.querySelector("[data-block='pieChart']");
		expect(pichart).toBeInTheDocument();
	});
	// it("should render Pie chart correctly", () => {
	// 	const { container } = render(<Pie id="pieChart" updateJson={() => {}} />, {
	// 		blocks: mockBlocks,
	// 	});

	// 	const pichart = container.querySelector("[data-block]='piChart'");
	// 	expect(pichart).toBeInTheDocument();

	// 	// Verify if the option for "donut" (a modification to inner radius or some other option) is applied
	// 	// const chartOptions = JSON.parse(
	// 	// 	container.querySelector("canvas")?.getAttribute("data-option") ?? "{}",
	// 	// );

	// 	// screen.debug();

	// 	// console.log({ chartOptions });
	// 	// expect(chartOptions.series[0].type).toBe("pie");
	// });

	// Add more tests to assert different behaviors and scenarios
});
