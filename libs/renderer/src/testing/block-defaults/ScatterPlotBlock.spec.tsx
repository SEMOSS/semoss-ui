import { waitFor } from "@testing-library/react";
import {
	type EchartVisualizationBlockDef,
	VisualizationBlock,
} from "../../components/block-defaults/echart-visualization-block/VisualizationBlock";
// import {
// 	EditXAxisScatterPlot,
// 	TooltipScatterPlot,
// } from "../../components/block-defaults/echart-visualization-block/variant/scatter-plot/ScatterPlot";
import { useBlock } from "../../hooks";
import { render, renderHook } from "../utils";

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
					text: "Hello",
					left: "center",
					top: "top",
				},
				tooltip: {
					show: true,
					trigger: "item",
					position: "bottom",
				},
				xAxis: {
					name: ["DemoX"],
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
	it("should render the scatter plot block", async () => {
		const { container } = render(
			<VisualizationBlock id={blocks.scatter.id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const scatter = container.querySelector("[data-block='scatter']");
			expect(scatter).toBeInTheDocument();
		});
	});

	it("should use useBlock hook", async () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("scatter"),
			{ blocks, renderEngineId: "scatter" },
		);

		await waitFor(() => {
			expect(result.current).toBeDefined();
			const variation = result.current.data.variation;
			expect(variation).toBe("echart-scatter-plots");
		});
	});

	it("should use set Chart Title to be Hello", async () => {
		const { result } = renderHook(
			() => useBlock<EchartVisualizationBlockDef>("scatter"),
			{ blocks, renderEngineId: "scatter" },
		);

		await waitFor(() => {
			expect(result.current).toBeDefined();
			const title = result.current.data.option.title.text;
			expect(title).toBe("Hello");
		});
	});

	// it("should toggle Show Tooltip", async () => {
	// 	renderHook(() => useBlock<EchartVisualizationBlockDef>("scatter"), {
	// 		blocks,
	// 		renderEngineId: "scatter",
	// 		customChildren: (
	// 			<TooltipScatterPlot id={blocks.scatter.id} path={"option"} />
	// 		),
	// 	});

	// 	const toggleTooltipSwitch = screen.getByRole("checkbox", {
	// 		hidden: true,
	// 	});

	// 	await waitFor(() => {
	// 		expect(toggleTooltipSwitch).toBeChecked();
	// 		fireEvent.click(toggleTooltipSwitch);
	// 		expect(toggleTooltipSwitch).not.toBeChecked();
	// 	});
	// });

	// it("should set data", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{
	// 			blocks,
	// 			renderEngineId: "scatter",
	// 			customChildren: (
	// 				<TooltipScatterPlot
	// 					id={blocks.scatter.id}
	// 					path={"option"}
	// 				/>
	// 			),
	// 		},
	// 	);
	// 	expect(result).toBeDefined();
	// 	act(() => {
	// 		result.current.setData("option", {
	// 			series: [
	// 				{
	// 					data: [
	// 						{
	// 							value: [1, 1],
	// 							label: {
	// 								formatter: "Test1",
	// 							},
	// 						},
	// 						{
	// 							value: [6, 112.5],
	// 							label: {
	// 								formatter: "Test2",
	// 							},
	// 						},
	// 						{
	// 							value: [2, 50],
	// 							label: {
	// 								formatter: "Test3",
	// 							},
	// 						},
	// 						{
	// 							value: [1, 0],
	// 							label: {
	// 								formatter: "Test4",
	// 							},
	// 						},
	// 					],
	// 				},
	// 			],
	// 		});
	// 	});
	// 	const series = result.current.data.option.series[0].data;
	// 	// console.log({ series });
	// 	expect(series).toEqual([
	// 		{
	// 			value: [1, 1],
	// 			label: {
	// 				formatter: "Test1",
	// 			},
	// 		},
	// 		{
	// 			value: [6, 112.5],
	// 			label: {
	// 				formatter: "Test2",
	// 			},
	// 		},
	// 		{
	// 			value: [2, 50],
	// 			label: {
	// 				formatter: "Test3",
	// 			},
	// 		},
	// 		{
	// 			value: [1, 0],
	// 			label: {
	// 				formatter: "Test4",
	// 			},
	// 		},
	// 	]);
	// });

	// it("should have default width and height 400 and 500 respectively", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{
	// 			blocks,
	// 			renderEngineId: "scatter",
	// 		},
	// 	);
	// 	expect(result.current).toBeDefined();
	// 	expect(result.current.data.style.width).toBe(400);
	// 	expect(result.current.data.style.height).toBe(500);
	// });
	// it("should set width and height", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{
	// 			blocks,
	// 			renderEngineId: "scatter",
	// 		},
	// 	);
	// 	expect(result.current).toBeDefined();
	// 	act(() => {
	// 		result.current.setData("style", {
	// 			width: 800,
	// 			height: 1000,
	// 		});
	// 	});
	// 	expect(result.current.data.style.width).toBe(800);
	// 	expect(result.current.data.style.height).toBe(1000);
	// });

	// it("should set xAxis Label", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{
	// 			blocks,
	// 			renderEngineId: "scatter",
	// 			customChildren: (
	// 				<EditXAxisScatterPlot
	// 					id={blocks.scatter.id}
	// 					path={"option"}
	// 				/>
	// 			),
	// 		},
	// 	);
	// 	expect(result.current).toBeDefined();
	// 	// Assume the label for the input is "Set X Axis Title"
	// 	// since there's no way to set test-id, use getElementById can be an alternative
	// 	// const input = document.getElementById(
	// 	// 	"xaxis-title",
	// 	// ) as HTMLInputElement;
	// 	// Update the input field's value
	// 	// fireEvent.change(input, { target: { value: "X-Axis Label" } });
	// 	// // const input = screen.queryAllByRole("textbox");
	// 	// expect(result.current.data.option.xAxis.name).toBe("X-Axis Label");
	// });
	// it("should set xAxis font size", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{
	// 			blocks,
	// 			renderEngineId: "scatter",
	// 			customChildren: (
	// 				<EditXAxisScatterPlot
	// 					id={blocks.scatter.id}
	// 					path={"option"}
	// 				/>
	// 			),
	// 		},
	// 	);
	// 	expect(result.current).toBeDefined();
	// 	expect(result.current.data.option.xAxis.nameTextStyle.fontSize).toBe(
	// 		12,
	// 	);
	// 	// const input = document.getElementById(
	// 	// 	"xaxis-edit-title-font-size",
	// 	// ) as HTMLInputElement;
	// 	// // Update the input field's value
	// 	// fireEvent.change(input, { target: { value: 20 } });
	// 	// // const input = screen.queryAllByRole("textbox");
	// 	// const fontSize = Number(
	// 	// 	result.current.data.option.xAxis.nameTextStyle.fontSize,
	// 	// );
	// 	// expect(fontSize).toBe(20);
	// });
	// it("should check if Show/Hide Axis toggle is true by default", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{
	// 			blocks,
	// 			renderEngineId: "scatter",
	// 			customChildren: (
	// 				<EditXAxisScatterPlot
	// 					id={blocks.scatter.id}
	// 					path={"option"}
	// 				/>
	// 			),
	// 		},
	// 	);
	// 	expect(result.current).toBeDefined();
	// 	const label = screen.queryByText("Show/Hide Axis");
	// 	// Current work around in querying checkbox/toggle with labels
	// 	// find parent element of the label
	// 	const parentElem = label.parentElement;
	// 	// select toggle input
	// 	const toggle = parentElem.querySelector('input[type="checkbox"]');
	// 	expect(toggle).toBeChecked;
	// 	const xAxisVisible = result.current.data.option.xAxis.show as boolean;
	// 	expect(xAxisVisible).toBeTruthy();
	// });

	// it("should check if Show/Hide Axis toggle can be toggled off", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{
	// 			blocks,
	// 			renderEngineId: "scatter",
	// 			customChildren: (
	// 				<EditXAxisScatterPlot
	// 					id={blocks.scatter.id}
	// 					path={"option"}
	// 				/>
	// 			),
	// 		},
	// 	);
	// 	expect(result.current).toBeDefined();
	// 	const label = screen.queryByText("Show/Hide Axis");
	// 	const parentElem = label.parentElement;
	// 	const toggle = parentElem.querySelector('input[type="checkbox"]');
	// 	expect(toggle).toBeInTheDocument();
	// 	const xAxisVisible = result.current.data.option.xAxis.show as boolean;
	// 	expect(xAxisVisible).toBe(true);
	// 	expect(toggle).toBeChecked();
	// 	// fireEvent.click(toggle);
	// 	// expect(toggle).not.toBeChecked();
	// 	// // This will result in the data block 'show' property to be set to false
	// 	// expect(result.current.data.option.xAxis.show).toBe(false);
	// });

	// it("should check if Show Axis Title toggle can be toggled", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{
	// 			blocks,
	// 			renderEngineId: "scatter",
	// 			customChildren: (
	// 				<EditXAxisScatterPlot
	// 					id={blocks.scatter.id}
	// 					path={"option"}
	// 				/>
	// 			),
	// 		},
	// 	);
	// 	expect(result.current).toBeDefined();
	// 	const label = screen.queryByText("Show Axis Title");
	// 	const parentElem = label.parentElement;
	// 	const toggle = parentElem.querySelector('input[type="checkbox"]');
	// 	expect(toggle).toBeInTheDocument();
	// 	const xAxisTitle = result.current.data.option.xAxis.name;
	// 	expect(xAxisTitle).toContain("DemoX");
	// 	expect(toggle).toBeChecked();
	// 	const titleInputLabel = screen.queryByText("Set X Axis Title");
	// 	const titleInput =
	// 		titleInputLabel.parentElement.querySelector('input[type="text"]');
	// 	expect(titleInput).toBeInTheDocument();
	// 	// fireEvent.click(toggle);
	// 	// expect(titleInput).not.toBeInTheDocument();
	// 	// expect(toggle).not.toBeChecked();
	// 	// // expect(result.current.data.option.xAxis.name).toBe("");
	// });

	// it("should set X Axis Title", async () => {
	// 	const { result } = renderHook(
	// 		() => useBlock<EchartVisualizationBlockDef>("scatter"),
	// 		{
	// 			blocks,
	// 			renderEngineId: "scatter",
	// 			customChildren: (
	// 				<EditXAxisScatterPlot
	// 					id={blocks.scatter.id}
	// 					path={"option"}
	// 				/>
	// 			),
	// 		},
	// 	);

	// 	await waitFor(() => {
	// 		expect(result.current).toBeDefined();
	// 		const label = screen.getByDisplayValue("Set X Axis Title");
	// 		const parentElem = label.parentElement;
	// 		const titleInput = parentElem.querySelector('input[type="text"]');
	// 		expect(titleInput).toBeInTheDocument();
	// 		const xAxisTitle = result.current.data.option.xAxis.name;
	// 		expect(xAxisTitle).toContain("DemoX");
	// 	});
	// 	// fireEvent.change(titleInput, { target: { value: ["Hello World"] } });
	// 	// expect(result.current.data.option.xAxis.name).toContain("Hello World");
	// });

	// TODO: will need to complete other settings test
});
