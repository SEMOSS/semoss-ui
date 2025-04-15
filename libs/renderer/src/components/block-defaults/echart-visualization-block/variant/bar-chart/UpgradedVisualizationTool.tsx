import { useState } from "react";
import { observer } from "mobx-react-lite";
import ImageIcon from "@mui/icons-material/Image";
import { InfoOutlined } from "@mui/icons-material";
import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Autocomplete,
    TextField,
} from "@mui/material";

import { List, Stack, styled } from "@semoss/ui";

import { useBlockSettings } from "../../../../../hooks";
import { Legend } from "./Legend";
import { EditXAxis } from "./Edit-X-Axis";
import { EditYAxis } from "./Edit-Y-Axis";
import ColourByValue from "./ColourByValue";
import { ChartStyling } from "./ChartStyling";
import { PieTitle } from "../pie-chart/PieTitle";
import { PieLegend } from "../pie-chart/PieLegend";
import { ToggleTrendline } from "./ToggleTrendline";
import { ToogleDonut } from "../pie-chart/ToggleDonut";
import { PieValueLabel } from "../pie-chart/PieValueLabel";
import { CustomTooltip } from "../pie-chart/CustomTooltip";
import { updateSeriesColor } from "../shared/chart-utility";
import { VisualizationStyles } from "./VisualizationStyles";
import { CustomizeValueLabels } from "./CustomizeValueLabels";
import { BAR_CHART_DATA } from "../../Visualization.constants";
import { SizeSettings } from "../../../../block-settings/shared";
import { ResizeSetting } from "../../../../block-settings/shared";
import { ScatterPlotSymbol } from "../scatter-plot/ScatterPlotSymbol";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { TooltipScatterPlot } from "../scatter-plot/TooltipScatterPlot";
import { EditXAxisScatterPlot } from "../scatter-plot/EditXAxisScatterPlot";
import { EditYAxisScatterPlot } from "../scatter-plot/EditYAxisScatterPlot";
import { ValueLabelScatterPlot } from "../scatter-plot/ValueLabelScatterPlot";
import { ScatterPlotChartTitle } from "../scatter-plot/ScatterPlotChartTitle";

import { ColorPickerSettings } from "../../../../block-settings/shared/ColorPickerSettings";
import { ColorPalatteSettings } from "../../../../block-settings/shared/ColorPalatteSettings";
import { TooltipMapChart } from "../map-chart/TooltipMapChart";
import { LegendToggleMapChart } from "../map-chart/LegendToggleMapChart";
import { MapMarkerSize } from "../map-chart/MapMarkerSize";

import { LineTitle } from "../line-chart/LineTitle";
import { LineLegend } from "../line-chart/LineLegend";
import { LineTooltip } from "../line-chart/LineTooltip";
import { XAxisStyling } from "../line-chart/XAxisStyling";
import { YAxisStyling } from "../line-chart/YAxisStyling";
import { LineValueLabels } from "../line-chart/LineValueLabel";
import { LineStyling } from "../line-chart/LineStyling";
//upgraded visualization tool propsimport { EditXAxisScatterPlot } from '../scatter-plot/EditXAxisScatterPlot';
import { GanttFiscal } from "../Gantt/GanttFiscal";
import { GanttTargetLine } from "../Gantt/GanttTargetLine";
import { CustomizeSymbol } from "../Gantt/CustomizeSymbol";
import { GanttLegend } from "../Gantt/GanttLegend";
import { GanttGroupView } from "../Gantt/GanttGroupView";
import { GanttDisplayValueLabels } from "../Gantt/GanttDisplayValueLabels";
import { ValueLabelStackChart } from "../stack-chart/ValueLabelStackChart";
import { StackChartBarStyle } from "../stack-chart/StackChartBarStyle";
import { LegendStackChart } from "../stack-chart/LegendStackChart";
import { EditXAxisStackChart } from "../stack-chart/EditXAxisStackChart";
import { EditYAxisStackChart } from "../stack-chart/EditYAxisStackChart";
import {
    buildShowField,
    getShowFieldOptions,
} from "../../../block-defaults.shared";
import {
    SelectInputSettings,
    BaseSettingSection,
} from "../../../../block-settings";
import { CustomizeDendrogramSymbol } from '../dendrogram/CustomizeDendrogramSymbol';
import { ChangeOrientation } from '../dendrogram/ChangeOrientation';
import { LegendDendrogram } from "../dendrogram/LegendDendrogram";
import { LabelsDendrogram } from "../dendrogram/LabelsDendrogram";
//upgraded visualization tool propsimport { EditXAxisScatterPlot } from '../ScatterPlot/EditXAxisScatterPlot';

