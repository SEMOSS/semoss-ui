import * as echarts from "echarts";
import { ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import type { EventData } from "./common";
import { TimeDateFormatter } from "./common";

// Type definitions
interface ProcessedEventData {
	value: [number, number, number];
	eventData: EventData;
}

interface ProcessApiDataResult {
	timeCategories: string[];
	eventData: ProcessedEventData[];
	timeToPosition: Map<string, number>;
}

interface DataZoomParams {
	batch?: Array<{
		start?: number;
		end?: number;
	}>;
}

interface TooltipParams {
	data?: ProcessedEventData;
}

interface RenderItemParams {
	coordSys: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

interface RenderItemAPI {
	value: (index: number) => number | undefined;
	coord: (point: [number, number]) => [number, number];
}

interface BarRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface ClippedRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface ShapeConfig {
	x: number;
	y: number;
	width: number;
	height: number;
	r: number[] | number;
}

interface RenderItemResult {
	type: "group" | "rect";
	children?: Array<{
		type: "rect";
		shape: ShapeConfig;
		style: {
			fill: string;
		};
	}>;
	shape?: ShapeConfig;
	style?: {
		fill: string;
	};
}

/*const ZoomButtonGroup = styled(ButtonGroup)({
	backgroundColor: "#fff",
	boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",

	"& .MuiButtonGroup-grouped": {
		minWidth: "32px",
		height: "32px",
		border: "none",

		"&:not(:last-of-type)": {
			borderRight: "1px solid #e0e0e0",
		},

		"&:hover": {
			backgroundColor: "#f5f5f5",
		},

		"&:disabled": {
			backgroundColor: "#f9f9f9",
			opacity: 0.5,
		},
	},
});

const ZoomIconButton = styled(IconButton)<{ position: "left" | "right" }>(
	({ position }) => ({
		padding: "4px",
		borderRadius: position === "left" ? "4px 0 0 4px" : "0 4px 4px 0",
	}),
);*/

interface AuditLogsTimelineProps {
	logs: EventData[];
}

export const AuditLogsTimeline: React.FC<AuditLogsTimelineProps> = ({
	logs,
}) => {
	const chartRef = useRef<HTMLDivElement>(null);
	const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(
		null,
	);
	const [zoomState, setZoomState] = useState({ start: 0, end: 100 });

	const processApiData = (): ProcessApiDataResult => {
		const allTimes = new Set<string>();
		const timeToPosition = new Map<string, number>();

		logs.forEach((event) => {
			allTimes.add(TimeDateFormatter(event.startTime).time);
			allTimes.add(TimeDateFormatter(event.endTime).time);
		});

		const sortedTimes = Array.from(allTimes).sort((a, b) => {
			const timeA = new Date(`1970-01-01 ${a}`);
			const timeB = new Date(`1970-01-01 ${b}`);
			return timeA.getTime() - timeB.getTime();
		});

		sortedTimes.forEach((time, index) => {
			timeToPosition.set(time, index);
		});

		const eventData: ProcessedEventData[] = [];

		logs.forEach((event) => {
			const startPos =
				timeToPosition.get(TimeDateFormatter(event.startTime).time) ??
				-1; //need testing with -1 position
			const endPos =
				timeToPosition.get(TimeDateFormatter(event.endTime).time) ?? -1; //need testing with -1 position

			const dataPoint: ProcessedEventData = {
				value: [startPos, event.latency, endPos],
				eventData: event,
			};

			eventData.push(dataPoint);
		});

		return {
			timeCategories: sortedTimes,
			eventData,
			timeToPosition,
		};
	};

	const calculateXAxisLabelConfig = (
		timeCategories: string[],
		chartWidth: number = 800,
	) => {
		const totalLabels = timeCategories.length;
		const availableWidth = chartWidth - 80; // Account for margins
		const averageLabelWidth = 60; // Estimated width per label in pixels
		const maxLabelsWithoutOverlap = Math.floor(
			availableWidth / averageLabelWidth,
		);

		// If we have too many labels, use smart interval calculation
		if (totalLabels > maxLabelsWithoutOverlap) {
			const interval =
				Math.ceil(totalLabels / maxLabelsWithoutOverlap) - 1;

			// For very congested scenarios, tilt the labels
			if (totalLabels > maxLabelsWithoutOverlap * 1.5) {
				return {
					interval: interval,
					rotate: 45,
					margin: 12,
				};
			} else {
				return {
					interval: interval,
					rotate: 0,
					margin: 8,
				};
			}
		} else if (totalLabels > maxLabelsWithoutOverlap * 0.7) {
			// Moderate congestion - just tilt
			return {
				interval: 0,
				rotate: 30,
				margin: 10,
			};
		} else {
			return {
				interval: 0,
				rotate: 0,
				margin: 8,
			};
		}
	};

	const handleZoomIn = () => {
		if (!chartInstance) return;

		const currentRange = zoomState.end - zoomState.start;
		if (currentRange <= 15) return;

		const center = (zoomState.start + zoomState.end) / 2;
		const newRange = currentRange * 0.6;
		const newStart = Math.max(0, center - newRange / 2);
		const newEnd = Math.min(100, center + newRange / 2);

		setZoomState({ start: newStart, end: newEnd });

		chartInstance.dispatchAction({
			type: "dataZoom",
			start: newStart,
			end: newEnd,
		});
	};

	const handleZoomOut = () => {
		if (!chartInstance) return;

		const currentRange = zoomState.end - zoomState.start;
		if (currentRange >= 100) return;

		const center = (zoomState.start + zoomState.end) / 2;
		const newRange = Math.min(100, currentRange * 1.4);
		const newStart = Math.max(0, center - newRange / 2);
		const newEnd = Math.min(100, center + newRange / 2);

		setZoomState({ start: newStart, end: newEnd });

		chartInstance.dispatchAction({
			type: "dataZoom",
			start: newStart,
			end: newEnd,
		});
	};
	//biome-ignore lint/correctness/useExhaustiveDependencies: chart needs to be re-rendered on logs change
	useEffect(() => {
		if (chartRef.current && logs.length > 0) {
			const chart = echarts.init(chartRef.current);
			setChartInstance(chart);

			const { timeCategories, eventData } = processApiData();

			// Calculate optimal x-axis configuration based on data density
			const chartWidth = chartRef.current.clientWidth || 800;
			const xAxisConfig = calculateXAxisLabelConfig(
				timeCategories,
				chartWidth,
			);

			const option = {
				backgroundColor: "#ffffff",
				animation: false,
				tooltip: {
					trigger: "item",
					backgroundColor: "rgba(255, 255, 255, 0.98)",
					borderColor: "#e0e0e0",
					borderRadius: 8,
					padding: [12, 16],
					textStyle: {
						color: "#333",
						fontSize: 13,
						fontFamily:
							'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
					},
					boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
					formatter: (params: TooltipParams): string => {
						if (!params || !params.data || !params.data.eventData) {
							return "No data available";
						}

						const eventData = params.data.eventData;

						const truncateText = (
							text: string | null,
							maxLength: number = 50,
						): string => {
							return text?.length > maxLength
								? `${text.substring(0, maxLength)}...`
								: text;
						};

						return `
              <div style="
                width: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.4;
              ">
                <div style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 10px;
                  padding-bottom: 6px;
                  border-bottom: 1px solid #f0f0f0;
                ">
                  <div style="font-weight: 600; color: #333; font-size: 12px;">${
						TimeDateFormatter(eventData.startTime).time
					} - ${TimeDateFormatter(eventData.endTime).time}</div>
                  <div style="
                    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #333;
                  ">${eventData.latency}ms</div>
                </div>
                
                <div style="margin-bottom: 8px;">
                  <div style="
                    color: #4caf50; 
                    font-size: 11px; 
                    font-weight: 600; 
                    margin-bottom: 4px; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px;
                  ">Request</div>
                  <div style="
                    font-size: 12px; 
                    line-height: 1.4; 
                    color: #333;
                    background: #f8fcf9;
                    padding: 6px 8px;
                    border-radius: 4px;
                    border-left: 2px solid #4caf50;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                  ">${truncateText(eventData.request)}</div>
                </div>
                
                <div style="margin-bottom: 8px;">
                  <div style="
                    color: #e91e63; 
                    font-size: 11px; 
                    font-weight: 600; 
                    margin-bottom: 4px; 
                    text-transform: uppercase; 
                    letter-spacing: 0.5px;
                  ">Response</div>
                  <div style="
                    font-size: 12px; 
                    line-height: 1.4; 
                    color: #333;
                    background: #fdf8fc;
                    padding: 6px 8px;
                    border-radius: 4px;
                    border-left: 2px solid #e91e63;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                  ">${truncateText(eventData.response)}</div>
                </div>
                
                <div style="
                  display: flex;
                  justify-content: flex-end;
                  margin-top: 6px;
                ">
                  <div style="
                    background: #f5f5f5;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #666;
                  ">${eventData.tokens} tokens</div>
                </div>
              </div>
            `;
					},
					extraCssText: `
            min-width: 300px !important;
            white-space: normal !important;
            word-wrap: break-word !important;
          `,
				},
				dataZoom: [
					{
						type: "inside",
						xAxisIndex: 0,
						filterMode: "filter",
						zoomOnMouseWheel: true,
						moveOnMouseWheel: false,
						preventDefaultMouseMove: true,
						throttle: 100,
						minSpan: 10,
						maxSpan: 100,
					},
				],
				grid: {
					left: "50px",
					right: "30px",
					top: "30px",
					bottom: xAxisConfig.rotate > 0 ? "90px" : "70px",
					containLabel: true,
				},
				xAxis: {
					type: "category",
					data: timeCategories,
					name: "Timestamp",
					nameLocation: "middle",
					nameGap: xAxisConfig.rotate > 0 ? 60 : 40,
					nameTextStyle: {
						color: "#666",
						fontSize: 12,
					},
					axisLine: {
						show: true,
						onZero: false,
						lineStyle: {
							color: "#e0e0e0",
						},
					},
					axisTick: {
						show: true,
						alignWithLabel: true,
						lineStyle: {
							color: "#e0e0e0",
						},
					},
					axisLabel: {
						color: "#666",
						fontSize: 11,
						margin: xAxisConfig.margin,
						rotate: xAxisConfig.rotate,
						interval: xAxisConfig.interval,
						formatter: (value: string): string => {
							// Shorten the format when rotated to save space
							if (xAxisConfig.rotate > 0) {
								return value.replace(/:\d{2}\s(AM|PM)$/, "$1");
							}
							return value.replace(/:\d{2}\s(AM|PM)$/, " $1");
						},
						...(xAxisConfig.rotate > 0 && {
							align: "right",
							verticalAlign: "middle",
						}),
					},
					splitLine: {
						show: true,
						alignWithLabel: true,
						lineStyle: {
							color: "#f0f0f0",
							type: "dashed",
						},
					},
				},
				yAxis: {
					type: "value",
					name: "Latency (ms)",
					nameLocation: "middle",
					nameGap: 50,
					nameTextStyle: {
						color: "#666",
						fontSize: 12,
						fontWeight: 500,
					},
					nameRotate: 90,
					min: 0,
					max: Math.max(...logs.map((d) => d.latency)) + 20,
					axisLine: {
						show: true,
						lineStyle: {
							color: "#e0e0e0",
						},
					},
					axisTick: {
						show: false,
					},
					axisLabel: {
						color: "#666",
						fontSize: 12,
					},
					splitLine: {
						show: true,
						lineStyle: {
							color: "#f0f0f0",
							type: "dashed",
						},
					},
				},
				legend: {
					data: ["Request", "Response"],
					bottom: 0,
					left: 15,
					itemGap: 30,
					textStyle: {
						color: "#333",
						fontSize: 13,
						fontWeight: 500,
					},
					icon: "rect",
					itemWidth: 20,
					itemHeight: 6,
				},
				series: [
					{
						name: "Request",
						type: "custom",
						data: eventData,
						clip: true,
						itemStyle: {
							color: "#4caf50",
						},
						renderItem: (
							params: RenderItemParams,
							api: RenderItemAPI,
						): RenderItemResult | null => {
							try {
								const startPos = api.value(0);
								const latency = api.value(1);
								const endPos = api.value(2);

								if (
									startPos === undefined ||
									latency === undefined ||
									endPos === undefined
								) {
									return null;
								}

								const startCoord = api.coord([
									startPos,
									latency,
								]);
								const endCoord = api.coord([endPos, latency]);

								const coordSys = params.coordSys;
								if (!coordSys) return null;

								const barRect: BarRect = {
									x: startCoord[0],
									y: startCoord[1] - 3,
									width: Math.max(
										endCoord[0] - startCoord[0],
										16,
									),
									height: 6,
								};

								const gridRect = {
									x: coordSys.x,
									y: coordSys.y,
									width: coordSys.width,
									height: coordSys.height,
								};

								const clippedRect =
									echarts.graphic.clipRectByRect(
										barRect,
										gridRect,
									) as ClippedRect | null;

								if (!clippedRect || clippedRect.width <= 0) {
									return null;
								}

								const halfWidth = clippedRect.width / 2;

								return {
									type: "group",
									children: [
										{
											type: "rect",
											shape: {
												x: clippedRect.x,
												y: clippedRect.y,
												width: halfWidth,
												height: clippedRect.height,
												r: [3, 0, 0, 3],
											},
											style: {
												fill: "#4caf50",
											},
										},
										{
											type: "rect",
											shape: {
												x: clippedRect.x + halfWidth,
												y: clippedRect.y,
												width: halfWidth,
												height: clippedRect.height,
												r: [0, 3, 3, 0],
											},
											style: {
												fill: "#e91e63",
											},
										},
									],
								};
							} catch (error) {
								console.warn(
									"Error rendering custom series item:",
									error,
								);
								return null;
							}
						},
					},
					{
						name: "Response",
						type: "custom",
						data: [],
						itemStyle: {
							color: "#e91e63",
						},
						renderItem: (): null => null,
					},
				],
			};

			chart.setOption(option);

			chart.on("dataZoom", (params: DataZoomParams) => {
				try {
					if (params?.batch?.[0]) {
						const zoomInfo = params.batch[0];
						setZoomState({
							start: zoomInfo.start || 0,
							end: zoomInfo.end || 100,
						});
					}
				} catch (error) {
					console.warn("Error handling dataZoom event:", error);
				}
			});

			setTimeout(() => {
				chart.resize({
					width: "auto",
					height: 350,
				});
			}, 100);

			const handleResize = () => {
				chart.resize();
			};

			window.addEventListener("resize", handleResize);

			return () => {
				window.removeEventListener("resize", handleResize);
				chart.dispose();
			};
		}
	}, [logs]);

	if (logs.length === 0) {
		return (
			<div className="rounded-[8px] bg-white p-0 pb-2 shadow-lg">
				<div className="flex items-center justify-between p-4">
					<span className="font-semibold text-[#333] text-[18px]">
						Event History
					</span>
				</div>
				<div className="p-4 text-center">
					<span className="font-normal text-[14px] text-gray-500">
						No logs available.
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="h-auto rounded-[8px] bg-white p-0 pb-4 shadow-lg">
			<div className="flex items-center justify-between p-4">
				<span className="font-semibold text-[#333] text-[18px]">
					Event History
				</span>
				{/** changing from div role="group", to fieldset */}
				<fieldset
					className="inline-flex gap-1 rounded-md bg-white shadow-sm"
					style={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
				>
					<Button
						variant="ghost"
						className="rounded-[4px_0_0_4px] px-[4px] py-[4px]"
						onClick={handleZoomIn}
						disabled={zoomState.end - zoomState.start <= 15}
					>
						<ZoomInIcon
							fontSize="small"
							style={{ color: "#666" }}
						/>
					</Button>
					<Button
						variant="ghost"
						className="rounded-[0_4px_4px_0] px-[4px] py-[4px]"
						onClick={handleZoomOut}
						disabled={
							zoomState.start === 0 && zoomState.end === 100
						}
					>
						<ZoomOutIcon
							fontSize="small"
							style={{ color: "#666" }}
						/>
					</Button>
				</fieldset>
			</div>

			<div
				className="m-0 h-[295px] w-full bg-[#FFFFFF] pb-[10px]"
				ref={chartRef}
			>
				&nbsp;
			</div>
		</div>
	);
};
