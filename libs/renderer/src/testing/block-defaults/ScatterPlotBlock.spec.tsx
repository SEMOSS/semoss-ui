import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "@/components/block-defaults/echart-visualization-block/VisualizationBlock";
import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	userEvent,
} from "../utils";
import { useBlock, useBlockSettings } from "@/hooks";
import { TooltipScatterPlot } from "@/components/block-defaults/echart-visualization-block/variant/scatter-plot/TooltipScatterPlot";
import { EditXAxisScatterPlot } from "@/components/block-defaults/echart-visualization-block/variant/scatter-plot/EditXAxisScatterPlot";

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
					name: "DemoX",
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
									formatter: "Test1",
								},
							},
							{
								value: [6, 112.5],
								label: {
									formatter: "Test2",
								},
							},
							{
								value: [2, 50],
								label: {
									formatter: "Test3",
								},
							},
							{
								value: [1, 0],
								label: {
									formatter: "Test4",
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
					formatter: "Test1",
				},
			},
			{
				value: [6, 112.5],
				label: {
					formatter: "Test2",
				},
			},
			{
				value: [2, 50],
				label: {
					formatter: "Test3",
				},
			},
			{
				value: [1, 0],
				label: {
					formatter: "Test4",
				},
			},
		]);
	});

	it("should have default width and height 400 and 500 respectively", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("scatter"),
			{
				blocks,
				renderEngineId: "scatter",
			},
		);
		expect(result.current).toBeDefined();

		expect(result.current.data.style.width).toBe(400);
		expect(result.current.data.style.height).toBe(500);
	});
	it("should set width and height", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("scatter"),
			{
				blocks,
				renderEngineId: "scatter",
			},
		);
		expect(result.current).toBeDefined();

		act(() => {
			result.current.setData("style", {
				width: 800,
				height: 1000,
			});
		});

		expect(result.current.data.style.width).toBe(800);
		expect(result.current.data.style.height).toBe(1000);
	});

	it("should set xAxis Label", async () => {
		const { result } = renderHook(
			() => useBlockSettings<EchartVisualizationBlockDef>("scatter"),
			{
				blocks,
				renderEngineId: "scatter",
				customChildren: <EditXAxisScatterPlot id="scatter" path={"option"} />,
			},
		);
		expect(result.current).toBeDefined();

		// Assume the label for the input is "Set X Axis Title"
		// since there's no way to set test-id, use getElementById can be an alternative
		const input = document.getElementById("xaxis-title") as HTMLInputElement;
		// console.log({ input });

		// Update the input field's value
		fireEvent.change(input, { target: { value: "X-Axis Label" } });
		// const input = screen.queryAllByRole("textbox");

		expect(result.current.data.option.xAxis.name).toBe("X-Axis Label");
	});
});
