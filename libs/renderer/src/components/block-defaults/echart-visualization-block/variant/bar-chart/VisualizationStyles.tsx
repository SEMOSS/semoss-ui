import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";

import { Slider, styled, TextField, ToggleTabsGroup } from "@semoss/ui";

import { Block, BlockDef } from "../../../../../store";
import { useBlockSettings } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import { Paths, PathValue } from "../../../../../types";
import { EchartVisualizationBlockConfig } from "../../..";
import { BAR_CHART_DATA } from "../../Visualization.constants";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { ColorPickerSettings } from "../../../../block-settings/shared/ColorPickerSettings";

//Styled container for bar chart
const StyledBarStylesContainer = styled("div")<{
    width?: string;
    display?: string;
    justifyContent?: string;
}>(({ width, display, justifyContent }) => ({
    width: width ?? undefined,
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    padding: "0.95rem",
}));
//styled text field for customizing text field size
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));

//bar chart styling component structure
interface BarChartStyle {
    barwidth: number;
    minBarWidth: number;
    maxBarWidth: number;
    barColour: string;
}
//custom bar chart style
const CUSTOM_BAR_CHART_STYLES = {
    barwidth: 10,
    minBarWidth: 1,
    maxBarWidth: 45,
    barColour: "#5470c6",
};
//initial bar chart style
const INITIAL_BAR_CHART_STYLES = [];

