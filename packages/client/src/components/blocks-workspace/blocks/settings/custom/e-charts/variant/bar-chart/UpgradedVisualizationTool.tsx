import { InfoOutlined } from "@mui/icons-material";
import ImageIcon from "@mui/icons-material/Image";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	BlockDef,
	EchartVisualizationBlockConfig,
	type EchartVisualizationBlockDef,
	getValueByPath,
	PathValue,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import {
	AutocompleteTwo,
	List,
	ListItemButtonTwo,
	ListItemIcon,
	ListItemText,
	ListItemTwo,
	Stack,
	styled,
	TextField,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { getShowFieldOptions } from "../../../../../block-settings/block-defaults.shared";
import { SelectInputSettings } from "../../../../../settings";
import { ResizeSetting, SizeSettings } from "../../../../shared";
import { ColorPalatteSettings } from "../../../../shared/ColorPalatteSettings";
import { ColorPickerSettings } from "../../../../shared/ColorPickerSettings";
import { BAR_CHART_DATA } from "../../Visualization.constants";
import { ChangeOrientation } from "../dendrogram/ChangeOrientation";
import { CustomizeDendrogramSymbol } from "../dendrogram/CustomizeDendrogramSymbol";
import { LabelsDendrogram } from "../dendrogram/LabelsDendrogram";
import { LegendDendrogram } from "../dendrogram/LegendDendrogram";
import { CustomizeSymbol } from "../Gantt/CustomizeSymbol";
import { GanttDisplayValueLabels } from "../Gantt/GanttDisplayValueLabels";
//upgraded visualization tool propsimport { EditXAxisScatterPlot } from '../scatter-plot/EditXAxisScatterPlot';
import { GanttFiscal } from "../Gantt/GanttFiscal";
import { GanttGroupView } from "../Gantt/GanttGroupView";
import { GanttLegend } from "../Gantt/GanttLegend";
import { GanttTargetLine } from "../Gantt/GanttTargetLine";
import { LineLegend } from "../line-chart/LineLegend";
import { LineStyling } from "../line-chart/LineStyling";
import { TitleTool } from "../TitleTool";
import { LineTooltip } from "../line-chart/LineTooltip";
import { LineValueLabels } from "../line-chart/LineValueLabel";
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
const StyledListItem = styled(ListItemTwo)(({}) => ({
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
				<ListItemButtonTwo
					onClick={(e) =>
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
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								dendrogramSelection ===
								"customizeDendrogramSymbol"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Customize Symbol" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{dendrogramSelection === "customizeDendrogramSymbol" && (
					<CustomizeDendrogramSymbol id={id} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setDendrogramSelection((prevList) =>
							prevList === "changeOrientation"
								? ""
								: "changeOrientation",
						)
					}
					selected={dendrogramSelection === "changeOrientation"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								dendrogramSelection === "changeOrientation"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Change Orientation" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{dendrogramSelection === "changeOrientation" && (
					<ChangeOrientation id={id} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setDendrogramSelection((prevList) =>
							prevList === "legendDendrogram"
								? ""
								: "legendDendrogram",
						)
					}
					selected={dendrogramSelection === "legendDendrogram"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								dendrogramSelection === "legendDendrogram"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Legend" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{dendrogramSelection === "legendDendrogram" && (
					<LegendDendrogram id={id} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setDendrogramSelection((prevList) =>
							prevList === "showLabelsDendrogram"
								? ""
								: "showLabelsDendrogram",
						)
					}
					selected={dendrogramSelection === "showLabelsDendrogram"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								dendrogramSelection === "showLabelsDendrogram"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Labels" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{dendrogramSelection === "showLabelsDendrogram" && (
					<LabelsDendrogram id={id} path={"option"} />
                )}
            </StyledListItem>
            <StyledListItem disablePadding>
                        <ListItemButtonTwo
                            onClick={(e) =>
                                setDendrogramSelection((prevList) =>
                                    prevList === "title" ? "" : "title",
                                )
                            }
                            selected={dendrogramSelection === "title"}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        dendrogramSelection === "title"
                                            ? "primary"
                                            : "disabled"
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Chart Title" />
                            <InfoOutlined />
                        </ListItemButtonTwo>
                    {dendrogramSelection === "title" && (
                        <TitleTool id={id} path={"option"} />
    				)}
    			</StyledListItem>
		</>
	);
};

const ResizingTool = ({ id }) => {
	const [resizeSelection, setResizeSelection] = useState("");
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
	return (
		<>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setResizeSelection((prevList) =>
							prevList === "resizing" ? "" : "resizing",
						)
					}
					selected={resizeSelection === "resizing"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								resizeSelection === "resizing"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Resizing" />
					<InfoOutlined />
				</ListItemButtonTwo>
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
		</>
	);
};

const ColorpalatteTool = ({ id }) => {
	const [colorPalatteSelection, setColorPalatteSelection] = useState("");
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

	return (
		<>
			<ListItemTwo disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setColorPalatteSelection((prevList) =>
							prevList === "colourpalette" ? "" : "colourpalette",
						)
					}
					selected={colorPalatteSelection === "colourpalette"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								colorPalatteSelection === "colourpalette"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Color Palette" />
					<InfoOutlined />
				</ListItemButtonTwo>
			</ListItemTwo>
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
				<ListItemButtonTwo
					onClick={(e) =>
						setGanttSelection((prevList) =>
							prevList === "fiscalaxis" ? "" : "fiscalaxis",
						)
					}
					selected={ganttSelection === "fiscalaxis"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "fiscalaxis"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText
						primary="Fiscal Axis"
					/>
					<InfoOutlined />
				</ListItemButtonTwo>
			</StyledListItem>
			{ganttSelection === "fiscalaxis" && (
				<GanttFiscal id={id} path={"option"} />
			)}
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setGanttSelection((prevList) =>
							prevList === "targetdate" ? "" : "targetdate",
						)
					}
					selected={ganttSelection === "targetdate"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "targetdate"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText
						primary="Target Date"
					/>
					<InfoOutlined />
				</ListItemButtonTwo>
			</StyledListItem>
			{ganttSelection === "targetdate" && (
				<GanttTargetLine id={id} path={"option"} />
			)}
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setGanttSelection((prevList) =>
							prevList === "customizesymbol"
								? ""
								: "customizesymbol",
						)
					}
					selected={ganttSelection === "customizesymbol"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "customizesymbol"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText
						primary="Customize Symbol"
					/>
					<InfoOutlined />
				</ListItemButtonTwo>
			</StyledListItem>
			{ganttSelection === "customizesymbol" && (
				<CustomizeSymbol id={id} path={"option"} />
			)}
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setGanttSelection((prevList) =>
							prevList === "togglelegendgantt"
								? ""
								: "togglelegendgantt",
						)
					}
					selected={ganttSelection === "togglelegendgantt"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "togglelegendgantt"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText
						primary="Legend"
					/>
					<InfoOutlined />
				</ListItemButtonTwo>
			</StyledListItem>
			{ganttSelection === "togglelegendgantt" && (
				<GanttLegend id={id} path={"option"} />
			)}
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setGanttSelection((prevList) =>
							prevList === "togglegroupview"
								? ""
								: "togglegroupview",
						)
					}
					selected={ganttSelection === "togglegroupview"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "togglegroupview"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText
						primary="Group View"
					/>
					<InfoOutlined />
				</ListItemButtonTwo>
			</StyledListItem>
			{ganttSelection === "togglegroupview" && (
				<>
					<GanttGroupView id={id} path={"option"} />
				</>
			)}
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setGanttSelection((prevList) =>
							prevList === "displayvaluelabels"
								? ""
								: "displayvaluelabels",
						)
					}
					selected={ganttSelection === "displayvaluelabels"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								ganttSelection === "displayvaluelabels"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText
						primary="Display Value Labels"
					/>
					<InfoOutlined />
				</ListItemButtonTwo>
			</StyledListItem>

			{ganttSelection === "displayvaluelabels" && (
				<>
					<GanttDisplayValueLabels id={id} path="option" />
				</>
			)}
            <StyledListItem disablePadding>
                        <ListItemButtonTwo
                            onClick={(e) =>
                                setGanttSelection((prevList) =>
                                    prevList === "title" ? "" : "title",
                                )
                            }
                            selected={ganttSelection === "title"}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        ganttSelection === "title"
                                            ? "primary"
                                            : "disabled"
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Chart Title" />
                            <InfoOutlined />
                        </ListItemButtonTwo>
                    {ganttSelection === "title" && (
                        <TitleTool id={id} path={"option"} />
                    )}
                </StyledListItem>
		</>
	);
};

const StackChartTool = ({ id }) => {
	const [stackChartSelection, setStackChartSelection] = useState("");
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setStackChartSelection((prevList) =>
							prevList === "editxaxis" ? "" : "editxaxis",
						)
					}
					selected={stackChartSelection === "editxaxis"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "editxaxis"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Edit X Axis" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{stackChartSelection === "editxaxis" && (
					<EditXAxisStackChart
						id={id}
						path={"option"}
					></EditXAxisStackChart>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setStackChartSelection((prevList) =>
							prevList === "edityaxis" ? "" : "edityaxis",
						)
					}
					selected={stackChartSelection === "edityaxis"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "edityaxis"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Edit Y Axis" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{stackChartSelection === "edityaxis" && (
					<EditYAxisStackChart
						id={id}
						path={"option"}
					></EditYAxisStackChart>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setStackChartSelection((prevList) =>
							prevList === "valuelabel" ? "" : "valuelabel",
						)
					}
					selected={stackChartSelection === "valuelabel"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "valuelabel"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Value Label" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{stackChartSelection === "valuelabel" && (
					<ValueLabelStackChart
						id={id}
						path={"option"}
					></ValueLabelStackChart>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setStackChartSelection((prevList) =>
							prevList === "tooltips" ? "" : "tooltips",
						)
					}
					selected={stackChartSelection === "tooltips"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "tooltips"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Tooltips" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{stackChartSelection === "tooltips" && (
					<TooltipScatterPlot id={id} path="option" />
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setStackChartSelection((prevList) =>
							prevList === "barstyle" ? "" : "barstyle",
						)
					}
					selected={stackChartSelection === "barstyle"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "barstyle"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Bar Style" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{stackChartSelection === "barstyle" && (
					<StackChartBarStyle id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setStackChartSelection((prevList) =>
							prevList === "legend" ? "" : "legend",
						)
					}
					selected={stackChartSelection === "legend"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								stackChartSelection === "legend"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Legend" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{stackChartSelection === "legend" && (
					<LegendStackChart id={id} path={"option"} />
                )}
            </StyledListItem>
            <StyledListItem disablePadding>
                        <ListItemButtonTwo
                            onClick={(e) =>
                                setStackChartSelection((prevList) =>
                                    prevList === "title" ? "" : "title",
                                )
                            }
                            selected={stackChartSelection === "title"}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        stackChartSelection === "title"
                                            ? "primary"
                                            : "disabled"
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Chart Title" />
                            <InfoOutlined />
                        </ListItemButtonTwo>
                    {stackChartSelection === "title" && (
                        <TitleTool id={id} path={"option"} />
    				)}
    			</StyledListItem>
		</>
	);
};

