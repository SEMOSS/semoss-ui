import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import type { PathValue } from "react-hook-form";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@semoss/ui/next";
import { useBlock, type useFrame } from "../../../../../hooks";
import type { EchartVisualizationBlockDef } from "../../VisualizationBlock";

export interface ChartContextMenuProps {
	id: string;
	frame: ReturnType<typeof useFrame>;
	contextMenu: {
		mouseX: number;
		mouseY: number;
		// biome-ignore lint/suspicious/noExplicitAny: echart event value type is untyped
		value: any;
	} | null;
	// biome-ignore lint/suspicious/noExplicitAny: echart instance type is untyped
	chartInstance: any;
	onClose: () => void;
}
//Open this contextmenu when right click event is triggered
export const ChartContextMenu: React.FC<ChartContextMenuProps> = observer(
	({ id, frame, contextMenu, chartInstance, onClose }) => {
		const { data, setData } = useBlock<EchartVisualizationBlockDef>(id);
		const currentOperation = useRef({
			unfilterActive: false,
			filterActive: false,
			excludeActive: false,
		});
		//Checking the current action state for filtering and unfiltering to set and update the data to chart using setoption and setData
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on frame.data only
		useEffect(() => {
			if (frame.isLoading === false && frame.error === undefined) {
				//in contextmenu, when the unfilter is made active
				if (currentOperation.current.unfilterActive) {
					try {
						const optionDataProcessed = processReceivedData(
							frame.data,
						);
						data.option.xAxis.data = optionDataProcessed.xAxis;
						data.option.series[0].data = optionDataProcessed.yAxis;
						// biome-ignore lint/suspicious/noExplicitAny: echart PathValue type is untyped
						setData("option", data.option as PathValue<any, any>);
						if (chartInstance.setOption !== null) {
							chartInstance.setOption(data.option);
							currentOperation.current.unfilterActive = false;
						}
					} catch (_e) {}
				}
				//in contextmenu, when the filter is made active
				if (currentOperation.current.filterActive) {
					try {
						const optionDataProcessed = processReceivedData(
							frame.data,
						);
						data.option.xAxis.data = optionDataProcessed.xAxis;
						data.option.series[0].data = optionDataProcessed.yAxis;
						// biome-ignore lint/suspicious/noExplicitAny: echart PathValue type is untyped
						setData("option", data.option as PathValue<any, any>);
						if (chartInstance.setOption !== null) {
							chartInstance.setOption(data.option);
							currentOperation.current.filterActive = false;
							contextMenu = {
								...contextMenu,
								value: null,
							};
							disableSelection();
						}
					} catch (_e) {}
				}
				//in contextmenu, when the exclude is made active
				if (currentOperation.current.excludeActive) {
					try {
						const optionDataProcessed = processReceivedData(
							frame.data,
						);
						data.option.xAxis.data = optionDataProcessed.xAxis;
						data.option.series[0].data = optionDataProcessed.yAxis;
						// biome-ignore lint/suspicious/noExplicitAny: echart PathValue type is untyped
						setData("option", data.option as PathValue<any, any>);
						if (chartInstance.setOption !== null) {
							chartInstance.setOption(data.option);
							currentOperation.current.excludeActive = false;
							contextMenu = {
								...contextMenu,
								value: null,
							};
							disableSelection();
						}
					} catch (_e) {}
				}
			}
		}, [frame.data]);
		//run disable selection in a delay after filter action is completed
		function disableSelection() {
			setTimeout(() => {
				chartInstance.dispatchAction({
					type: "brush",
					areas: [],
				});
			}, 500);
		}
		//convert the received data from frame and update the data in the format for setting to chart
		function processReceivedData(frameResult) {
			return {
				xAxis: frameResult.values.map((item) => {
					return item[0];
				}),
				yAxis: frameResult.values.map((item) => {
					return item[1];
				}),
			};
		}
		const isOpen = contextMenu !== null;

		return (
			<DropdownMenu
				open={isOpen}
				onOpenChange={(open) => !open && onClose()}
			>
				<DropdownMenuContent
					style={
						contextMenu
							? {
									position: "fixed",
									top: contextMenu.mouseY,
									left: contextMenu.mouseX,
								}
							: {}
					}
				>
					{contextMenu && !data.contextMenu?.hideUnfilter ? (
						<DropdownMenuItem
							onClick={() => {
								frame.unfilter();
								let optionUp = data.option;
								const _reUpdate = data.option.series;
								optionUp = {
									...optionUp,
									series: null,
								};
								try {
									setData(
										"option",
										// biome-ignore lint/suspicious/noExplicitAny: echart PathValue type is untyped
										optionUp as PathValue<any, any>,
									);
									currentOperation.current.unfilterActive = true;
								} catch (_e) {}

								onClose();
							}}
						>
							Unfilter
						</DropdownMenuItem>
					) : null}
					{contextMenu && !data.contextMenu?.hideFilter ? (
						<DropdownMenuItem
							onClick={() => {
								frame.filter(
									`SetFrameFilter(${
										contextMenu.value.name
									}==${JSON.stringify(contextMenu.value.value)})`,
								);
								let optionUp = data.option;
								const _reUpdate = data.option.series;
								optionUp = {
									...optionUp,
									series: null,
								};
								setData(
									"option",
									// biome-ignore lint/suspicious/noExplicitAny: echart PathValue type is untyped
									optionUp as PathValue<any, any>,
								);
								currentOperation.current.filterActive = true;
								onClose();
							}}
						>
							Filter {contextMenu.value.name} ==
							{typeof contextMenu.value === "string"
								? contextMenu.value
								: JSON.stringify(contextMenu.value.value)}
						</DropdownMenuItem>
					) : null}
					{contextMenu && !data.contextMenu?.hideExclude ? (
						<DropdownMenuItem
							onClick={() => {
								frame.filter(
									`SetFrameFilter(${contextMenu.value.name}!="${contextMenu.value.value}")`,
								);
								let optionUp = data.option;
								const _reUpdate = data.option.series;
								optionUp = {
									...optionUp,
									series: null,
								};
								setData(
									"option",
									// biome-ignore lint/suspicious/noExplicitAny: echart PathValue type is untyped
									optionUp as PathValue<any, any>,
								);
								currentOperation.current.excludeActive = true;
								onClose();
							}}
						>
							Exclude {contextMenu.value.name} !={" "}
							{contextMenu?.value?.value}
						</DropdownMenuItem>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	},
);