//Updating bar chart specific styles like bar width and its colour
export const VisualizationStyles = observer(
    <D extends BlockDef = BlockDef>({
        updateChart,
        chartType,
        option,
        id,
        path,
    }) => {
        //style data for bar chart with initial styles
        const [styleData, setStyleData] = useState<BarChartStyle[]>(
            INITIAL_BAR_CHART_STYLES,
        );
        //chart data
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [value, setValue] = useState<
            typeof EchartVisualizationBlockConfig.data.option
        >(data.option);
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        const [stylesUpdated, setStylesUpdated] = useState<
            "initial" | "updated"
        >("initial");
        const [selectedSeries, setSelectedSeries] = useState<string>("0");
        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, path);
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();
        //update the value when the computed value is changed
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        //parsed variable of chart data
        const parsedJson = useMemo(() => {
            return typeof value === "string" ? JSON.parse(value) : value;
        }, [value]);

        //for retaining the previously selected values, this will help
        useEffect(() => {
            const barChartData = option["series"].filter((item) =>
                BAR_CHART_DATA.JSONVALUE.includes(item.type),
            );
            if (barChartData.length) {
                let barStyleData = [];
                barChartData.forEach((item, index) => {
                    barStyleData = [
                        ...barStyleData,
                        {
                            barwidth: item?.["barWidth"] ?? 10,
                            barColour:
                                item["itemStyle"]?.["color"] ?? "#5470c6",
                            minBarWidth: 1,
                            maxBarWidth: 45,
                        },
                    ];
                });
                setStyleData(barStyleData);
            }
        }, []);
        //whenever input values changed, the stules updated will get new value 'updated', so retaining the state from main state object will not call updatechartdata
        useEffect(() => {
            if (stylesUpdated === "updated") {
                updateChartData(styleData, selectedSeries);
            }
        }, [styleData]);
        //this function will return filtered series index with type 'bar'
        function getFilteredSeriesIndex(): number[] {
            const index: number[] = [];
            const seriesAvailable = data.option["series"].filter((item) =>
                BAR_CHART_DATA.JSONVALUE.includes(item.type),
            );
            seriesAvailable.forEach((item, seriesIndex) => {
                index.push(seriesIndex);
            });
            return index;
        }

        //handles bar width changes and updates the value to state
        function handleInputChange(event, newValue, seriesIndex = "0") {
            if (stylesUpdated === "initial") setStylesUpdated("updated");

            const currentStyle = styleData;
            currentStyle[seriesIndex] = {
                ...currentStyle[seriesIndex],
                ["barwidth"]: newValue,
            };
            setStyleData((prevStyleData) => {
                return [...currentStyle];
            });
        }
        //handles bar colour changes and updates the value to state
        function handleBarColourChange(e, seriesIndex = "0") {
            if (stylesUpdated === "initial") setStylesUpdated("updated");

            const currentStyle = styleData;
            currentStyle[seriesIndex] = {
                ...currentStyle[seriesIndex],
                ["barColour"]: e.target.value,
            };
            setStyleData((prevStyleData) => {
                return [...currentStyle];
            });
        }
        //update bar chart data
        function updateChartData(barData: BarChartStyle[], selectedSeries) {
            let option = typeof value === "string" ? JSON.parse(value) : value;
            barData.forEach((barDataSegment, barDataIndex) => {
                const barWidth: number = barDataSegment["barwidth"];
                const barColour: string = barDataSegment["barColour"];
                if (option["series"]) {
                    const barChartDataIndex = barDataIndex;
                    if (barChartDataIndex > -1) {
                        if (barWidth !== undefined && barWidth > 0) {
                            option["series"][barChartDataIndex] = {
                                ...option["series"][barChartDataIndex],
                                ["barWidth"]: barWidth,
                            };
                        }
                        if (barColour !== undefined) {
                            if (
                                option["series"][barChartDataIndex]["itemStyle"]
                            ) {
                                option["series"][barChartDataIndex] = {
                                    ...option["series"][barChartDataIndex],
                                    ["itemStyle"]: {
                                        ...option["series"][barChartDataIndex][
                                            "itemStyle"
                                        ],
                                        ["color"]: barColour,
                                    },
                                };
                            } else {
                                option["series"][barChartDataIndex] = {
                                    ...option["series"][barChartDataIndex],
                                    ["itemStyle"]: {
                                        ["color"]: barColour,
                                    },
                                };
                            }
                        }
                    }
                }
            });
            option = {
                ...option,
                ["çustomSettings"]: {
                    ...option["çustomSettings"],
                    ["toolsUpdated"]: true,
                },
            };
            runStateUpdateCustom(option);
        }
        //this function will update chart json to new option value
        function runStateUpdateCustom(
            option: typeof EchartVisualizationBlockConfig.data.option,
        ) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        "option",
                        option as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        const currentSeriesColor =
            styleData[selectedSeries]?.barColour || "#5470c6";
        //bar chart component content is rendered into a single variable
        const accordionDetails = (
            <>
                <ToggleTabsGroup
                    onChange={(e: React.SyntheticEvent, val: string) =>
                        setSelectedSeries(val)
                    }
                    value={selectedSeries}
                >
                    {styleData.length &&
                        styleData.map((item, index) => {
                            return (
                                <ToggleTabsGroup.Item
                                    label={`Series ${index + 1}`}
                                    value={`${index}`}
                                    key={`series${index}`}
                                />
                            );
                        })}
                    ;
                </ToggleTabsGroup>
                {styleData[selectedSeries] && (
                    <StyledBarStylesContainer>
                        <StyledBarStylesContainer>
                            <label>Bar Width</label>
                            <Slider
                                value={styleData[selectedSeries].barwidth}
                                min={styleData[selectedSeries].minBarWidth}
                                max={styleData[selectedSeries].maxBarWidth}
                                valueLabelDisplay="auto"
                                onChange={(event, newValue) =>
                                    handleInputChange(
                                        event,
                                        newValue,
                                        selectedSeries,
                                    )
                                }
                            />
                        </StyledBarStylesContainer>
                        <StyledBarStylesContainer>
                            <ColorPickerSettings
                                id={id}
                                path={`option.series.${selectedSeries}.itemStyle.color`}
                                colorValue={currentSeriesColor}
                                onChange={(e) =>
                                    handleBarColourChange(
                                        { target: { value: e } },
                                        selectedSeries,
                                    )
                                }
                            />
                        </StyledBarStylesContainer>
                    </StyledBarStylesContainer>
                )}
            </>
        );
        return (
            <StyledBarStylesContainer width="100%">
                {accordionDetails}
            </StyledBarStylesContainer>
        );
    },
);
