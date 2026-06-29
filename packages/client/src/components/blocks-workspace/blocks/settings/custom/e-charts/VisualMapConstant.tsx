import {
	BarChart2 as BarChartIcon,
	CircleDot as BubbleChartIcon,
	LayoutDashboard as DashboardIcon,
} from "lucide-react";
import AreaIcon from "../../../../../../assets/block-settings/img/AreaIcon.svg";
import BoxIcon from "../../../../../../assets/block-settings/img/Box.svg";
import BulletIcon from "../../../../../../assets/block-settings/img/Bullet.svg";
import ButtonIcon from "../../../../../../assets/block-settings/img/Button.svg";
import ChoroPlethIcon from "../../../../../../assets/block-settings/img/ChroplethIcon.svg";
import CloudIcon from "../../../../../../assets/block-settings/img/CloudIcon.svg";
import ClusterIcon from "../../../../../../assets/block-settings/img/Cluster.svg";
import DendrogramIcon from "../../../../../../assets/block-settings/img/dendrogram.svg";
import FunnelIcon from "../../../../../../assets/block-settings/img/Funnel.svg";
import FilterIcon from "../../../../../../assets/block-settings/img/filter.svg";
import UnFilterIcon from "../../../../../../assets/block-settings/img/filter-off.svg";
import GanttIcon from "../../../../../../assets/block-settings/img/GanttIcon.svg";
import GaugeIcon from "../../../../../../assets/block-settings/img/GaugeIcon.svg";
import GraphIcon from "../../../../../../assets/block-settings/img/Graph.svg";
import GridIcon from "../../../../../../assets/block-settings/img/GridIcon.svg";
import HalfDonutIcon from "../../../../../../assets/block-settings/img/Hald Dount.svg";
import HeatMapIcon from "../../../../../../assets/block-settings/img/Heatmap.svg";
import CodeIcon from "../../../../../../assets/block-settings/img/HTML.svg";
import KPIIcon from "../../../../../../assets/block-settings/img/KPIIcon.svg";
import LineIcon from "../../../../../../assets/block-settings/img/LineIcon.svg";
import MapIcon from "../../../../../../assets/block-settings/img/MapIcon.svg";
import PackIcon from "../../../../../../assets/block-settings/img/Pack.svg";
import ParallelCoordinatorIcon from "../../../../../../assets/block-settings/img/Parallel Cordinate.svg";
import PieIcon from "../../../../../../assets/block-settings/img/Pie.svg";
import PivotIcon from "../../../../../../assets/block-settings/img/PivotIcon.svg";
import PolarBarIcon from "../../../../../../assets/block-settings/img/Polar Bar.svg";
import RadarIcon from "../../../../../../assets/block-settings/img/RadarIcon.svg";
import RadialIcon from "../../../../../../assets/block-settings/img/Radial.svg";
import SankeyIcon from "../../../../../../assets/block-settings/img/Sankey.svg";
import ScatterPlot3DIcon from "../../../../../../assets/block-settings/img/Scatter 3D.svg";
import ScatterIcon from "../../../../../../assets/block-settings/img/Scatter Plot.svg";
import ScatterPlotMatrixIcon from "../../../../../../assets/block-settings/img/ScatterPlot Matrix.svg";
import SignalAxisClusterIcon from "../../../../../../assets/block-settings/img/Single Axis Cluster.svg";
import SunburstIcon from "../../../../../../assets/block-settings/img/Sun Brust.svg";
import StackIcon from "../../../../../../assets/block-settings/img/stacked-bar.svg";
import TreemapIcon from "../../../../../../assets/block-settings/img/Treemap.svg";
import VivaGraphIcon from "../../../../../../assets/block-settings/img/Viva Graph.svg";

