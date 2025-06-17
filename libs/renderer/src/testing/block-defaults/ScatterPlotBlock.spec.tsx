import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "@/components/block-defaults/echart-visualization-block/VisualizationBlock";
import { act, fireEvent, render, renderHook, screen } from "../utils";
import { useBlock, useBlockSettings } from "@/hooks";
import { TooltipScatterPlot } from "@/components/block-defaults/echart-visualization-block/variant/scatter-plot/TooltipScatterPlot";

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

	// it("should use set Chart Title to be Hello", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{ blocks, renderEngineId: "scatter" },
	// 	);

	// 	expect(result.current).toBeDefined();

	// 	act(() => {
	// 		result.current.setData("option.title", { text: "Hello" });
	// 		console.log({
	// 			state: result.current.state.getBlock("scatter").data.option.title.text,
	// 		});
	// 	});

	// 	const title = result.current.data.option.title.text;
	// 	expect(title).toBe("Hello");
	// });
	it("should use set Chart Title to be Hello", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("scatter"),
			{ blocks, renderEngineId: "scatter" },
		);

		expect(result.current).toBeDefined();

		act(() => {
			result.current.setData("option.title", { text: "Hello" });
		});

		const title = result.current.data.option.title.text;
		expect(title).toBe("Hello");
	});
	it("should check Show Tooltip is enabled by default", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("scatter"),
			{
				blocks,
				renderEngineId: "scatter",
				customChildren: <TooltipScatterPlot id="scatter" path={"option"} />,
			},
		);

		const toggleTooltipSwitch = screen.getByRole("checkbox", { hidden: true });

		expect(toggleTooltipSwitch).toBeChecked();
		expect(result.current.data.option.tooltip.show).toBe(true);
	});
	it("should check Show Tooltip is toggled off", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("scatter"),
			{
				blocks,
				renderEngineId: "scatter",
				customChildren: <TooltipScatterPlot id="scatter" path={"option"} />,
			},
		);

		const toggleTooltipSwitch = screen.getByRole("checkbox", { hidden: true });

		expect(toggleTooltipSwitch).toBeChecked();
		fireEvent.click(toggleTooltipSwitch);
		expect(toggleTooltipSwitch).not.toBeChecked();
		expect(result.current.data.option.tooltip.show).toBe(false);
	});
	it("should toggle Show Tooltip", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("scatter"),
			{
				blocks,
				renderEngineId: "scatter",
				customChildren: <TooltipScatterPlot id="scatter" path={"option"} />,
			},
		);

		const toggleTooltipSwitch = screen.getByRole("checkbox", { hidden: true });

		expect(toggleTooltipSwitch).toBeChecked();
		fireEvent.click(toggleTooltipSwitch);
		expect(toggleTooltipSwitch).not.toBeChecked();
	});
	it("should set data", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("scatter"),
			{
				blocks,
				renderEngineId: "scatter",
				customChildren: <TooltipScatterPlot id="scatter" path={"option"} />,
			},
		);

		expect(result).toBeDefined();
		act(() => {
			result.current.setData("option", {
				series: [
					{
						data: [
							{
								value: [1, 1],
								label: {
									formatter: "123",
								},
							},
							{
								value: [6, 112.5],
								label: {
									formatter: "36C10G14D1004",
								},
							},
							{
								value: [2, 50],
								label: {
									formatter: "ghjh",
								},
							},
							{
								value: [1, 0],
								label: {
									formatter: "philtest123",
								},
							},
						],
					},
				],
			});
		});
		const series = result.current.data.option.series[0].data;
		// console.log({ series });
		expect(series).toEqual([
			{
				value: [1, 1],
				label: {
					formatter: "123",
				},
			},
			{
				value: [6, 112.5],
				label: {
					formatter: "36C10G14D1004",
				},
			},
			{
				value: [2, 50],
				label: {
					formatter: "ghjh",
				},
			},
			{
				value: [1, 0],
				label: {
					formatter: "philtest123",
				},
			},
		]);
	});
});
