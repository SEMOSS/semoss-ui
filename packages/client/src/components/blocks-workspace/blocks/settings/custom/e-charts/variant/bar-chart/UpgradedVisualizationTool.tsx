import { Image, Info } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import type { EchartVisualizationBlockDef } from "@semoss/renderer";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { getShowFieldOptions } from "../../../../../block-settings/block-defaults.shared";
import { SelectInputSettings } from "../../../../../settings";
import { ResizeSetting } from "../../../../shared";
import { ColorPalatteSettings } from "../../../../shared/ColorPalatteSettings";
import { BAR_CHART_DATA } from "../../Visualization.constants";
import { ChangeOrientation } from "../dendrogram/ChangeOrientation";
import { CustomizeDendrogramSymbol } from "../dendrogram/CustomizeDendrogramSymbol";
import { LabelsDendrogram } from "../dendrogram/LabelsDendrogram";
import { LegendDendrogram } from "../dendrogram/LegendDendrogram";
import { CustomizeSymbol } from "../Gantt/CustomizeSymbol";
import { EditAxis as EditGanttAxis } from "../Gantt/EditAxis";
import { GanttDisplayValueLabels } from "../Gantt/GanttDisplayValueLabels";
import { GanttFiscal } from "../Gantt/GanttFiscal";
import { GanttGroupView } from "../Gantt/GanttGroupView";
import { GanttLegend } from "../Gantt/GanttLegend";
import { GanttTargetLine } from "../Gantt/GanttTargetLine";
import { LineLegend } from "../line-chart/LineLegend";
import { LineStyling } from "../line-chart/LineStyling";
import { LineTooltip } from "../line-chart/LineTooltip";
import { LineValueLabels } from "../line-chart/LineValueLabel";
import { ToggleDataZoom } from "../line-chart/ToggleDataZoom";
import { XAxisStyling } from "../line-chart/XAxisStyling";
import { YAxisStyling } from "../line-chart/YAxisStyling";
import { LegendToggleMapChart } from "../map-chart/LegendToggleMapChart";
import { MapMarkerSize } from "../map-chart/MapMarkerSize";
import { TooltipMapChart } from "../map-chart/TooltipMapChart";
import { CustomTooltip } from "../pie-chart/CustomTooltip";
import { PieLegend } from "../pie-chart/PieLegend";
import { PieValueLabel } from "../pie-chart/PieValueLabel";
import { ToogleDonut } from "../pie-chart/ToggleDonut";
import { EditXAxisScatterPlot } from "../scatter-plot/EditXAxisScatterPlot";
import { EditYAxisScatterPlot } from "../scatter-plot/EditYAxisScatterPlot";
import { ScatterPlotSymbol } from "../scatter-plot/ScatterPlotSymbol";
import { TooltipScatterPlot } from "../scatter-plot/TooltipScatterPlot";
import { ValueLabelScatterPlot } from "../scatter-plot/ValueLabelScatterPlot";
import { updateSeriesColor } from "../shared/chart-utility";
import { EditXAxisStackChart } from "../stack-chart/EditXAxisStackChart";
import { EditYAxisStackChart } from "../stack-chart/EditYAxisStackChart";
import { LegendStackChart } from "../stack-chart/LegendStackChart";
import { StackChartBarStyle } from "../stack-chart/StackChartBarStyle";
import { ValueLabelStackChart } from "../stack-chart/ValueLabelStackChart";
import { TitleTool } from "../TitleTool";
import CloudSettings from "../world-cloud-chart/CloudSettings";
import ColourByValue from "./ColourByValue";
import { CustomizeValueLabels } from "./CustomizeValueLabels";
import { EditXAxis } from "./Edit-X-Axis";
import { EditYAxis } from "./Edit-Y-Axis";
import { Legend } from "./Legend";
import { ToggleTrendline } from "./ToggleTrendline";
import { VisualizationStyles } from "./VisualizationStyles";

interface UpgradedVisualizationToolProps {
	id: string;
}