export const VisualMapConstant = {
	Comparison: [
		{
			icon: <BarChartIcon style={{ color: "#0471F0" }} />,
			name: "bar",
			label: "Bar Chart",
			title: "echart-bar-graph",
			option: {
				xAxis: {
					type: "category",
					data: [],
					nameLocation: "middle",
					nameGap: 25,
				},
				yAxis: {
					type: "value",
					nameLocation: "middle",
					nameGap: 25,
					axisLabel: {},
				},
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
				series: [
					{
						name: "Category",
						data: [],
						type: "bar",
						labelLine: {
							show: true,
						},
						label: {
							color: "#000000",
						},
						itemStyle: {
							color: "#5470c6",
						},
					},
				],
				tooltip: {
					show: true,
					trigger: "axis",
				},
				dataZoom: [
					{
						show: true,
						start: 0,
						end: 100,
						yAxisIndex: 0,
					},
				],
				brush: {
					toolbox: ["rect", "polygon"],
				},
				toolbox: {
					show: true,
					feature: {
						dataZoom: {
							show: true,
						},
					},
				},
				title: {
					text: "Bar Graph",
					show: true,
					left: "left",
					textStyle: {
						color: "#000000",
						fontWeight: "bold",
						fontFamily: "Arial Narrow",
						fontSize: 12,
					},
				},
				reset: {
					title: {
						text: "Bar Graph",
						left: "left",
						show: true,
						textStyle: {
							color: "#000000",
							fontWeight: "bold",
							fontFamily: "Arial Narrow",
							fontSize: 12,
						},
					},
				},
			},
		},
		{
			icon: <BubbleChartIcon style={{ color: "#0471F0" }} />,
			name: "bubble",
			label: "Bubble",
		},
		{
			icon: <img src={String(GridIcon)} alt="Grid Icon" />,
			name: "grid",
			label: "Grid",
		},
		{
			icon: <img src={String(RadarIcon)} alt="Radar Icon" />,
			name: "radar",
			label: "Radar",
		},
	],
	Trends: [
		{
			icon: <img src={String(AreaIcon)} alt="Area Icon" />,
			name: "area",
			label: "Area",
		},
		{
			icon: <img src={String(LineIcon)} alt="Line Icon" />,
			name: "line",
			label: "Line",
			title: "echart-line-graph",
			option: {
				title: {
					text: "Line Chart",
					top: 20,
					left: "left",
					show: true,
					textStyle: {
						color: "#000000",
						fontWeight: "bold",
						fontFamily: "Arial Narrow",
						fontSize: 12,
					},
				},
				tooltip: {
					trigger: "axis",
					show: true,
				},
				legend: {
					show: true,
				},
				xAxis: {
					type: "category",
					name: "a",
					nameLocation: "middle",
					nameGap: 30,
					axisTick: {
						show: true,
					},
					axisLabel: {
						rotate: 0,
					},
					nameTextStyle: {
						fontSize: 10,
					},
					data: [],
					show: true,
				},
				axisTick: {
					show: true,
				},
				yAxis: {
					type: "value",
					name: "",
					nameLocation: "middle",
					nameGap: 40,
					axisLabel: {
						rotate: 0,
					},
					axisLine: {
						show: true,
					},
					axisTick: {
						show: true,
					},
					legend: {
						show: true,
					},
					tooltip: {
						show: true,
					},
					nameTextStyle: {
						fontSize: 10,
					},
					show: true,
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
				series: [
					{
						name: "",
						type: "line",
						data: [],
						lineStyle: {
							type: "solid",
							width: 1,
						},
						label: {
							show: true,
							position: "top",
							rotate: 0,
							fontSize: 12,
							color: "#000000",
						},
					},
				],
				reset: {
					title: {
						text: "Line Chart",
						left: "left",
						show: true,
						textStyle: {
							color: "#000000",
							fontWeight: "bold",
							fontFamily: "Arial Narrow",
							fontSize: 12,
						},
					},
					xAxis: {
						name: "",
						updatedName: null,
						axisTick: true,
						axisLabelFont: 10,
					},
					yAxis: {
						name: "",
						updatedName: null,
						axisTick: true,
						axisLabelFont: 10,
					},
					label: {
						show: true,
						position: "top",
						fontSize: 10,
						color: "#000000",
						backgroundColor: "",
						rotate: 0,
						fontFamily: "",
					},
				},
				toolbox: {
					feature: {
						brush: {
							type: [
								"rect",
								"polygon",
								"lineX",
								"lineY",
								"clear",
							],
							brushType: "rect",
							xAxisIndex: "all",
							yAxisIndex: "all",
							brushMode: "single",
							brushLink: "all",
						},
					},
				},
				brush: {
					// Brush configuration
					brushType: "rect", // You can also use 'polygon', 'lineX', or 'lineY'
					throttleType: "debounce", // Throttle brush events
					throttleDelay: 300, // Delay for throttle (in ms)
					inBrush: {
						color: "rgba(255, 0, 0, 0.3)", // Highlight color for the brushed region
					},
					outBrush: {
						color: "rgba(0, 0, 0, 0.1)", // Color for points outside the brushed region
					},
					xAxisIndex: "all", // Apply brush on x-axis
					brushMode: "single",
					brushLink: "all",
				},
			},
		},
		{
			icon: <BarChartIcon style={{ color: "#0471F0" }} />,
			name: "multiLine",
			label: "Multi Line",
		},
	],
	Metrics: [
		{
			icon: <img src={String(GaugeIcon)} alt="Gauge Icon" />,
			name: "gauge",
			label: "Gauge",
		},
		{
			icon: <img src={String(PivotIcon)} alt="Pivot Icon" />,
			name: "pivotTable",
			label: "Pivot Table",
		},
		{
			icon: <img src={String(KPIIcon)} alt="KPI Icon" />,
			name: "kpi",
			label: "KPI",
		},
		{
			icon: <img src={String(CloudIcon)} alt="Cloud Icon" />,
			name: "cloud",
			label: "Cloud",
			title: "echart-word-cloud",
			option: {
				title: {
					text: "Word Cloud",
					left: "left",
					top: "top",
					show: true,
					textStyle: {
						color: "#000000",
						fontWeight: "bold",
						fontFamily: "Arial Narrow",
						fontSize: 12,
					},
				},
				tooltip: {
					show: true,
					trigger: "item",
				},
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
					"#45b7d1",
				],
				series: [
					{
						type: "wordCloud",
						gridSize: 2,
						sizeRange: [12, 60],
						rotationRange: [-90, 90],
						rotationStep: 45,
						shape: "pentagon",
						width: "100%",
						height: "100%",
						drawOutOfBound: false,
						layoutAnimation: true,
						textStyle: {
							fontFamily: "sans-serif",
							fontWeight: "bold",
						},
						emphasis: {
							focus: "self",
							textStyle: {
								shadowBlur: 10,
								shadowColor: "#333",
							},
						},
						data: [
							{
								name: "A",
								value: 26,
								// Style of single text
								textStyle: {},
							},
							{
								name: "B",
								value: 25,
								// Style of single text
								textStyle: {},
							},
							{
								name: "C",
								value: 24,
								// Style of single text
								textStyle: {},
							},
							{
								name: "D",
								value: 23,
								// Style of single text
								textStyle: {},
							},
							{
								name: "E",
								value: 22,
								// Style of single text
								textStyle: {},
							},
							{
								name: "F",
								value: 21,
								// Style of single text
								textStyle: {},
							},
							{
								name: "G",
								value: 20,
								// Style of single text
								textStyle: {},
							},
							{
								name: "H",
								value: 19,
								// Style of single text
								textStyle: {},
							},
							{
								name: "I",
								value: 18,
								// Style of single text
								textStyle: {},
							},
							{
								name: "J",
								value: 17,
								// Style of single text
								textStyle: {},
							},
							{
								name: "K",
								value: 16,
								// Style of single text
								textStyle: {},
							},
							{
								name: "L",
								value: 15,
								// Style of single text
								textStyle: {},
							},
							{
								name: "M",
								value: 14,
								// Style of single text
								textStyle: {},
							},
							{
								name: "N",
								value: 13,
								// Style of single text
								textStyle: {},
							},
							{
								name: "O",
								value: 12,
								// Style of single text
								textStyle: {},
							},
							{
								name: "P",
								value: 11,
								// Style of single text
								textStyle: {},
							},
							{
								name: "Q",
								value: 10,
								// Style of single text
								textStyle: {},
							},
							{
								name: "R",
								value: 9,
								// Style of single text
								textStyle: {},
							},
							{
								name: "S",
								value: 8,
								// Style of single text
								textStyle: {},
							},
							{
								name: "T",
								value: 7,
								// Style of single text
								textStyle: {},
							},
							{
								name: "U",
								value: 6,
								// Style of single text
								textStyle: {},
							},
							{
								name: "V",
								value: 5,
								// Style of single text
								textStyle: {},
							},
							{
								name: "W",
								value: 4,
								// Style of single text
								textStyle: {},
							},
							{
								name: "X",
								value: 3,
								// Style of single text
								textStyle: {},
							},
							{
								name: "Y",
								value: 2,
								// Style of single text
								textStyle: {},
							},
							{
								name: "Z",
								value: 1,
								// Style of single text
								textStyle: {},
							},
						],
					},
				],
				reset: {
					title: {
						text: "Word Cloud",
						left: "left",
						top: "top",
						show: true,
						textStyle: {
							color: "#000000",
							fontWeight: "bold",
							fontFamily: "Arial Narrow",
							fontSize: 12,
						},
					},
					series: {
						gridSize: 2,
						sizeRange: [12, 60],
						rotationRange: [-90, 90],
						rotationStep: 45,
						shape: "pentagon",
						textStyle: {
							fontFamily: "sans-serif",
							fontWeight: "bold",
						},
					},
				},
			},
		},
	],
	Map: [
		{
			icon: <img src={String(ChoroPlethIcon)} alt="Choropleth Icon" />,
			name: "choropleth",
			label: "Choropleth",
		},
		{
			icon: <img src={String(MapIcon)} alt="Map Icon" />,
			name: "map",
			label: "Map",
			title: "echart-world-map-chart",
			option: {
				series: [
					{
						data: [],
						name: "",
						label: {
							show: false,
							rotate: 0,
							name: "",
							position: "top",
							fontFamily: "sans-serif",
							fontSize: 12,
							color: "#000000",
						},
						symbolSize: 15,
						symbol: "circle",
					},
				],
				symbolSize: 15,
				tooltip: {
					show: true,
					trigger: "item",
					position: "bottom",
				},
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
				legend: {
					show: true,
					orient: "horizontal",
					bottom: "bottom",
					textStyle: {
						fontSize: 10,
					},
					type: "scroll",
					pageButtonItemGap: 5,
					pageTextSize: {
						color: "#000000",
						fontSize: 10,
					},
					left: "center",
					top: "bottom",
					itemWidth: 15,
					itemHeight: 10,
				},
				toolbox: {
					feature: {
						brush: {
							type: ["rect"],
						},
					},
				},
				brush: {
					// Brush configuration
					brushType: "rect", // You can also use 'polygon', 'lineX', or 'lineY'
					throttleType: "debounce", // Throttle brush events
					throttleDelay: 300, // Delay for throttle (in ms)
					inBrush: {
						color: "rgba(255, 0, 0, 0.3)", // Highlight color for the brushed region
					},
					outBrush: {
						color: "rgba(0, 0, 0, 0.1)", // Color for points outside the brushed region
					},
				},
				title: {
					text: "Map Graph",
					left: "left",
					show: true,
					textStyle: {
						color: "#000000",
						fontWeight: "bold",
						fontFamily: "Arial Narrow",
						fontSize: 12,
					},
				},
				reset: {
					title: {
						text: "Map Graph",
						left: "left",
						show: true,
						textStyle: {
							color: "#000000",
							fontWeight: "bold",
							fontFamily: "Arial Narrow",
							fontSize: 12,
						},
					},
				},
			},
		},
	],
	"Part To Whole": [
		{
			icon: <img src={String(BulletIcon)} alt="Bullet Icon" />,
			name: "bullet",
			label: "Bullet",
		},
		{
			icon: <img src={String(HalfDonutIcon)} alt="Half Donut Icon" />,
			name: "halfDonut",
			label: "Half Donut",
		},
		{
			icon: <img src={String(PieIcon)} alt="Pie Icon" />,
			name: "pie",
			label: "Pie",
			title: "echart-pie-chart",
			option: {
				dataset: {
					source: [
						{ name: "a", value: 85 },
						{ name: "b", value: 79 },
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
					text: "Pie Chart",
					left: "left",
					show: true,
					textStyle: {
						color: "#000000",
						fontWeight: "bold",
						fontFamily: "Arial Narrow",
						fontSize: 12,
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
						data: [],
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
						text: "Pie Chart",
						left: "left",
						show: true,
						textStyle: {
							color: "#000000",
							fontWeight: "bold",
							fontFamily: "Arial Narrow",
							fontSize: 12,
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
		},
		{
			icon: <img src={String(PolarBarIcon)} alt="Polar Bar Icon" />,
			name: "polarBar",
			label: "PolarBar",
		},
		{
			icon: <img src={String(RadialIcon)} alt="Radial Icon" />,
			name: "radial",
			label: "Radial",
		},
		{
			icon: <img src={String(SunburstIcon)} alt="SunBurst Icon" />,
			name: "sunburst",
			label: "Sunburst",
		},
		{
			icon: <img src={String(StackIcon)} alt="Stack Icon" />,
			name: "stack",
			label: "Stack",
			title: "echart-stack-chart",
			option: {
				title: {
					text: "Stacked Bar Chart",
					left: "left",
					top: "top",
					show: true,
					textStyle: {
						color: "#000000",
						fontWeight: "bold",
						fontFamily: "Arial Narrow",
						fontSize: 12,
					},
				},
				tooltip: {
					show: false,
					trigger: "axis",
					position: "bottom",
					axisPointer: {
						type: "line",
					},
				},
				xAxis: {
					name: "",
					pixelName: "",
					flipAxisName: "",
					axisName: "",
					nameLocation: "middle",
					show: true,
					data: [],
					type: "category",
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
					nameGap: 25,
				},
				yAxis: {
					name: "",
					pixelName: "",
					axisName: "",
					flipAxisName: "",
					type: "value",
					data: [],
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
					axisPointer: {
						show: false,
					},
					splitLine: {
						show: true,
					},
				},
				legend: {
					show: false,
					data: [],
					selectedMode: "multiple",
					orient: "horizontal",
					bottom: "bottom",
					textStyle: {
						fontSize: 10,
					},
					type: "scroll",
					pageButtonItemGap: 5,
					pageTextSize: {
						color: "#000000",
						fontSize: 10,
					},
					left: "center",
					top: "bottom",
					itemWidth: 15,
					itemHeight: 10,
				},
				series: [],
				label: {
					show: true,
					rotate: 0,
					name: "",
					position: "top",
					fontFamily: "sans-serif",
					fontSize: 12,
					color: "#000000",
				},
				barWidth: 10,
				flipAxis: false,
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
							type: ["rect", "clear"],
						},
					},
				},
				brush: {
					// Brush configuration
					brushType: "rect", // You can also use 'polygon', 'lineX', or 'lineY'
					throttleType: "debounce", // Throttle brush events
					xAxisIndex: "0", // Apply brushing to all x-axis
					throttleDelay: 300, // Delay for throttle (in ms)
					brushMode: "single",
					inBrush: {
						color: "rgba(255, 0, 0, 0.3)", // Highlight color for the brushed region
					},
					outBrush: {
						color: "rgba(0, 0, 0, 0.1)", // Color for points outside the brushed region
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
					title: {
						text: "Stacked Bar Chart",
						left: "left",
						top: "top",
						show: true,
						textStyle: {
							color: "#000000",
							fontWeight: "bold",
							fontFamily: "Arial Narrow",
							fontSize: 12,
						},
					},
					barWidth: 10,
				},
			},
		},
		{
			icon: <img src={String(TreemapIcon)} alt="TreeMap Icon" />,
			name: "treemap",
			label: "TreeMap",
		},
	],
	Distribution: [
		{
			icon: <img src={String(BoxIcon)} alt="Box Icon" />,
			name: "box",
			label: "Box",
		},
		{
			icon: <img src={String(ClusterIcon)} alt="Cluster Icon" />,
			name: "cluster",
			label: "Cluster",
		},
		{
			icon: <img src={String(HeatMapIcon)} alt="HeatMap Icon" />,
			name: "heatMap",
			label: "Heat Map",
		},
		{
			icon: <img src={String(PackIcon)} alt="Pack Icon" />,
			name: "pack",
			label: "Pack",
		},
		{
			icon: <img src={String(ScatterIcon)} alt="Scatter Icon" />,
			name: "scatter",
			label: "Scatter",
			title: "echart-scatter-plots",
			option: {
				title: {
					text: "Scatter Plot",
					left: "left",
					top: "top",
					show: true,
					textStyle: {
						color: "#000000",
						fontWeight: "bold",
						fontFamily: "Arial Narrow",
						fontSize: 12,
					},
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
					// Brush configuration
					brushType: "rect", // You can also use 'polygon', 'lineX', or 'lineY'
					throttleType: "debounce", // Throttle brush events
					throttleDelay: 300, // Delay for throttle (in ms)
					inBrush: {
						color: "rgba(255, 0, 0, 0.3)", // Highlight color for the brushed region
					},
					outBrush: {
						color: "rgba(0, 0, 0, 0.1)", // Color for points outside the brushed region
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
					title: {
						text: "Scatter Plot",
						left: "left",
						top: "top",
						show: true,
						textStyle: {
							color: "#000000",
							fontWeight: "bold",
							fontFamily: "Arial Narrow",
							fontSize: 12,
						},
					},
				},
			},
		},
		{
			icon: (
				<img
					src={String(ScatterPlotMatrixIcon)}
					alt="ScatterPlotMatrix Icon"
				/>
			),
			name: "scatterPlotMatrix",
			label: "ScatterPlot Matrix",
		},
		{
			icon: (
				<img src={String(ScatterPlot3DIcon)} alt="ScatterPlot3D Icon" />
			),
			name: "scatterPlot3D",
			label: "ScatterPlot 3D",
		},
		{
			icon: (
				<img
					src={String(SignalAxisClusterIcon)}
					alt="Signal Axis Cluster Icon"
				/>
			),
			name: "signalAxisCluster",
			label: "Signal Axis Cluster",
		},
	],
	"Report Widgets": [
		{
			icon: <DashboardIcon style={{ color: "#808080" }} />,
			name: "dashboard",
			label: "Dashboard",
		},
		{
			icon: <img src={String(ButtonIcon)} alt="Button Icon" />,
			name: "button",
			label: "Button",
		},
		{
			icon: <img src={String(FilterIcon)} alt="Filter Icon" />,
			name: "filter",
			label: "Filter",
		},
		{
			icon: <img src={String(UnFilterIcon)} alt="UnFilter Icon" />,
			name: "unFilter",
			label: "Unfilter",
		},
		{
			icon: <img src={String(CodeIcon)} alt="HTML Icon" />,
			name: "html",
			label: "HTML",
		},
		{
			icon: <img src={String(CodeIcon)} alt="Iframe Icon" />,
			name: "iFrame",
			label: "Iframe",
		},
	],
	Connections: [
		{
			icon: <img src={String(DendrogramIcon)} alt="Dendrogram Icon" />,
			name: "dendrogram",
			label: "Dendrogram",
			title: "echart-dendrogram-chart",
			option: {
				tooltip: {
					trigger: "item",
					triggerOn: "mousemove",
				},
				title: {
					text: "Dendrogram Chart",
					left: "left",
					top: "top",
					show: true,
					textStyle: {
						color: "#000000",
						fontWeight: "bold",
						fontFamily: "Arial Narrow",
						fontSize: 12,
					},
				},
				reset: {
					title: {
						text: "Dendrogram Chart",
						left: "left",
						top: "top",
						show: true,
						textStyle: {
							color: "#000000",
							fontWeight: "bold",
							fontFamily: "Arial Narrow",
							fontSize: 12,
						},
					},
				},
				toolbox: {
					show: true,
					feature: {
						dataZoom: {
							show: true,
						},
					},
					brush: {
						toolbox: ["rect", "polygon"],
					},
				},
				series: [
					{
						type: "tree",
						data: [
							{
								name: "Root",
								children: [
									{
										name: "Child A",
										children: [
											{ name: "Leaf A1" },
											{ name: "Leaf A2" },
										],
									},
									{
										name: "Child B",
										children: [
											{ name: "Leaf B1" },
											{ name: "Leaf B2" },
										],
									},
								],
							},
						],
						top: "5%",
						left: "10%",
						bottom: "5%",
						right: "10%",
						symbolSize: 10,
						label: {
							position: "left",
							verticalAlign: "middle",
							align: "right",
							color: "#000000",
							fontSize: "12",
							show: true,
							formatter: "{c}",
						},
						leaves: {
							label: {
								position: "right",
								verticalAlign: "middle",
								align: "left",
							},
						},
						expandAndCollapse: true,
						animationDuration: 750,
						animationDurationUpdate: 750,
						initialTreeDepth: -1,
					},
				],
				_state: {
					dimensions: [],
					facet: [],
				},
			},
			facet: {
				facetSelected: [],
				facetList: [],
			},
		},
		{
			icon: <img src={String(GraphIcon)} alt="Graph Icon" />,
			name: "graph",
			label: "Graph",
		},
		{
			icon: <img src={String(GraphIcon)} alt="GraphGL Icon" />,
			name: "graphGl",
			label: "GraphGL",
		},
		{
			icon: (
				<img
					src={String(ParallelCoordinatorIcon)}
					alt="Parallel Coordinates Icon"
				/>
			),
			name: "parallelCoordinates",
			label: "Parallel Coordinates",
		},
		{
			icon: <img src={String(VivaGraphIcon)} alt="VivaGraph Icon" />,
			name: "vivaGraph",
			label: "VivaGraph",
		},
	],
	Pipeline: [
		{
			icon: <img src={String(FunnelIcon)} alt="Funnel Icon" />,
			name: "funnel",
			label: "Funnel",
		},
		{
			icon: <img src={String(GanttIcon)} alt="Gantt Icon" />,
			name: "gantt",
			label: "Gantt",
			title: "echart-gantt-chart",
			option: {
				title: {
					text: "Gantt Chart",
					left: "left",
					top: "top",
					show: true,
					textStyle: {
						color: "#000000",
						fontWeight: "bold",
						fontFamily: "Arial Narrow",
						fontSize: 12,
					},
				},
				reset: {
					title: {
						text: "Gantt Chart",
						left: "left",
						top: "top",
						show: true,
						textStyle: {
							color: "#000000",
							fontWeight: "bold",
							fontFamily: "Arial Narrow",
							fontSize: 12,
						},
					},
				},
				tooltip: {
					show: true,
				},
				xAxis: {
					type: "time",
					splitLine: {
						show: false,
					},
				},
				yAxis: {
					type: "category",
					data: [],
				},
				series: [
					{
						type: "custom",

						data: [],
					},
				],
				customSettings: {
					columnDetails: {},
				},
			},
		},
		{
			icon: <img src={String(SankeyIcon)} alt="Sankey Icon" />,
			name: "sankey",
			label: "Sankey",
		},
	],
};
