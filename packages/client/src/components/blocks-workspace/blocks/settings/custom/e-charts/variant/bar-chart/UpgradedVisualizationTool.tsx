import { InfoOutlined } from "@mui/icons-material";
import ImageIcon from "@mui/icons-material/Image";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import type { EchartVisualizationBlockDef } from "@semoss/renderer";
import { List, Stack, styled } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
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
//upgraded visualization tool propsimport { EditXAxisScatterPlot } from '../scatter-plot/EditXAxisScatterPlot';
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

//upgraded visualization tool propsimport { EditXAxisScatterPlot } from '../ScatterPlot/EditXAxisScatterPlot';

interface UpgradedVisualizationToolProps {
	id: string;
}
//Styled list item with contents type display
const StyledListItem = styled(List.Item)(() => ({
	display: "contents !important",
}));

const StyledItem = styled("div")(() => ({
	display: "block",
	width: "100%",
	padding: "0.5rem",
}));

const DendrogramToolsList = ({ id }) => {
	const [dendrogramSelection, setDendrogramSelection] = useState("");
	return (
		<>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setDendrogramSelection((prevList) =>
							prevList === "customizeDendrogramSymbol"
								? ""
								: "customizeDendrogramSymbol",
						)
					}
					selected={
						dendrogramSelection === "customizeDendrogramSymbol"
					}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								dendrogramSelection ===
								"customizeDendrogramSymbol"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Customize Symbol" />
					<InfoOutlined />
				</List.ItemButton>
				{dendrogramSelection === "customizeDendrogramSymbol" && (
					<CustomizeDendrogramSymbol id={id} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setDendrogramSelection((prevList) =>
							prevList === "changeOrientation"
								? ""
								: "changeOrientation",
						)
					}
					selected={dendrogramSelection === "changeOrientation"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								dendrogramSelection === "changeOrientation"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Change Orientation" />
					<InfoOutlined />
				</List.ItemButton>
				{dendrogramSelection === "changeOrientation" && (
					<ChangeOrientation id={id} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setDendrogramSelection((prevList) =>
							prevList === "legendDendrogram"
								? ""
								: "legendDendrogram",
						)
					}
					selected={dendrogramSelection === "legendDendrogram"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								dendrogramSelection === "legendDendrogram"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Legend" />
					<InfoOutlined />
				</List.ItemButton>
				{dendrogramSelection === "legendDendrogram" && (
					<LegendDendrogram id={id} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setDendrogramSelection((prevList) =>
							prevList === "showLabelsDendrogram"
								? ""
								: "showLabelsDendrogram",
						)
					}
					selected={dendrogramSelection === "showLabelsDendrogram"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								dendrogramSelection === "showLabelsDendrogram"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Labels" />
					<InfoOutlined />
				</List.ItemButton>
				{dendrogramSelection === "showLabelsDendrogram" && (
					<LabelsDendrogram id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setDendrogramSelection((prevList) =>
							prevList === "title" ? "" : "title",
						)
					}
					selected={dendrogramSelection === "title"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								dendrogramSelection === "title"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Title" />
					<InfoOutlined />
				</List.ItemButton>
				{dendrogramSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</StyledListItem>
		</>
	);
};

const ResizingTool = ({ id }) => {
	const [resizeSelection, setResizeSelection] = useState("");
	return (
		<StyledListItem disablePadding>
			<List.ItemButton
				onClick={() =>
					setResizeSelection((prevList) =>
						prevList === "resizing" ? "" : "resizing",
					)
				}
				selected={resizeSelection === "resizing"}
			>
				<List.ItemIcon>
					<ImageIcon
						fontSize="large"
						color={
							resizeSelection === "resizing"
								? "primary"
								: "disabled"
						}
					/>
				</List.ItemIcon>
				<List.ItemText primary="Resizing" />
				<InfoOutlined />
			</List.ItemButton>
			{resizeSelection === "resizing" && (
				<Stack>
					<ResizeSetting
						id={id}
						label={"Height"}
						path={"style.height"}
					></ResizeSetting>
					<ResizeSetting
						id={id}
						label={"Width"}
						path={"style.width"}
					></ResizeSetting>
				</Stack>
			)}
		</StyledListItem>
	);
};

const ColorpalatteTool = ({ id }) => {
	const [colorPalatteSelection, setColorPalatteSelection] = useState("");
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

	return (
		<>
			<List.Item disablePadding>
				<List.ItemButton
					onClick={() =>
						setColorPalatteSelection((prevList) =>
							prevList === "colourpalette" ? "" : "colourpalette",
						)
					}
					selected={colorPalatteSelection === "colourpalette"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								colorPalatteSelection === "colourpalette"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Color Palette" />
					<InfoOutlined />
				</List.ItemButton>
			</List.Item>
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
		</>
	);
};

const GanttToolsList = ({ id }) => {
	const [ganttSelection, setGanttSelection] = useState("");
	return (
		<>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "fiscalaxis" ? "" : "fiscalaxis",
						)
					}
					selected={ganttSelection === "fiscalaxis"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "fiscalaxis"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Fiscal Axis" />
					<InfoOutlined />
				</List.ItemButton>
			</StyledListItem>
			{ganttSelection === "fiscalaxis" && (
				<GanttFiscal id={id} path={"option"} />
			)}
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "xaxis" ? "" : "xaxis",
						)
					}
					selected={ganttSelection === "xaxis"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "xaxis"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Edit X Axis" />
					<InfoOutlined />
				</List.ItemButton>
			</StyledListItem>
			{ganttSelection === "xaxis" && (
				<EditGanttAxis id={id} path={"option"} axis="x" />
			)}
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "yaxis" ? "" : "yaxis",
						)
					}
					selected={ganttSelection === "yaxis"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "yaxis"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Edit Y Axis" />
					<InfoOutlined />
				</List.ItemButton>
			</StyledListItem>
			{ganttSelection === "yaxis" && (
				<EditGanttAxis id={id} path={"option"} axis="y" />
			)}
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "chartposition" ? "" : "chartposition",
						)
					}
					selected={ganttSelection === "chartposition"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "chartposition"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Position" />
					<InfoOutlined />
				</List.ItemButton>
			</StyledListItem>
			{ganttSelection === "chartposition" && (
				<>
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
				</>
			)}

			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "targetdate" ? "" : "targetdate",
						)
					}
					selected={ganttSelection === "targetdate"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "targetdate"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Target Date" />
					<InfoOutlined />
				</List.ItemButton>
			</StyledListItem>
			{ganttSelection === "targetdate" && (
				<GanttTargetLine id={id} path={"option"} />
			)}
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "customizesymbol"
								? ""
								: "customizesymbol",
						)
					}
					selected={ganttSelection === "customizesymbol"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "customizesymbol"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Customize Symbol" />
					<InfoOutlined />
				</List.ItemButton>
			</StyledListItem>
			{ganttSelection === "customizesymbol" && (
				<CustomizeSymbol id={id} path={"option"} />
			)}
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "togglelegendgantt"
								? ""
								: "togglelegendgantt",
						)
					}
					selected={ganttSelection === "togglelegendgantt"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "togglelegendgantt"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Legend" />
					<InfoOutlined />
				</List.ItemButton>
			</StyledListItem>
			{ganttSelection === "togglelegendgantt" && (
				<GanttLegend id={id} path={"option"} />
			)}
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "togglegroupview"
								? ""
								: "togglegroupview",
						)
					}
					selected={ganttSelection === "togglegroupview"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "togglegroupview"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Group View" />
					<InfoOutlined />
				</List.ItemButton>
			</StyledListItem>
			{ganttSelection === "togglegroupview" && (
				<GanttGroupView id={id} path={"option"} />
			)}
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "displayvaluelabels"
								? ""
								: "displayvaluelabels",
						)
					}
					selected={ganttSelection === "displayvaluelabels"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "displayvaluelabels"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Display Value Labels" />
					<InfoOutlined />
				</List.ItemButton>
			</StyledListItem>

			{ganttSelection === "displayvaluelabels" && (
				<GanttDisplayValueLabels id={id} path="option" />
			)}
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setGanttSelection((prevList) =>
							prevList === "title" ? "" : "title",
						)
					}
					selected={ganttSelection === "title"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "title"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Title" />
					<InfoOutlined />
				</List.ItemButton>
				{ganttSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</StyledListItem>
		</>
	);
};

const StackChartTool = ({ id }) => {
	const [stackChartSelection, setStackChartSelection] = useState("");
	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setStackChartSelection((prevList) =>
							prevList === "editxaxis" ? "" : "editxaxis",
						)
					}
					selected={stackChartSelection === "editxaxis"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "editxaxis"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Edit X Axis" />
					<InfoOutlined />
				</List.ItemButton>
				{stackChartSelection === "editxaxis" && (
					<EditXAxisStackChart
						id={id}
						path={"option"}
					></EditXAxisStackChart>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setStackChartSelection((prevList) =>
							prevList === "edityaxis" ? "" : "edityaxis",
						)
					}
					selected={stackChartSelection === "edityaxis"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "edityaxis"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Edit Y Axis" />
					<InfoOutlined />
				</List.ItemButton>
				{stackChartSelection === "edityaxis" && (
					<EditYAxisStackChart
						id={id}
						path={"option"}
					></EditYAxisStackChart>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setStackChartSelection((prevList) =>
							prevList === "valuelabel" ? "" : "valuelabel",
						)
					}
					selected={stackChartSelection === "valuelabel"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "valuelabel"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Value Label" />
					<InfoOutlined />
				</List.ItemButton>
				{stackChartSelection === "valuelabel" && (
					<ValueLabelStackChart
						id={id}
						path={"option"}
					></ValueLabelStackChart>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setStackChartSelection((prevList) =>
							prevList === "tooltips" ? "" : "tooltips",
						)
					}
					selected={stackChartSelection === "tooltips"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "tooltips"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Tooltips" />
					<InfoOutlined />
				</List.ItemButton>
				{stackChartSelection === "tooltips" && (
					<TooltipScatterPlot id={id} path="option" />
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setStackChartSelection((prevList) =>
							prevList === "barstyle" ? "" : "barstyle",
						)
					}
					selected={stackChartSelection === "barstyle"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "barstyle"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Bar Style" />
					<InfoOutlined />
				</List.ItemButton>
				{stackChartSelection === "barstyle" && (
					<StackChartBarStyle id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setStackChartSelection((prevList) =>
							prevList === "legend" ? "" : "legend",
						)
					}
					selected={stackChartSelection === "legend"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "legend"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Legend" />
					<InfoOutlined />
				</List.ItemButton>
				{stackChartSelection === "legend" && (
					<LegendStackChart id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setStackChartSelection((prevList) =>
							prevList === "title" ? "" : "title",
						)
					}
					selected={stackChartSelection === "title"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "title"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Title" />
					<InfoOutlined />
				</List.ItemButton>
				{stackChartSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</StyledListItem>
		</>
	);
};

const BarToolsList = ({ id }) => {
	const [barSelection, setBarSelection] = useState("");
	const { data } = useBlockSettings(id);
	function updateChart() {}
	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setBarSelection((prevList) =>
							prevList === "colourbyvalue" ? "" : "colourbyvalue",
						)
					}
					selected={barSelection === "colourbyvalue"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "colourbyvalue"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Colour By Value" />
					<InfoOutlined />
				</List.ItemButton>
				{barSelection === "colourbyvalue" && (
					<ColourByValue
						id={id}
						updateChart={updateChart}
						path="option"
					/>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setBarSelection((prevList) =>
							prevList === "editxaxis" ? "" : "editxaxis",
						)
					}
					selected={barSelection === "editxaxis"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "editxaxis"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Edit X Axis" />
					<InfoOutlined />
				</List.ItemButton>
				{barSelection === "editxaxis" && (
					<EditXAxis id={id} option={data.option} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setBarSelection((prevList) =>
							prevList === "edityaxis" ? "" : "edityaxis",
						)
					}
					selected={barSelection === "edityaxis"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "edityaxis"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Edit Y Axis" />
					<InfoOutlined />
				</List.ItemButton>
				{barSelection === "edityaxis" && (
					<EditYAxis id={id} option={data.option} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setBarSelection((prevList) =>
							prevList === "valuelabel" ? "" : "valuelabel",
						)
					}
					selected={barSelection === "valuelabel"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "valuelabel"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Value Label" />
					<InfoOutlined />
				</List.ItemButton>
				{barSelection === "valuelabel" && (
					<CustomizeValueLabels
						id={id}
						option={data.option}
						chartType={BAR_CHART_DATA.JSONVALUE[0]}
						path="option"
					/>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setBarSelection((prevList) =>
							prevList === "barstyle" ? "" : "barstyle",
						)
					}
					selected={barSelection === "barstyle"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "barstyle"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Bar Style" />
					<InfoOutlined />
				</List.ItemButton>
				{barSelection === "barstyle" && (
					<VisualizationStyles
						id={id}
						option={data.option}
						path="option"
						chartType={BAR_CHART_DATA.JSONVALUE[0]}
						updateChart={updateChart}
					/>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setBarSelection((prevList) =>
							prevList === "chartstyle" ? "" : "chartstyle",
						)
					}
					selected={barSelection === "chartstyle"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "chartstyle"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Title" />
					<InfoOutlined />
				</List.ItemButton>
				{barSelection === "chartstyle" && (
					<TitleTool id={id} path="option" />
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setBarSelection((prevList) =>
							prevList === "trendlines" ? "" : "trendlines",
						)
					}
					selected={barSelection === "trendlines"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "trendlines"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Trendlines" />
					<InfoOutlined />
				</List.ItemButton>
				{barSelection === "trendlines" && (
					<ToggleTrendline
						id={id}
						chartType={BAR_CHART_DATA.JSONVALUE[0]}
						path="option"
					/>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				{data.variation === "echart-bar-graph" && (
					<List.ItemButton
						onClick={() =>
							setBarSelection((prevList) =>
								prevList === "barlegend" ? "" : "barlegend",
							)
						}
						selected={barSelection === "barlegend"}
					>
						<List.ItemIcon>
							<ImageIcon
								fontSize="large"
								color={
									barSelection === "barlegend"
										? "primary"
										: "disabled"
								}
							/>
						</List.ItemIcon>
						<List.ItemText primary="Legend" />
						<InfoOutlined />
					</List.ItemButton>
				)}
				{barSelection === "barlegend" && (
					<Legend id={id} path="option" />
				)}
			</StyledListItem>
		</>
	);
};

const ScatterToolsList = ({ id }) => {
	const [scatterSelection, setScatterSelection] = useState("");

	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setScatterSelection((prevList) =>
							prevList === "editxaxis" ? "" : "editxaxis",
						)
					}
					selected={scatterSelection === "editxaxis"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "editxaxis"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Edit X Axis" />
					<InfoOutlined />
				</List.ItemButton>
				{scatterSelection === "editxaxis" && (
					<EditXAxisScatterPlot
						id={id}
						path={"option"}
					></EditXAxisScatterPlot>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setScatterSelection((prevList) =>
							prevList === "edityaxis" ? "" : "edityaxis",
						)
					}
					selected={scatterSelection === "edityaxis"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "edityaxis"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Edit Y Axis" />
					<InfoOutlined />
				</List.ItemButton>
				{scatterSelection === "edityaxis" && (
					<EditYAxisScatterPlot
						id={id}
						path={"option"}
					></EditYAxisScatterPlot>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setScatterSelection((prevList) =>
							prevList === "valuelabel" ? "" : "valuelabel",
						)
					}
					selected={scatterSelection === "valuelabel"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "valuelabel"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Value Label" />
					<InfoOutlined />
				</List.ItemButton>
				{scatterSelection === "valuelabel" && (
					<ValueLabelScatterPlot
						id={id}
						path={"option"}
					></ValueLabelScatterPlot>
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setScatterSelection((prevList) =>
							prevList === "tooltips" ? "" : "tooltips",
						)
					}
					selected={scatterSelection === "tooltips"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "tooltips"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Tooltips" />
					<InfoOutlined />
				</List.ItemButton>
				{scatterSelection === "tooltips" && (
					<TooltipScatterPlot
						id={id}
						path={"option"}
					></TooltipScatterPlot>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setScatterSelection((prevList) =>
							prevList === "symbol" ? "" : "symbol",
						)
					}
					selected={scatterSelection === "symbol"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "symbol"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Symbol" />
					<InfoOutlined />
				</List.ItemButton>
				{scatterSelection === "symbol" && (
					<ScatterPlotSymbol
						id={id}
						path={"option"}
					></ScatterPlotSymbol>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setScatterSelection((prevList) =>
							prevList === "scatter-plots-title"
								? ""
								: "scatter-plots-title",
						)
					}
					selected={scatterSelection === "scatter-plots-title"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "scatter-plots-title"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Title" />
					<InfoOutlined />
				</List.ItemButton>
				{scatterSelection === "scatter-plots-title" && (
					<TitleTool id={id} path={"option"}></TitleTool>
				)}
			</StyledListItem>
		</>
	);
};
const LineChartTools = ({ id }) => {
	const [lineSelection, setLineSelection] = useState("");
	const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);

	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setLineSelection((prevList) =>
							prevList === "lineTitle" ? "" : "lineTitle",
						)
					}
					selected={lineSelection === "lineTitle"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineTitle"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Title" />
					<InfoOutlined />
				</List.ItemButton>
				{lineSelection === "lineTitle" && (
					<TitleTool id={id} path="option" />
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setLineSelection((prevList) =>
							prevList === "lineLegend" ? "" : "lineLegend",
						)
					}
					selected={lineSelection === "lineLegend"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineLegend"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Line Legend" />
					<InfoOutlined />
				</List.ItemButton>
				{lineSelection === "lineLegend" && (
					<LineLegend id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setLineSelection((prevList) =>
							prevList === "lineTooltip" ? "" : "lineTooltip",
						)
					}
					selected={lineSelection === "lineTooltip"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineTooltip"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Line Tooltip" />
					<InfoOutlined />
				</List.ItemButton>
				{lineSelection === "lineTooltip" && (
					<LineTooltip id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setLineSelection((prevList) =>
							prevList === "lineValueLabel"
								? ""
								: "lineValueLabel",
						)
					}
					selected={lineSelection === "lineValueLabel"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineValueLabel"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Value Labels" />
					<InfoOutlined />
				</List.ItemButton>
				{lineSelection === "lineValueLabel" && (
					<LineValueLabels
						id={id}
						option={data.option}
						chartType={BAR_CHART_DATA.JSONVALUE[0]}
						path="option"
					/>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setLineSelection((prevList) =>
							prevList === "lineXAixsStyling"
								? ""
								: "lineXAixsStyling",
						)
					}
					selected={lineSelection === "lineXAixsStyling"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineXAixsStyling"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="X Axis Styling" />
					<InfoOutlined />
				</List.ItemButton>
				{lineSelection === "lineXAixsStyling" && (
					<XAxisStyling id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setLineSelection((prevList) =>
							prevList === "lineYAixsStyling"
								? ""
								: "lineYAixsStyling",
						)
					}
					selected={lineSelection === "lineYAixsStyling"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineYAixsStyling"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Y Axis Styling" />
					<InfoOutlined />
				</List.ItemButton>
				{lineSelection === "lineYAixsStyling" && (
					<YAxisStyling id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setLineSelection((prevList) =>
							prevList === "lineStyling" ? "" : "lineStyling",
						)
					}
					selected={lineSelection === "lineStyling"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineStyling"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Line Styling" />
					<InfoOutlined />
				</List.ItemButton>
				{lineSelection === "lineStyling" && (
					<LineStyling id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setLineSelection((prevList) =>
							prevList === "dataZoom" ? "" : "dataZoom",
						)
					}
					selected={lineSelection === "dataZoom"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "dataZoom"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Data Zoom" />
					<InfoOutlined />
				</List.ItemButton>
				{lineSelection === "dataZoom" && <ToggleDataZoom id={id} />}
			</StyledListItem>
		</>
	);
};
const CloudChartTools = ({ id }) => {
	const [CloudSelection, setCloudSelection] = useState("");

	return (
		<>
			<ResizingTool id={id} />
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setCloudSelection((prevList) =>
							prevList === "title" ? "" : "title",
						)
					}
					selected={CloudSelection === "title"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								CloudSelection === "title"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Title" />
					<InfoOutlined />
				</List.ItemButton>
				{CloudSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setCloudSelection((prevList) =>
							prevList === "shape" ? "" : "shape",
						)
					}
					selected={CloudSelection === "shape"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								CloudSelection === "shape"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Cloud Settings" />
					<InfoOutlined />
				</List.ItemButton>
				{CloudSelection === "shape" && (
					<CloudSettings id={id} path={"option"} />
				)}
			</StyledListItem>
		</>
	);
};

const MapChartTools = ({ id }) => {
	const [mapSelection, setMapSelection] = useState("");
	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setMapSelection((prevList) =>
							prevList === "tooltips" ? "" : "tooltips",
						)
					}
					selected={mapSelection === "tooltips"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								mapSelection === "tooltips"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Tooltips" />
					<InfoOutlined />
				</List.ItemButton>
				{mapSelection === "tooltips" && (
					<TooltipMapChart id={id} path={"option"} />
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setMapSelection((prevList) =>
							prevList === "legend" ? "" : "legend",
						)
					}
					selected={mapSelection === "legend"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								mapSelection === "legend"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Legend" />
					<InfoOutlined />
				</List.ItemButton>
				{mapSelection === "legend" && (
					<LegendToggleMapChart id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setMapSelection((prevList) =>
							prevList === "symbol" ? "" : "symbol",
						)
					}
					selected={mapSelection === "symbol"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								mapSelection === "symbol"
									? "primary"
									: "disabled"
							}
						></ImageIcon>
					</List.ItemIcon>

					<List.ItemText primary="Map Marker Size" />
					<InfoOutlined />
				</List.ItemButton>
				{mapSelection === "symbol" && (
					<MapMarkerSize id={id} path={"option"}></MapMarkerSize>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setMapSelection((prevList) =>
							prevList === "title" ? "" : "title",
						)
					}
					selected={mapSelection === "title"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								mapSelection === "title"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Title" />
					<InfoOutlined />
				</List.ItemButton>
				{mapSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</StyledListItem>
		</>
	);
};

const PieChartTools = ({ id }) => {
	const [pieSelection, setPieSelection] = useState("");

	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setPieSelection((prevList) =>
							prevList === "tooltip" ? "" : "tooltip",
						)
					}
					selected={pieSelection === "tooltip"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "tooltip"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Tooltip" />
					<InfoOutlined />
				</List.ItemButton>
				{pieSelection === "tooltip" && (
					<CustomTooltip id={id} path={"option"} />
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setPieSelection((prevList) =>
							prevList === "legend" ? "" : "legend",
						)
					}
					selected={pieSelection === "legend"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "legend"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Legend" />
					<InfoOutlined />
				</List.ItemButton>
				{pieSelection === "legend" && (
					<PieLegend id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setPieSelection((prevList) =>
							prevList === "donutToggle" ? "" : "donutToggle",
						)
					}
					selected={pieSelection === "donutToggle"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "donutToggle"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Donut - Toggle" />
					<InfoOutlined />
				</List.ItemButton>
				{pieSelection === "donutToggle" && (
					<ToogleDonut id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setPieSelection((prevList) =>
							prevList === "title" ? "" : "title",
						)
					}
					selected={pieSelection === "title"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "title"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Chart Title" />
					<InfoOutlined />
				</List.ItemButton>
				{pieSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<List.ItemButton
					onClick={() =>
						setPieSelection((prevList) =>
							prevList === "valueLabel" ? "" : "valueLabel",
						)
					}
					selected={pieSelection === "valueLabel"}
				>
					<List.ItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "valueLabel"
									? "primary"
									: "disabled"
							}
						/>
					</List.ItemIcon>
					<List.ItemText primary="Value Label" />
					<InfoOutlined />
				</List.ItemButton>
				{pieSelection === "valueLabel" && (
					<PieValueLabel id={id} path={"option"} />
				)}
			</StyledListItem>
		</>
	);
};

export const UpgradedVisualizationTool =
	observer<UpgradedVisualizationToolProps>(({ id }) => {
		const { data } = useBlockSettings<EchartVisualizationBlockDef>(id);
		const [selectedList, setSelectedList] = useState(""); // maintain the current selected list, for expansion and collapsing
		return (
			<List sx={{ width: "100%" }}>
				{/* 
                        Custom section to handle bar chart components for respective menu section 
                        BAR Chart Menu for tools start here
                        */}
				<List.Item disablePadding sx={{ display: "block" }}>
					<List.ItemButton
						onClick={() =>
							setSelectedList((prevList) =>
								prevList === "generalchartsettings"
									? ""
									: "generalchartsettings",
							)
						}
						selected={selectedList === "generalchartsettings"}
					>
						<List.ItemIcon>
							<ImageIcon
								fontSize="large"
								color={
									selectedList === "generalchartsettings"
										? "primary"
										: "disabled"
								}
							/>
						</List.ItemIcon>
						<List.ItemText primary="Conditional" />
						<InfoOutlined />
					</List.ItemButton>
					{selectedList === "generalchartsettings" && (
						<StyledItem>
							<SelectInputSettings
								id={id}
								path={"show"}
								label={"Show Block"}
								options={[...getShowFieldOptions(id)]}
							/>
						</StyledItem>
					)}
				</List.Item>
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
			</List>
		);
	});