// Reusable accordion item button
function ToolItem({
	label,
	isSelected,
	onClick,
}: {
	label: string;
	isSelected: boolean;
	onClick: () => void;
}) {
	return (
		// biome-ignore lint/a11y/useButtonType: handled by caller
		<button
			className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${isSelected ? "bg-muted font-medium" : ""}`}
			onClick={onClick}
		>
			<div className="flex items-center gap-2">
				<Image className="h-4 w-4 text-muted-foreground" />
				<span>{label}</span>
			</div>
			<Info className="h-4 w-4 text-muted-foreground" />
		</button>
	);
}

const DendrogramToolsList = ({ id }) => {
	const [dendrogramSelection, setDendrogramSelection] = useState("");
	const toggle = (key: string) =>
		setDendrogramSelection((prev) => (prev === key ? "" : key));
	return (
		<>
			<div>
				<ToolItem
					label="Customize Symbol"
					isSelected={
						dendrogramSelection === "customizeDendrogramSymbol"
					}
					onClick={() => toggle("customizeDendrogramSymbol")}
				/>
				{dendrogramSelection === "customizeDendrogramSymbol" && (
					<CustomizeDendrogramSymbol id={id} />
				)}
			</div>
			<div>
				<ToolItem
					label="Change Orientation"
					isSelected={dendrogramSelection === "changeOrientation"}
					onClick={() => toggle("changeOrientation")}
				/>
				{dendrogramSelection === "changeOrientation" && (
					<ChangeOrientation id={id} />
				)}
			</div>
			<div>
				<ToolItem
					label="Legend"
					isSelected={dendrogramSelection === "legendDendrogram"}
					onClick={() => toggle("legendDendrogram")}
				/>
				{dendrogramSelection === "legendDendrogram" && (
					<LegendDendrogram id={id} />
				)}
			</div>
			<div>
				<ToolItem
					label="Labels"
					isSelected={dendrogramSelection === "showLabelsDendrogram"}
					onClick={() => toggle("showLabelsDendrogram")}
				/>
				{dendrogramSelection === "showLabelsDendrogram" && (
					<LabelsDendrogram id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Chart Title"
					isSelected={dendrogramSelection === "title"}
					onClick={() => toggle("title")}
				/>
				{dendrogramSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</div>
		</>
	);
};

const ResizingTool = ({ id }) => {
	const [resizeSelection, setResizeSelection] = useState("");
	const toggle = (key: string) =>
		setResizeSelection((prev) => (prev === key ? "" : key));
	return (
		<div>
			<ToolItem
				label="Resizing"
				isSelected={resizeSelection === "resizing"}
				onClick={() => toggle("resizing")}
			/>
			{resizeSelection === "resizing" && (
				<div className="flex flex-col gap-2 p-2">
					<ResizeSetting
						id={id}
						label={"Height"}
						path={"style.height"}
					/>
					<ResizeSetting
						id={id}
						label={"Width"}
						path={"style.width"}
					/>
				</div>
			)}
		</div>
	);
};

const ColorpalatteTool = ({ id }) => {
	const [colorPalatteSelection, setColorPalatteSelection] = useState("");
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
	const toggle = (key: string) =>
		setColorPalatteSelection((prev) => (prev === key ? "" : key));

	return (
		<div>
			<ToolItem
				label="Color Palette"
				isSelected={colorPalatteSelection === "colourpalette"}
				onClick={() => toggle("colourpalette")}
			/>
			{colorPalatteSelection === "colourpalette" && (
				<ColorPalatteSettings
					id={id}
					path="option.color"
					onColorPalatteSelected={(option, color) => {
						if (data.variation === "echart-bar-graph") {
							const optionToSend =
								typeof option === "string"
									? JSON.parse(option)
									: option;
							const colorParent = "itemStyle";
							const updatedOption = updateSeriesColor(
								optionToSend,
								color,
								colorParent,
							);
							setData("option", updatedOption);
						}
					}}
				/>
			)}
		</div>
	);
};

const GanttToolsList = ({ id }) => {
	const [ganttSelection, setGanttSelection] = useState("");
	const toggle = (key: string) =>
		setGanttSelection((prev) => (prev === key ? "" : key));
	return (
		<>
			<div>
				<ToolItem
					label="Fiscal Axis"
					isSelected={ganttSelection === "fiscalaxis"}
					onClick={() => toggle("fiscalaxis")}
				/>
				{ganttSelection === "fiscalaxis" && (
					<GanttFiscal id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Edit X Axis"
					isSelected={ganttSelection === "xaxis"}
					onClick={() => toggle("xaxis")}
				/>
				{ganttSelection === "xaxis" && (
					<EditGanttAxis id={id} path={"option"} axis="x" />
				)}
			</div>
			<div>
				<ToolItem
					label="Edit Y Axis"
					isSelected={ganttSelection === "yaxis"}
					onClick={() => toggle("yaxis")}
				/>
				{ganttSelection === "yaxis" && (
					<EditGanttAxis id={id} path={"option"} axis="y" />
				)}
			</div>
			<div>
				<ToolItem
					label="Chart Position"
					isSelected={ganttSelection === "chartposition"}
					onClick={() => toggle("chartposition")}
				/>
				{ganttSelection === "chartposition" && (
					<div className="flex flex-col gap-2 p-2">
						<ResizeSetting
							id={id}
							label={"Left"}
							path={"option.grid.left"}
						/>
						<ResizeSetting
							id={id}
							label={"Right"}
							path={"option.grid.right"}
						/>
						<ResizeSetting
							id={id}
							label={"Top"}
							path={"option.grid.top"}
						/>
						<ResizeSetting
							id={id}
							label={"Bottom"}
							path={"option.grid.bottom"}
						/>
					</div>
				)}
			</div>
			<div>
				<ToolItem
					label="Target Date"
					isSelected={ganttSelection === "targetdate"}
					onClick={() => toggle("targetdate")}
				/>
				{ganttSelection === "targetdate" && (
					<GanttTargetLine id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Customize Symbol"
					isSelected={ganttSelection === "customizesymbol"}
					onClick={() => toggle("customizesymbol")}
				/>
				{ganttSelection === "customizesymbol" && (
					<CustomizeSymbol id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Legend"
					isSelected={ganttSelection === "togglelegendgantt"}
					onClick={() => toggle("togglelegendgantt")}
				/>
				{ganttSelection === "togglelegendgantt" && (
					<GanttLegend id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Group View"
					isSelected={ganttSelection === "togglegroupview"}
					onClick={() => toggle("togglegroupview")}
				/>
				{ganttSelection === "togglegroupview" && (
					<GanttGroupView id={id} path={"option"} />
				)}
			</div>
			<ResizingTool id={id} />
			<div>
				<ToolItem
					label="Display Value Labels"
					isSelected={ganttSelection === "displayvaluelabels"}
					onClick={() => toggle("displayvaluelabels")}
				/>
				{ganttSelection === "displayvaluelabels" && (
					<GanttDisplayValueLabels id={id} path="option" />
				)}
			</div>
			<div>
				<ToolItem
					label="Chart Title"
					isSelected={ganttSelection === "title"}
					onClick={() => toggle("title")}
				/>
				{ganttSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</div>
		</>
	);
};

const StackChartTool = ({ id }) => {
	const [stackChartSelection, setStackChartSelection] = useState("");
	const toggle = (key: string) =>
		setStackChartSelection((prev) => (prev === key ? "" : key));
	return (
		<>
			<ColorpalatteTool id={id} />
			<div>
				<ToolItem
					label="Edit X Axis"
					isSelected={stackChartSelection === "editxaxis"}
					onClick={() => toggle("editxaxis")}
				/>
				{stackChartSelection === "editxaxis" && (
					<EditXAxisStackChart id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Edit Y Axis"
					isSelected={stackChartSelection === "edityaxis"}
					onClick={() => toggle("edityaxis")}
				/>
				{stackChartSelection === "edityaxis" && (
					<EditYAxisStackChart id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Value Label"
					isSelected={stackChartSelection === "valuelabel"}
					onClick={() => toggle("valuelabel")}
				/>
				{stackChartSelection === "valuelabel" && (
					<ValueLabelStackChart id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Tooltips"
					isSelected={stackChartSelection === "tooltips"}
					onClick={() => toggle("tooltips")}
				/>
				{stackChartSelection === "tooltips" && (
					<TooltipScatterPlot id={id} path="option" />
				)}
			</div>
			<ResizingTool id={id} />
			<div>
				<ToolItem
					label="Bar Style"
					isSelected={stackChartSelection === "barstyle"}
					onClick={() => toggle("barstyle")}
				/>
				{stackChartSelection === "barstyle" && (
					<StackChartBarStyle id={id} path="option" />
				)}
			</div>
			<div>
				<ToolItem
					label="Legend"
					isSelected={stackChartSelection === "legend"}
					onClick={() => toggle("legend")}
				/>
				{stackChartSelection === "legend" && (
					<LegendStackChart id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Chart Title"
					isSelected={stackChartSelection === "title"}
					onClick={() => toggle("title")}
				/>
				{stackChartSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</div>
		</>
	);
};

const BarToolsList = ({ id }) => {
	const [barSelection, setBarSelection] = useState("");
	const { data } = useBlockSettings(id);
	function updateChart() {}
	const toggle = (key: string) =>
		setBarSelection((prev) => (prev === key ? "" : key));
	return (
		<>
			<ColorpalatteTool id={id} />
			<div>
				<ToolItem
					label="Colour By Value"
					isSelected={barSelection === "colourbyvalue"}
					onClick={() => toggle("colourbyvalue")}
				/>
				{barSelection === "colourbyvalue" && (
					<ColourByValue
						id={id}
						updateChart={updateChart}
						path="option"
					/>
				)}
			</div>
			<div>
				<ToolItem
					label="Edit X Axis"
					isSelected={barSelection === "editxaxis"}
					onClick={() => toggle("editxaxis")}
				/>
				{barSelection === "editxaxis" && (
					<EditXAxis id={id} option={data.option} path="option" />
				)}
			</div>
			<div>
				<ToolItem
					label="Edit Y Axis"
					isSelected={barSelection === "edityaxis"}
					onClick={() => toggle("edityaxis")}
				/>
				{barSelection === "edityaxis" && (
					<EditYAxis id={id} option={data.option} path="option" />
				)}
			</div>
			<div>
				<ToolItem
					label="Value Label"
					isSelected={barSelection === "valuelabel"}
					onClick={() => toggle("valuelabel")}
				/>
				{barSelection === "valuelabel" && (
					<CustomizeValueLabels
						id={id}
						option={data.option}
						chartType={BAR_CHART_DATA.JSONVALUE[0]}
						path="option"
					/>
				)}
			</div>
			<div>
				<ToolItem
					label="Bar Style"
					isSelected={barSelection === "barstyle"}
					onClick={() => toggle("barstyle")}
				/>
				{barSelection === "barstyle" && (
					<VisualizationStyles
						id={id}
						option={data.option}
						path="option"
						chartType={BAR_CHART_DATA.JSONVALUE[0]}
						updateChart={updateChart}
					/>
				)}
			</div>
			<div>
				<ToolItem
					label="Chart Title"
					isSelected={barSelection === "chartstyle"}
					onClick={() => toggle("chartstyle")}
				/>
				{barSelection === "chartstyle" && (
					<TitleTool id={id} path="option" />
				)}
			</div>
			<ResizingTool id={id} />
			<div>
				<ToolItem
					label="Trendlines"
					isSelected={barSelection === "trendlines"}
					onClick={() => toggle("trendlines")}
				/>
				{barSelection === "trendlines" && (
					<ToggleTrendline
						id={id}
						chartType={BAR_CHART_DATA.JSONVALUE[0]}
						path="option"
					/>
				)}
			</div>
			{data.variation === "echart-bar-graph" && (
				<div>
					<ToolItem
						label="Legend"
						isSelected={barSelection === "barlegend"}
						onClick={() => toggle("barlegend")}
					/>
					{barSelection === "barlegend" && (
						<Legend id={id} path="option" />
					)}
				</div>
			)}
		</>
	);
};

const ScatterToolsList = ({ id }) => {
	const [scatterSelection, setScatterSelection] = useState("");
	const toggle = (key: string) =>
		setScatterSelection((prev) => (prev === key ? "" : key));

	return (
		<>
			<ColorpalatteTool id={id} />
			<div>
				<ToolItem
					label="Edit X Axis"
					isSelected={scatterSelection === "editxaxis"}
					onClick={() => toggle("editxaxis")}
				/>
				{scatterSelection === "editxaxis" && (
					<EditXAxisScatterPlot id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Edit Y Axis"
					isSelected={scatterSelection === "edityaxis"}
					onClick={() => toggle("edityaxis")}
				/>
				{scatterSelection === "edityaxis" && (
					<EditYAxisScatterPlot id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Value Label"
					isSelected={scatterSelection === "valuelabel"}
					onClick={() => toggle("valuelabel")}
				/>
				{scatterSelection === "valuelabel" && (
					<ValueLabelScatterPlot id={id} path={"option"} />
				)}
			</div>
			<ResizingTool id={id} />
			<div>
				<ToolItem
					label="Tooltips"
					isSelected={scatterSelection === "tooltips"}
					onClick={() => toggle("tooltips")}
				/>
				{scatterSelection === "tooltips" && (
					<TooltipScatterPlot id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Symbol"
					isSelected={scatterSelection === "symbol"}
					onClick={() => toggle("symbol")}
				/>
				{scatterSelection === "symbol" && (
					<ScatterPlotSymbol id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Chart Title"
					isSelected={scatterSelection === "scatter-plots-title"}
					onClick={() => toggle("scatter-plots-title")}
				/>
				{scatterSelection === "scatter-plots-title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</div>
		</>
	);
};

const LineChartTools = ({ id }) => {
	const [lineSelection, setLineSelection] = useState("");
	const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
	const toggle = (key: string) =>
		setLineSelection((prev) => (prev === key ? "" : key));

	return (
		<>
			<ColorpalatteTool id={id} />
			<div>
				<ToolItem
					label="Chart Title"
					isSelected={lineSelection === "lineTitle"}
					onClick={() => toggle("lineTitle")}
				/>
				{lineSelection === "lineTitle" && (
					<TitleTool id={id} path="option" />
				)}
			</div>
			<ResizingTool id={id} />
			<div>
				<ToolItem
					label="Line Legend"
					isSelected={lineSelection === "lineLegend"}
					onClick={() => toggle("lineLegend")}
				/>
				{lineSelection === "lineLegend" && (
					<LineLegend id={id} path="option" />
				)}
			</div>
			<div>
				<ToolItem
					label="Line Tooltip"
					isSelected={lineSelection === "lineTooltip"}
					onClick={() => toggle("lineTooltip")}
				/>
				{lineSelection === "lineTooltip" && (
					<LineTooltip id={id} path="option" />
				)}
			</div>
			<div>
				<ToolItem
					label="Value Labels"
					isSelected={lineSelection === "lineValueLabel"}
					onClick={() => toggle("lineValueLabel")}
				/>
				{lineSelection === "lineValueLabel" && (
					<LineValueLabels
						id={id}
						option={data.option}
						chartType={BAR_CHART_DATA.JSONVALUE[0]}
						path="option"
					/>
				)}
			</div>
			<div>
				<ToolItem
					label="X Axis Styling"
					isSelected={lineSelection === "lineXAixsStyling"}
					onClick={() => toggle("lineXAixsStyling")}
				/>
				{lineSelection === "lineXAixsStyling" && (
					<XAxisStyling id={id} path="option" />
				)}
			</div>
			<div>
				<ToolItem
					label="Y Axis Styling"
					isSelected={lineSelection === "lineYAixsStyling"}
					onClick={() => toggle("lineYAixsStyling")}
				/>
				{lineSelection === "lineYAixsStyling" && (
					<YAxisStyling id={id} path="option" />
				)}
			</div>
			<div>
				<ToolItem
					label="Line Styling"
					isSelected={lineSelection === "lineStyling"}
					onClick={() => toggle("lineStyling")}
				/>
				{lineSelection === "lineStyling" && (
					<LineStyling id={id} path="option" />
				)}
			</div>
			<div>
				<ToolItem
					label="Data Zoom"
					isSelected={lineSelection === "dataZoom"}
					onClick={() => toggle("dataZoom")}
				/>
				{lineSelection === "dataZoom" && <ToggleDataZoom id={id} />}
			</div>
		</>
	);
};

const CloudChartTools = ({ id }) => {
	const [cloudSelection, setCloudSelection] = useState("");
	const toggle = (key: string) =>
		setCloudSelection((prev) => (prev === key ? "" : key));

	return (
		<>
			<ResizingTool id={id} />
			<ColorpalatteTool id={id} />
			<div>
				<ToolItem
					label="Chart Title"
					isSelected={cloudSelection === "title"}
					onClick={() => toggle("title")}
				/>
				{cloudSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Cloud Settings"
					isSelected={cloudSelection === "shape"}
					onClick={() => toggle("shape")}
				/>
				{cloudSelection === "shape" && (
					<CloudSettings id={id} path={"option"} />
				)}
			</div>
		</>
	);
};

const MapChartTools = ({ id }) => {
	const [mapSelection, setMapSelection] = useState("");
	const toggle = (key: string) =>
		setMapSelection((prev) => (prev === key ? "" : key));
	return (
		<>
			<ColorpalatteTool id={id} />
			<div>
				<ToolItem
					label="Tooltips"
					isSelected={mapSelection === "tooltips"}
					onClick={() => toggle("tooltips")}
				/>
				{mapSelection === "tooltips" && (
					<TooltipMapChart id={id} path={"option"} />
				)}
			</div>
			<ResizingTool id={id} />
			<div>
				<ToolItem
					label="Legend"
					isSelected={mapSelection === "legend"}
					onClick={() => toggle("legend")}
				/>
				{mapSelection === "legend" && (
					<LegendToggleMapChart id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Map Marker Size"
					isSelected={mapSelection === "symbol"}
					onClick={() => toggle("symbol")}
				/>
				{mapSelection === "symbol" && (
					<MapMarkerSize id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Chart Title"
					isSelected={mapSelection === "title"}
					onClick={() => toggle("title")}
				/>
				{mapSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</div>
		</>
	);
};

const PieChartTools = ({ id }) => {
	const [pieSelection, setPieSelection] = useState("");
	const toggle = (key: string) =>
		setPieSelection((prev) => (prev === key ? "" : key));

	return (
		<>
			<ColorpalatteTool id={id} />
			<div>
				<ToolItem
					label="Tooltip"
					isSelected={pieSelection === "tooltip"}
					onClick={() => toggle("tooltip")}
				/>
				{pieSelection === "tooltip" && (
					<CustomTooltip id={id} path={"option"} />
				)}
			</div>
			<ResizingTool id={id} />
			<div>
				<ToolItem
					label="Legend"
					isSelected={pieSelection === "legend"}
					onClick={() => toggle("legend")}
				/>
				{pieSelection === "legend" && (
					<PieLegend id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Donut - Toggle"
					isSelected={pieSelection === "donutToggle"}
					onClick={() => toggle("donutToggle")}
				/>
				{pieSelection === "donutToggle" && (
					<ToogleDonut id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Chart Title"
					isSelected={pieSelection === "title"}
					onClick={() => toggle("title")}
				/>
				{pieSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</div>
			<div>
				<ToolItem
					label="Value Label"
					isSelected={pieSelection === "valueLabel"}
					onClick={() => toggle("valueLabel")}
				/>
				{pieSelection === "valueLabel" && (
					<PieValueLabel id={id} path={"option"} />
				)}
			</div>
		</>
	);
};

export const UpgradedVisualizationTool =
	observer<UpgradedVisualizationToolProps>(({ id }) => {
		const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
		const [selectedList, setSelectedList] = useState("");
		const toggle = (key: string) =>
			setSelectedList((prev) => (prev === key ? "" : key));
		return (
			<div className="w-full">
				{/* Conditional / Show Block */}
				<div>
					<ToolItem
						label="Conditional"
						isSelected={selectedList === "generalchartsettings"}
						onClick={() => toggle("generalchartsettings")}
					/>
					{selectedList === "generalchartsettings" && (
						<div className="block w-full p-2">
							<SelectInputSettings
								id={id}
								path={"show"}
								label={"Show Block"}
								options={[...getShowFieldOptions(id)]}
							/>
						</div>
					)}
				</div>
				{data.variation === "echart-world-map-chart" && (
					<MapChartTools id={id} />
				)}
				{data.variation === "echart-pie-chart" && (
					<PieChartTools id={id} />
				)}
				{data.variation === "echart-line-graph" && (
					<LineChartTools id={id} />
				)}
				{data.variation === "echart-bar-graph" && (
					<BarToolsList id={id} />
				)}
				{data.variation === "echart-scatter-plots" && (
					<ScatterToolsList id={id} />
				)}
				{data.variation === "echart-stack-chart" && (
					<StackChartTool id={id} />
				)}
				{data.variation === "echart-gantt-chart" && (
					<GanttToolsList id={id} />
				)}
				{data.variation === "echart-dendrogram-chart" && (
					<DendrogramToolsList id={id} />
				)}
				{data.variation === "echart-word-cloud" && (
					<CloudChartTools id={id} />
				)}
			</div>
		);
	});