const BarToolsList = ({ id }) => {
	const [barSelection, setBarSelection] = useState("");
	const { data, setData } = useBlockSettings(id);
	function updateChart() {}
	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setBarSelection((prevList) =>
							prevList === "colourbyvalue" ? "" : "colourbyvalue",
						)
					}
					selected={barSelection === "colourbyvalue"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "colourbyvalue"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Colour By Value" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{barSelection === "colourbyvalue" && (
					<ColourByValue
						id={id}
						updateChart={updateChart}
						path="option"
					/>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setBarSelection((prevList) =>
							prevList === "editxaxis" ? "" : "editxaxis",
						)
					}
					selected={barSelection === "editxaxis"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "editxaxis"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Edit X Axis" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{barSelection === "editxaxis" && (
					<EditXAxis id={id} option={data.option} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setBarSelection((prevList) =>
							prevList === "edityaxis" ? "" : "edityaxis",
						)
					}
					selected={barSelection === "edityaxis"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "edityaxis"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Edit Y Axis" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{barSelection === "edityaxis" && (
					<EditYAxis id={id} option={data.option} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setBarSelection((prevList) =>
							prevList === "valuelabel" ? "" : "valuelabel",
						)
					}
					selected={barSelection === "valuelabel"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "valuelabel"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Value Label" />
					<InfoOutlined />
				</ListItemButtonTwo>
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
				<ListItemButtonTwo
					onClick={(e) =>
						setBarSelection((prevList) =>
							prevList === "barstyle" ? "" : "barstyle",
						)
					}
					selected={barSelection === "barstyle"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "barstyle"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Bar Style" />
					<InfoOutlined />
				</ListItemButtonTwo>
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
				<ListItemButtonTwo
					onClick={(e) =>
						setBarSelection((prevList) =>
							prevList === "chartstyle" ? "" : "chartstyle",
						)
					}
					selected={barSelection === "chartstyle"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "chartstyle"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Chart Style" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{barSelection === "chartstyle" && (
					<TitleTool
						id={id}
						path="option"
					/>
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setBarSelection((prevList) =>
							prevList === "trendlines" ? "" : "trendlines",
						)
					}
					selected={barSelection === "trendlines"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								barSelection === "trendlines"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Trendlines" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{barSelection === "trendlines" && (
					<ToggleTrendline
						id={id}
						options={data.option}
						updateChart={updateChart}
						chartType={BAR_CHART_DATA.JSONVALUE[0]}
						path="option"
					/>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				{data.variation === "echart-bar-graph" && (
					<ListItemButtonTwo
						onClick={(e) =>
							setBarSelection((prevList) =>
								prevList === "barlegend" ? "" : "barlegend",
							)
						}
						selected={barSelection === "barlegend"}
					>
						<ListItemIcon>
							<ImageIcon
								fontSize="large"
								color={
									barSelection === "barlegend"
										? "primary"
										: "disabled"
								}
							/>
						</ListItemIcon>
						<ListItemText primary="Legend" />
						<InfoOutlined />
					</ListItemButtonTwo>
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
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setScatterSelection((prevList) =>
							prevList === "editxaxis" ? "" : "editxaxis",
						)
					}
					selected={scatterSelection === "editxaxis"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "editxaxis"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Edit X Axis" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{scatterSelection === "editxaxis" && (
					<EditXAxisScatterPlot
						id={id}
						path={"option"}
					></EditXAxisScatterPlot>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setScatterSelection((prevList) =>
							prevList === "edityaxis" ? "" : "edityaxis",
						)
					}
					selected={scatterSelection === "edityaxis"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "edityaxis"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Edit Y Axis" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{scatterSelection === "edityaxis" && (
					<EditYAxisScatterPlot
						id={id}
						path={"option"}
					></EditYAxisScatterPlot>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setScatterSelection((prevList) =>
							prevList === "valuelabel" ? "" : "valuelabel",
						)
					}
					selected={scatterSelection === "valuelabel"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "valuelabel"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Value Label" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{scatterSelection === "valuelabel" && (
					<ValueLabelScatterPlot
						id={id}
						path={"option"}
					></ValueLabelScatterPlot>
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setScatterSelection((prevList) =>
							prevList === "tooltips" ? "" : "tooltips",
						)
					}
					selected={scatterSelection === "tooltips"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "tooltips"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Tooltips" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{scatterSelection === "tooltips" && (
					<TooltipScatterPlot
						id={id}
						path={"option"}
					></TooltipScatterPlot>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setScatterSelection((prevList) =>
							prevList === "symbol" ? "" : "symbol",
						)
					}
					selected={scatterSelection === "symbol"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "symbol"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Symbol" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{scatterSelection === "symbol" && (
					<ScatterPlotSymbol
						id={id}
						path={"option"}
					></ScatterPlotSymbol>
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setScatterSelection((prevList) =>
							prevList === "scatter-plots-title"
								? ""
								: "scatter-plots-title",
						)
					}
					selected={scatterSelection === "scatter-plots-title"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								scatterSelection === "scatter-plots-title"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Chart Title" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{scatterSelection === "scatter-plots-title" && (
					<TitleTool
						id={id}
						path={"option"}
					></TitleTool>
				)}
			</StyledListItem>
		</>
	);
};
const LineChartTools = ({ id }) => {
	const [lineSelection, setLineSelection] = useState("");
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setLineSelection((prevList) =>
							prevList === "lineTitle" ? "" : "lineTitle",
						)
					}
					selected={lineSelection === "lineTitle"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineTitle"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Chart Title" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{lineSelection === "lineTitle" && (
					<TitleTool id={id} path="option" />
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setLineSelection((prevList) =>
							prevList === "lineLegend" ? "" : "lineLegend",
						)
					}
					selected={lineSelection === "lineLegend"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineLegend"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Line Legend" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{lineSelection === "lineLegend" && (
					<LineLegend id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setLineSelection((prevList) =>
							prevList === "lineTooltip" ? "" : "lineTooltip",
						)
					}
					selected={lineSelection === "lineTooltip"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineTooltip"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Line Tooltip" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{lineSelection === "lineTooltip" && (
					<LineTooltip id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setLineSelection((prevList) =>
							prevList === "lineValueLabel"
								? ""
								: "lineValueLabel",
						)
					}
					selected={lineSelection === "lineValueLabel"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineValueLabel"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Value Labels" />
					<InfoOutlined />
				</ListItemButtonTwo>
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
				<ListItemButtonTwo
					onClick={(e) =>
						setLineSelection((prevList) =>
							prevList === "lineXAixsStyling"
								? ""
								: "lineXAixsStyling",
						)
					}
					selected={lineSelection === "lineXAixsStyling"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineXAixsStyling"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="X Axis Styling" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{lineSelection === "lineXAixsStyling" && (
					<XAxisStyling id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setLineSelection((prevList) =>
							prevList === "lineYAixsStyling"
								? ""
								: "lineYAixsStyling",
						)
					}
					selected={lineSelection === "lineYAixsStyling"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineYAixsStyling"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Y Axis Styling" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{lineSelection === "lineYAixsStyling" && (
					<YAxisStyling id={id} path="option" />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setLineSelection((prevList) =>
							prevList === "lineStyling" ? "" : "lineStyling",
						)
					}
					selected={lineSelection === "lineStyling"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								lineSelection === "lineStyling"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Line Styling" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{lineSelection === "lineStyling" && (
					<LineStyling id={id} path="option" />
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
				<ListItemButtonTwo
					onClick={(e) =>
						setMapSelection((prevList) =>
							prevList === "tooltips" ? "" : "tooltips",
						)
					}
					selected={mapSelection === "tooltips"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								mapSelection === "tooltips"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Tooltips" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{mapSelection === "tooltips" && (
					<TooltipMapChart id={id} path={"option"} />
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setMapSelection((prevList) =>
							prevList === "legend" ? "" : "legend",
						)
					}
					selected={mapSelection === "legend"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								mapSelection === "legend"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Legend" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{mapSelection === "legend" && (
					<LegendToggleMapChart id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setMapSelection((prevList) =>
							prevList === "symbol" ? "" : "symbol",
						)
					}
					selected={mapSelection === "symbol"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								mapSelection === "symbol"
									? "primary"
									: "disabled"
							}
						></ImageIcon>
					</ListItemIcon>

					<ListItemText primary="Map Marker Size" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{mapSelection === "symbol" && (
					<MapMarkerSize id={id} path={"option"}></MapMarkerSize>
                )}
            </StyledListItem>
            <StyledListItem disablePadding>
                        <ListItemButtonTwo
                            onClick={(e) =>
                                setMapSelection((prevList) =>
                                    prevList === "title" ? "" : "title",
                                )
                            }
                            selected={mapSelection === "title"}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        mapSelection === "title"
                                            ? "primary"
                                            : "disabled"
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Chart Title" />
                            <InfoOutlined />
                        </ListItemButtonTwo>
                    {mapSelection === "title" && (
                        <TitleTool id={id} path={"option"} />
    				)}
    			</StyledListItem>
		</>
	);
};

const PieChartTools = ({ id }) => {
	const [pieSelection, setPieSelection] = useState("");
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

	return (
		<>
			<ColorpalatteTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setPieSelection((prevList) =>
							prevList === "tooltip" ? "" : "tooltip",
						)
					}
					selected={pieSelection === "tooltip"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "tooltip"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Tooltip" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{pieSelection === "tooltip" && (
					<CustomTooltip id={id} path={"option"} />
				)}
			</StyledListItem>
			<ResizingTool id={id} />
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setPieSelection((prevList) =>
							prevList === "legend" ? "" : "legend",
						)
					}
					selected={pieSelection === "legend"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "legend"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Legend" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{pieSelection === "legend" && (
					<PieLegend id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setPieSelection((prevList) =>
							prevList === "donutToggle" ? "" : "donutToggle",
						)
					}
					selected={pieSelection === "donutToggle"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "donutToggle"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Donut - Toggle" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{pieSelection === "donutToggle" && (
					<ToogleDonut id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setPieSelection((prevList) =>
							prevList === "title" ? "" : "title",
						)
					}
					selected={pieSelection === "title"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "title"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Chart Title" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{pieSelection === "title" && (
					<TitleTool id={id} path={"option"} />
				)}
			</StyledListItem>
			<StyledListItem disablePadding>
				<ListItemButtonTwo
					onClick={(e) =>
						setPieSelection((prevList) =>
							prevList === "valueLabel" ? "" : "valueLabel",
						)
					}
					selected={pieSelection === "valueLabel"}
				>
					<ListItemIcon>
						<ImageIcon
							fontSize="large"
							color={
								pieSelection === "valueLabel"
									? "primary"
									: "disabled"
							}
						/>
					</ListItemIcon>
					<ListItemText primary="Value Label" />
					<InfoOutlined />
				</ListItemButtonTwo>
				{pieSelection === "valueLabel" && (
					<PieValueLabel id={id} path={"option"} />
				)}
			</StyledListItem>
		</>
	);
};

export const UpgradedVisualizationTool =
	observer<UpgradedVisualizationToolProps>(({ id }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [selectedList, setSelectedList] = useState(""); // maintain the current selected list, for expansion and collapsing
		const [generalSettings, setGeneralSettings] = useState({
			showBlock: data.show,
		});
		const queriesList = getShowFieldOptions(id);
		const [chartType, setChartType] = useState(data.variation);
		return (
			<>
				<List style={{ width: "100%" }}>
					{/* 
                        Custom section to handle bar chart components for respective menu section 
                        BAR Chart Menu for tools start here
                        */}
					<ListItemTwo disablePadding style={{ display: "block" }}>
						<ListItemButtonTwo
							onClick={(e) =>
								setSelectedList((prevList) =>
									prevList === "generalchartsettings"
										? ""
										: "generalchartsettings",
								)
							}
							selected={selectedList === "generalchartsettings"}
						>
							<ListItemIcon>
								<ImageIcon
									fontSize="large"
									color={
										selectedList === "generalchartsettings"
											? "primary"
											: "disabled"
									}
								/>
							</ListItemIcon>
							<ListItemText primary="Conditional" />
							<InfoOutlined />
						</ListItemButtonTwo>
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
					</ListItemTwo>
					{data.variation === "echart-world-map-chart" && (
						<>
							<MapChartTools id={id} />
						</>
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
				</List>
			</>
		);
	});