interface UpgradedVisualizationToolProps {
    id: string;
}
//Styled list item with contents type display
const StyledListItem = styled(ListItem)(({}) => ({
    display: "contents !important",
}));

const StyledItem = styled("div")(() => ({
    display: "block",
    width: "100%",
    padding: "0.5rem",
}));

const DendrogramToolsList = (({id}) => {
    const [dendrogramSelection, setDendrogramSelection] = useState('');
   return (
       <>
           <StyledListItem disablePadding>
                <ListItemButton
                    onClick={(e) =>
                        setDendrogramSelection((prevList) =>
                            prevList === "customizeDendrogramSymbol"
                                ? ""
                                : "customizeDendrogramSymbol",
                        )
                    }
                    selected={dendrogramSelection === "customizeDendrogramSymbol"}
                >
                    <ListItemIcon>
                        <ImageIcon
                            fontSize="large"
                            color={
                                dendrogramSelection === "customizeDendrogramSymbol"
                                    ? "primary"
                                    : "disabled"
                            }
                        />
                    </ListItemIcon>
                    <ListItemText primary="Customize Symbol" />
                    <InfoOutlined />
                </ListItemButton>
                {dendrogramSelection === "customizeDendrogramSymbol" && (
                    <CustomizeDendrogramSymbol id={id}/>
                )}
           </StyledListItem>
           <StyledListItem disablePadding>
                <ListItemButton
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
                </ListItemButton>
                {dendrogramSelection === "changeOrientation" && (
                    <ChangeOrientation id={id}/>
                )}
           </StyledListItem>
           <StyledListItem disablePadding>
                <ListItemButton
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
                </ListItemButton>
                {dendrogramSelection === "legendDendrogram" && (
                    <LegendDendrogram id={id}/>
                )}
           </StyledListItem>
           <StyledListItem disablePadding>
                <ListItemButton
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
                </ListItemButton>
                {dendrogramSelection === "showLabelsDendrogram" && (
                    <LabelsDendrogram id={id} path={'option'} />
                )}
           </StyledListItem>
       </>
   ) 
});

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
        function updateChart() {}
        return (
            <>
                <List style={{ width: "100%" }}>
                    {/* 
                    Custom section to handle bar chart components for respective menu section 
                    BAR Chart Menu for tools start here
                    */}
                    <ListItem disablePadding style={{ display: "block" }}>
                        <ListItemButton
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
                            <ListItemText primary="General" />
                            <InfoOutlined />
                        </ListItemButton>
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
                    </ListItem>
                    {data.variation !== "echart-gantt-chart" && (
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "colourpalette"
                                            ? ""
                                            : "colourpalette",
                                    )
                                }
                                selected={selectedList === "colourpalette"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "colourpalette"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Color Palette" />
                                <InfoOutlined />
                            </ListItemButton>
                        </ListItem>
                    )}
                    {selectedList === "colourpalette" &&
                        data.variation !== "echart-gantt-chart" && (
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
                    <StyledListItem disablePadding>
                        {data.variation === "echart-bar-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "colourbyvalue"
                                            ? ""
                                            : "colourbyvalue",
                                    )
                                }
                                selected={selectedList === "colourbyvalue"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "colourbyvalue"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Colour By Value" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "colourbyvalue" && (
                            <ColourByValue
                                id={id}
                                updateChart={updateChart}
                                path="option"
                            />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {(data.variation === "echart-bar-graph" ||
                            data.variation === "echart-scatter-plots" ||
                            data.variation === "echart-stack-chart") && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "editxaxis"
                                            ? ""
                                            : "editxaxis",
                                    )
                                }
                                selected={selectedList === "editxaxis"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "editxaxis"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Edit X Axis" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {data.variation === "echart-bar-graph" &&
                            selectedList === "editxaxis" && (
                                <EditXAxis
                                    id={id}
                                    option={data.option}
                                    path="option"
                                />
                            )}
                        {data.variation === "echart-scatter-plots" &&
                            selectedList === "editxaxis" && (
                                <EditXAxisScatterPlot
                                    id={id}
                                    path={"option"}
                                ></EditXAxisScatterPlot>
                            )}
                        {data.variation === "echart-stack-chart" &&
                            selectedList === "editxaxis" && (
                                <EditXAxisStackChart
                                    id={id}
                                    path={"option"}
                                ></EditXAxisStackChart>
                            )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {(data.variation === "echart-bar-graph" ||
                            data.variation === "echart-scatter-plots" ||
                            data.variation === "echart-stack-chart") && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "edityaxis"
                                            ? ""
                                            : "edityaxis",
                                    )
                                }
                                selected={selectedList === "edityaxis"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "edityaxis"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Edit Y Axis" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {data.variation === "echart-bar-graph" &&
                            selectedList === "edityaxis" && (
                                <EditYAxis
                                    id={id}
                                    option={data.option}
                                    path="option"
                                />
                            )}
                        {data.variation === "echart-scatter-plots" &&
                            selectedList === "edityaxis" && (
                                <EditYAxisScatterPlot
                                    id={id}
                                    path={"option"}
                                ></EditYAxisScatterPlot>
                            )}
                        {data.variation === "echart-stack-chart" &&
                            selectedList === "edityaxis" && (
                                <EditYAxisStackChart
                                    id={id}
                                    path={"option"}
                                ></EditYAxisStackChart>
                            )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {(data.variation === "echart-bar-graph" ||
                            data.variation === "echart-scatter-plots" ||
                            data.variation === "echart-stack-chart") && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "valuelabel"
                                            ? ""
                                            : "valuelabel",
                                    )
                                }
                                selected={selectedList === "valuelabel"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "valuelabel"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Value Label" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {data.variation === "echart-scatter-plots" &&
                            selectedList === "valuelabel" && (
                                <ValueLabelScatterPlot
                                    id={id}
                                    path={"option"}
                                ></ValueLabelScatterPlot>
                            )}
                        {data.variation === "echart-stack-chart" &&
                            selectedList === "valuelabel" && (
                                <ValueLabelStackChart
                                    id={id}
                                    path={"option"}
                                ></ValueLabelStackChart>
                            )}
                        {data.variation === "echart-bar-graph" &&
                            selectedList === "valuelabel" && (
                                <CustomizeValueLabels
                                    id={id}
                                    option={data.option}
                                    chartType={BAR_CHART_DATA.JSONVALUE[0]}
                                    path="option"
                                />
                            )}
                    </StyledListItem>
                    {(data.variation === "echart-scatter-plots" ||
                        data.variation === "echart-world-map-chart" ||
                        data.variation === "echart-stack-chart") && (
                        <StyledListItem disablePadding>
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "tooltips"
                                            ? ""
                                            : "tooltips",
                                    )
                                }
                                selected={selectedList === "tooltips"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "tooltips"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Tooltips" />
                                <InfoOutlined />
                            </ListItemButton>
                            {data.variation === "echart-scatter-plots" &&
                                selectedList === "tooltips" && (
                                    <TooltipScatterPlot
                                        id={id}
                                        path={"option"}
                                    ></TooltipScatterPlot>
                                )}
                            {data.variation === "echart-world-map-chart" &&
                                selectedList === "tooltips" && (
                                    <TooltipMapChart id={id} path={"option"} />
                                )}
                        </StyledListItem>
                    )}
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === "resizing" ? "" : "resizing",
                                )
                            }
                            selected={selectedList === "resizing"}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === "resizing"
                                            ? "primary"
                                            : "disabled"
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Resizing" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === "resizing" && (
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
                    <StyledListItem disablePadding>
                        {data.variation === "echart-bar-graph" ||
                            (data.variation === "echart-stack-chart" && (
                                <ListItemButton
                                    onClick={(e) =>
                                        setSelectedList((prevList) =>
                                            prevList === "barstyle"
                                                ? ""
                                                : "barstyle",
                                        )
                                    }
                                    selected={selectedList === "barstyle"}
                                >
                                    <ListItemIcon>
                                        <ImageIcon
                                            fontSize="large"
                                            color={
                                                selectedList === "barstyle"
                                                    ? "primary"
                                                    : "disabled"
                                            }
                                        />
                                    </ListItemIcon>
                                    <ListItemText primary="Bar Style" />
                                    <InfoOutlined />
                                </ListItemButton>
                            ))}
                        {data.variation === "echart-stack-chart" &&
                            selectedList === "barstyle" && (
                                <StackChartBarStyle id={id} path="option" />
                            )}
                        {data.variation === "echart-bar-graph" &&
                            selectedList === "barstyle" && (
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
                        {data.variation === "echart-bar-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "chartstyle"
                                            ? ""
                                            : "chartstyle",
                                    )
                                }
                                selected={selectedList === "chartstyle"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "chartstyle"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Chart Style" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "chartstyle" && (
                            // <VisualizationStyles
                            //     id={id}
                            //     option={data.option}
                            //     chartType={BAR_CHART_DATA.JSONVALUE[0]}
                            //     updateChart={updateChart}
                            // />
                            <ChartStyling
                                option={data.option}
                                id={id}
                                updateChart={updateChart}
                                path="option"
                            />
                        )}
                    </StyledListItem>
                    {data.variation === "echart-scatter-plots" && (
                        <StyledListItem disablePadding>
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "symbol" ? "" : "symbol",
                                    )
                                }
                                selected={selectedList === "symbol"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "symbol"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Symbol" />
                                <InfoOutlined />
                            </ListItemButton>
                            {selectedList === "symbol" && (
                                <ScatterPlotSymbol
                                    id={id}
                                    path={"option"}
                                ></ScatterPlotSymbol>
                            )}
                        </StyledListItem>
                    )}
                    <StyledListItem disablePadding>
                        {data.variation === "echart-bar-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "trendlines"
                                            ? ""
                                            : "trendlines",
                                    )
                                }
                                selected={selectedList === "trendlines"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "trendlines"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Trendlines" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "trendlines" && (
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
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "barlegend"
                                            ? ""
                                            : "barlegend",
                                    )
                                }
                                selected={selectedList === "barlegend"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "barlegend"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Legend" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "barlegend" && (
                            <Legend id={id} path="option" />
                        )}
                    </StyledListItem>
                    {/*<StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'sizing' ? '' : 'sizing',
                                )
                            }
                            selected={selectedList === 'sizing'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'sizing'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Sizing" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'sizing' && (
                            <>
                                <SizeSettings
                                    id={id}
                                    label="Height"
                                    path="style.height"
                                />
                                <SizeSettings
                                    id={id}
                                    label="Width"
                                    path="style.width"
                                />
                            </>
                        )}
                    </StyledListItem>*/}
                    {/* 
                        BAR Chart Menu for tools completes here
                        Custom section to handle pie chart components for respective menu section 
                        Pie Chart Menu for tools starts here
                    */}
                    <StyledListItem disablePadding>
                        {data.variation === "echart-pie-chart" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "tooltip" ? "" : "tooltip",
                                    )
                                }
                                selected={selectedList === "tooltip"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "tooltip"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Tooltip" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "tooltip" && (
                            <CustomTooltip id={id} path={"option"} />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {(data.variation === "echart-pie-chart" ||
                            data.variation === "echart-world-map-chart" ||
                            data.variation === "echart-stack-chart") && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "legend" ? "" : "legend",
                                    )
                                }
                                selected={selectedList === "legend"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "legend"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Legend" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {data.variation === "echart-world-map-chart" &&
                            selectedList === "legend" && (
                                <LegendToggleMapChart id={id} path={"option"} />
                            )}
                        {data.variation === "echart-pie-chart" &&
                            selectedList === "legend" && (
                                <PieLegend id={id} path={"option"} />
                            )}
                        {data.variation === "echart-stack-chart" &&
                            selectedList === "legend" && (
                                <LegendStackChart id={id} path={"option"} />
                            )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === "echart-pie-chart" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "donutToggle"
                                            ? ""
                                            : "donutToggle",
                                    )
                                }
                                selected={selectedList === "donutToggle"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "donutToggle"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Donut - Toggle" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "donutToggle" && (
                            <ToogleDonut id={id} path={"option"} />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === "echart-pie-chart" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "title" ? "" : "title",
                                    )
                                }
                                selected={selectedList === "title"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "title"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Chart Title" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "title" && (
                            <PieTitle id={id} path={"option"} />
                        )}
                    </StyledListItem>

                    <StyledListItem disablePadding>
                        {(data.variation === "echart-scatter-plots" ||
                            "echart-stack-chart") && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "scatter-plots-title"
                                            ? ""
                                            : "scatter-plots-title",
                                    )
                                }
                                selected={
                                    selectedList === "scatter-plots-title"
                                }
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList ===
                                            "scatter-plots-title"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Chart Title" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "scatter-plots-title" && (
                            <ScatterPlotChartTitle
                                id={id}
                                path={"option"}
                            ></ScatterPlotChartTitle>
                        )}
                    </StyledListItem>

                    <StyledListItem disablePadding>
                        {data.variation === "echart-pie-chart" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "valueLabel"
                                            ? ""
                                            : "valueLabel",
                                    )
                                }
                                selected={selectedList === "valueLabel"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "valueLabel"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Value Label" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "valueLabel" && (
                            <PieValueLabel id={id} path={"option"} />
                        )}
                    </StyledListItem>
                    {data.variation === "echart-world-map-chart" && (
                        <StyledListItem disablePadding>
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "symbol" ? "" : "symbol",
                                    )
                                }
                                selected={selectedList === "symbol"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "symbol"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    ></ImageIcon>
                                </ListItemIcon>

                                <ListItemText primary="Map Marker Size" />
                                <InfoOutlined />
                            </ListItemButton>
                            {selectedList === "symbol" && (
                                <MapMarkerSize
                                    id={id}
                                    path={"option"}
                                ></MapMarkerSize>
                            )}
                        </StyledListItem>
                    )}
                    <StyledListItem disablePadding>
                        {data.variation === "echart-line-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "lineTitle"
                                            ? ""
                                            : "lineTitle",
                                    )
                                }
                                selected={selectedList === "lineTitle"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "lineTitle"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Chart Title" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "lineTitle" && (
                            <LineTitle id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === "echart-line-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "lineLegend"
                                            ? ""
                                            : "lineLegend",
                                    )
                                }
                                selected={selectedList === "lineLegend"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "lineLegend"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Line Legend" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "lineLegend" && (
                            <LineLegend id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === "echart-line-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "lineTooltip"
                                            ? ""
                                            : "lineTooltip",
                                    )
                                }
                                selected={selectedList === "lineTooltip"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "lineTooltip"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Line Tooltip" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "lineTooltip" && (
                            <LineTooltip id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === "echart-line-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "lineValueLabel"
                                            ? ""
                                            : "lineValueLabel",
                                    )
                                }
                                selected={selectedList === "lineValueLabel"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "lineValueLabel"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Value Labels" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "lineValueLabel" && (
                            <LineValueLabels
                                id={id}
                                option={data.option}
                                chartType={BAR_CHART_DATA.JSONVALUE[0]}
                                path="option"
                            />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === "echart-line-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "lineXAixsStyling"
                                            ? ""
                                            : "lineXAixsStyling",
                                    )
                                }
                                selected={selectedList === "lineXAixsStyling"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "lineXAixsStyling"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="X Axis Styling" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "lineXAixsStyling" && (
                            <XAxisStyling id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === "echart-line-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "lineYAixsStyling"
                                            ? ""
                                            : "lineYAixsStyling",
                                    )
                                }
                                selected={selectedList === "lineYAixsStyling"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "lineYAixsStyling"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Y Axis Styling" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "lineYAixsStyling" && (
                            <YAxisStyling id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === "echart-line-graph" && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "lineStyling"
                                            ? ""
                                            : "lineStyling",
                                    )
                                }
                                selected={selectedList === "lineStyling"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "lineStyling"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Line Styling" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === "lineStyling" && (
                            <LineStyling id={id} path="option" />
                        )}
                    </StyledListItem>
                    {data.variation === "echart-gantt-chart" && (
                            <StyledListItem disablePadding>
                                <ListItemButton
                                    onClick={(e) =>
                                        setSelectedList((prevList) =>
                                            prevList === "fiscalaxis"
                                                ? ""
                                                : "fiscalaxis",
                                        )
                                    }
                                    selected={selectedList === "fiscalaxis"}
                                >
                                    <ListItemIcon>
                                        <ImageIcon
                                            fontSize="large"
                                            color={
                                                selectedList === "fiscalaxis"
                                                    ? "primary"
                                                    : "disabled"
                                            }
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Fiscal Axis"
                                        style={{ flex: "0.5 1 auto" }}
                                    />
                                    <InfoOutlined />
                                </ListItemButton>
                        </StyledListItem>  
                    )}
                    {selectedList === "fiscalaxis" && (
                        <GanttFiscal id={id} path={"option"} />
                    )}
                    {data.variation === "echart-gantt-chart" && (
                        <StyledListItem disablePadding>
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "targetdate"
                                            ? ""
                                            : "targetdate",
                                    )
                                }
                                selected={selectedList === "targetdate"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "targetdate"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Target Date"
                                    style={{ flex: "0.5 1 auto" }}
                                />
                                <InfoOutlined />
                            </ListItemButton>
                        </StyledListItem>
                    )}
                    {selectedList === "targetdate" && (
                        <GanttTargetLine id={id} path={"option"} />
                    )}
                    {
                    data.variation === "echart-gantt-chart" && (
                        <StyledListItem disablePadding>
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === "customizesymbol"
                                            ? ""
                                            : "customizesymbol",
                                    )
                                }
                                selected={selectedList === "customizesymbol"}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === "customizesymbol"
                                                ? "primary"
                                                : "disabled"
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Customize Symbol"
                                    style={{ flex: "0.5 1 auto" }}
                                />
                                <InfoOutlined />
                            </ListItemButton>
                        </StyledListItem>
                    )
                    }
                    {selectedList === "customizesymbol" && (
                        <CustomizeSymbol id={id} path={"option"} />
                    )}
                    {
                        data.variation === "echart-gantt-chart" && (
                            <StyledListItem disablePadding>
                                <ListItemButton
                                    onClick={(e) =>
                                        setSelectedList((prevList) =>
                                            prevList === "togglelegendgantt"
                                                ? ""
                                                : "togglelegendgantt",
                                        )
                                    }
                                    selected={selectedList === "togglelegendgantt"}
                                >
                                    <ListItemIcon>
                                        <ImageIcon
                                            fontSize="large"
                                            color={
                                                selectedList === "togglelegendgantt"
                                                    ? "primary"
                                                    : "disabled"
                                            }
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Legend"
                                        style={{ flex: "0.5 1 auto" }}
                                    />
                                    <InfoOutlined />
                                </ListItemButton>
                            </StyledListItem>
                        )
                    }
                    {selectedList === "togglelegendgantt" && (
                        <GanttLegend id={id} path={"option"} />
                    )}
                    {
                        data.variation === 'echart-gantt-chart' && (
                            <StyledListItem disablePadding>
                                <ListItemButton
                                    onClick={(e) =>
                                        setSelectedList((prevList) =>
                                            prevList === "togglegroupview"
                                                ? ""
                                                : "togglegroupview",
                                        )
                                    }
                                    selected={selectedList === "togglegroupview"}
                                >
                                    <ListItemIcon>
                                        <ImageIcon
                                            fontSize="large"
                                            color={
                                                selectedList === "togglegroupview"
                                                    ? "primary"
                                                    : "disabled"
                                            }
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Group View"
                                        style={{ flex: "0.5 1 auto" }}
                                    />
                                    <InfoOutlined />
                                </ListItemButton>
                            </StyledListItem>
                        )
                    }
                    {selectedList === "togglegroupview" && (
                        <>
                            <GanttGroupView id={id} path={"option"} />
                        </>
                    )}
                    {
                        data.variation === 'echart-gantt-chart' && (
                            <StyledListItem disablePadding>
                                <ListItemButton
                                    onClick={(e) =>
                                        setSelectedList((prevList) =>
                                            prevList === "displayvaluelabels"
                                                ? ""
                                                : "displayvaluelabels",
                                        )
                                    }
                                    selected={selectedList === "displayvaluelabels"}
                                >
                                    <ListItemIcon>
                                        <ImageIcon
                                            fontSize="large"
                                            color={
                                                selectedList === "displayvaluelabels"
                                                    ? "primary"
                                                    : "disabled"
                                            }
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Display Value Labels"
                                        style={{ flex: "0.5 1 auto" }}
                                    />
                                    <InfoOutlined />
                                </ListItemButton>
                            </StyledListItem>
                        )
                    }
                    {selectedList === "displayvaluelabels" && (
                        <>
                            <GanttDisplayValueLabels id={id} path="option" />
                        </>
                    )}
                    {
                        data.variation === 'echart-dendrogram-chart' && (
                            <DendrogramToolsList id={id} />
                        )
                    }
                </List>
            </>
        );
    });
