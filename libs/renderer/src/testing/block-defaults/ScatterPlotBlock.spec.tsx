import {
	EchartVisualizationBlockDef,
	VisualizationBlock,
} from "@/components/block-defaults/echart-visualization-block/VisualizationBlock";
import { act, render, renderHook, screen } from "../utils";
import { useBlock, useBlockSettings } from "@/hooks";

const blocks = {
	scatter: {
		id: "scatter",
		widget: "e-chart",
		data: {
			variation: "echart-scatter-plots",
			style: {
				height: 500,
				width: 400,
			},
			option: {
				title: {
					text: "",
					left: "center",
					top: "top",
				},
				tooltip: {
					show: true,
					trigger: "item",
					position: "bottom",
				},
				xAxis: {
					name: "",
					pixelName: "",
					nameLocation: "middle",
					show: true,
					type: "value",
					axisLine: {
						show: true,
					},
					axisTick: {
						show: true,
						alignWithLabel: true,
					},
					nameTextStyle: {
						fontSize: 12,
					},
					axisLabel: {
						show: true,
						rotate: 0,
						fontSize: 11,
						color: "#000000",
					},
				},
				yAxis: {
					name: "",
					pixelName: "",
					type: "value",
					show: true,
					axisLine: {
						show: true,
					},
					axisTick: {
						show: true,
						alignWithLabel: true,
					},
					nameTextStyle: {
						fontSize: 12,
					},
					axisLabel: {
						show: true,
						rotate: 0,
						fontSize: 12,
						color: "#000000",
					},
				},
				series: [
					{
						data: [],
						label: {
							show: true,
							rotate: 0,
							name: "",
							position: "top",
							fontFamily: "sans-serif",
							fontSize: 12,
							color: "#000000",
						},
						symbolSize: 15,
						symbol: "circle",
						type: "scatter",
					},
				],
				color: [
					"#5470c6",
					"#91cc75",
					"#fac858",
					"#ee6666",
					"#73c0de",
					"#3ba272",
					"#fc8452",
					"#9a60b4",
					"#ea7ccc",
				],
				toolbox: {
					feature: {
						brush: {
							type: ["rect"],
						},
					},
				},
				brush: {
					brushType: "rect",
					throttleType: "debounce",
					throttleDelay: 300,
					inBrush: {
						color: "rgba(255, 0, 0, 0.3)",
					},
					outBrush: {
						color: "rgba(0, 0, 0, 0.1)",
					},
				},
				reset: {
					axis: {
						xaxis: {
							show: true,
							axisLine: {
								show: true,
							},
							axisTick: {
								show: true,
								alignWithLabel: true,
							},
							nameTextStyle: {
								fontSize: 12,
							},
							axisLabel: {
								show: true,
								rotate: 0,
								fontSize: 11,
								color: "#000000",
							},
						},
						yaxis: {
							show: true,
							axisLine: {
								show: true,
							},
							axisTick: {
								show: true,
								alignWithLabel: true,
							},
							nameTextStyle: {
								fontSize: 12,
							},
							axisLabel: {
								show: true,
								rotate: 0,
								fontSize: 12,
								color: "#000000",
							},
						},
					},
					label: {
						show: true,
						rotate: 0,
						name: "",
						position: "top",
						fontFamily: "sans-serif",
						fontSize: 12,
						color: "#000000",
					},
				},
			},
			frame: {
				name: "",
			},
			show: "true",
		},
		listeners: {
			preProcess: {
				type: "sync",
				order: [],
			},
		},
		slots: {},
	},
};

describe("Scatter Plot Block", async () => {
	it("should render the scatter plot block", () => {
		const { container } = render(<VisualizationBlock id="scatter" />, {
			blocks: blocks,
		});

		// screen.debug();
		const scatter = container.querySelector("[data-block='scatter']");
		expect(scatter).toBeInTheDocument();
	});

	it("should use useBlock hook", async () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("scatter"),
			{ blocks, renderEngineId: "scatter" },
		);

		expect(result.current).toBeDefined();
		const variation = result.current.data.variation;
		expect(variation).toBe("echart-scatter-plots");
	});

	it("should use set Chart Title to be Hello", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("scatter"),
			{ blocks, renderEngineId: "scatter" },
		);

		expect(result.current).toBeDefined();

		act(() => {
			result.current.setData("option", {
				title: {
					text: "Hello",
				},
			});
		});

		const title = result.current.data.option.title.text;
		expect(title).toBe("Hello");
	});
});
