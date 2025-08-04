import {
	ZoomIn as ZoomInIcon,
	ZoomOut as ZoomOutIcon,
} from "@mui/icons-material";
import * as echarts from "echarts";
import React, { useEffect, useRef, useState } from "react";
import {
	Box,
	ButtonGroup,
	IconButton,
	Paper,
	styled,
	Typography,
} from "@semoss/ui";
import { EventData } from "../EngineDashboard";

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

// MUI Styled Components
const Container = styled(Paper)({
	padding: 0,
	paddingBottom: 8,
	backgroundColor: "#ffffff",
	borderRadius: 8,
});

const Header = styled(Box)({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: 16,
});

const ChartWrapper = styled("div")(({ theme }) => ({
	width: "100%",
	height: "295px",
	backgroundColor: "#ffffff",
	margin: 0,
	paddingBottom: "10px",
}));

const StyledTitle = styled(Typography)({
	fontWeight: 600,
	color: "#333",
	fontSize: "18px",
});

const ZoomButtonGroup = styled(ButtonGroup)({
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
);

interface EventHistoryProps {
	logs: EventData[];
}

const EventHistory: React.FC<EventHistoryProps> = ({ logs }) => {
	const chartRef = useRef<HTMLDivElement>(null);
	const [chartInstance, setChartInstance] = useState<echarts.ECharts | null>(
		null,
	);
	const [zoomState, setZoomState] = useState({ start: 0, end: 100 });

	const processApiData = (): ProcessApiDataResult => {
		const allTimes = new Set<string>();
		const timeToPosition = new Map<string, number>();

		logs.forEach((event) => {
			allTimes.add(event.startTime);
			allTimes.add(event.endTime);
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

		logs.forEach((event, index) => {
			const startPos = timeToPosition.get(event.startTime)!;
			const endPos = timeToPosition.get(event.endTime)!;

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

	useEffect(() => {
		if (chartRef.current) {
			const chart = echarts.init(chartRef.current);
			setChartInstance(chart);

			const { timeCategories, eventData } = processApiData();

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
					formatter: function (params: TooltipParams): string {
						if (!params || !params.data || !params.data.eventData) {
							return "No data available";
						}

						const eventData = params.data.eventData;

						const truncateText = (
							text: string,
							maxLength: number = 50,
						): string => {
							return text.length > maxLength
								? text.substring(0, maxLength) + "..."
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
						eventData.startTime
					} - ${eventData.endTime}</div>
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
                  ">Prompt</div>
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
                  ">${truncateText(eventData.prompt)}</div>
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
					bottom: "70px",
					containLabel: true,
				},
				xAxis: {
					type: "category",
					data: timeCategories,
					name: "Timestamp",
					nameLocation: "middle",
					nameGap: 40,
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
						margin: 8,
						rotate: 0,
						interval: 0,
						formatter: function (value: string): string {
							return value.replace(/:\d{2}\s(AM|PM)$/, " $1");
						},
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
					data: ["Prompt", "Response"],
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
						name: "Prompt",
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

			chart.on("dataZoom", function (params: DataZoomParams) {
				try {
					if (params.batch && params.batch[0]) {
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
				chart.resize();
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
	}, [chartRef, logs]);

	return (
		<Container elevation={1}>
			<Header>
				<StyledTitle variant="h6">Event History</StyledTitle>

				<ZoomButtonGroup variant="outlined" size="small">
					<ZoomIconButton
						position="left"
						onClick={handleZoomIn}
						disabled={zoomState.end - zoomState.start <= 15}
					>
						<ZoomInIcon fontSize="small" sx={{ color: "#666" }} />
					</ZoomIconButton>
					<ZoomIconButton
						position="right"
						onClick={handleZoomOut}
						disabled={
							zoomState.start === 0 && zoomState.end === 100
						}
					>
						<ZoomOutIcon fontSize="small" sx={{ color: "#666" }} />
					</ZoomIconButton>
				</ZoomButtonGroup>
			</Header>

			<ChartWrapper ref={chartRef} />
		</Container>
	);
};

export default EventHistory;
