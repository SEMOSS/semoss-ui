import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import {
    Autocomplete,
    Button,
    Chip,
    IconButton,
    Select,
    Slider,
    Switch,
    TextField,
} from "@semoss/ui";
import styled from "@emotion/styled";
import { getValueByPath } from "@/utility";
import { PathValue } from "@/types";
import { useBlockSettings, useBlock } from "../../../../../hooks";
import { EchartVisualizationBlockDef } from "../../../echart-visualization-blocks/VisualizationBlock";
import { BaseSettingSection } from "../../../../block-settings";
import { GANTT_CHART } from "../../../echart-visualization-blocks/Visualization.constants";
import { BlockDef } from "../../../../../store";
//Sub container with column based field setting
const StyledSubContainer = styled("div")(({}) => ({
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
}));
//Applied custom style container
const StyledAppliedContainer = styled("div")(() => ({
    border: "1px solid grey",
    borderRadius: 9,
    padding: "10px",
}));
//Styled span with custom background color for mentioning color selected for a custom symbol
const StyledSpan = styled("span")<{ backgroundColor: string }>((props) => ({
    backgroundColor: props.backgroundColor ?? "",
    padding: "3px",
    borderRadius: "50px",
    width: "15px",
    height: "15px",
    display: "flex",
}));
//Main container for symbol section with padding
const StyledMainContainer = styled("div")(({}) => ({
    padding: "0.5rem",
    borderBottom: "1px solid #E6E6E6",
}));
//Default custom style
const INITIAL_CUSTOM_STYLE = {
    dimension: "",
    symbol: "",
    symbolSize: 5,
    symbolColorSelected: false,
    symbolColor: "",
    dimensionInstance: [],
};
export const CustomizeSymbol = observer(
    <D extends BlockDef = BlockDef>({ id, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id); //block data to manage settings
        const [customizeSymbolData, setCustomizeSymbolData] =
            useState(INITIAL_CUSTOM_STYLE); //customize symbol component state
        const [appliedSymbolData, setAppliedSymbolData] = useState([]); //applied symbol data state
        const [dimensionList, setDimensionList] = useState([]); //dimension list to select for custom symbol
        const [dimensionSelected, setDimensionSelected] = useState(""); //selected dimention in the dimension list
        const [dimensionInstance, setDimensionInstance] = useState({
            startdate: [],
            enddate: [],
            milestone: [],
        }); // dimension instance data for the available dimensions
        const [editingInstanceIndex, setEditingInstanceIndex] = useState(-1); //if editing this will be set with some index greater than -1
        //List of symbols to select for custom symbol
        const symbolList = [
            { label: "Circle", value: "circle" },
            { label: "Empty Circle", value: "emptycircle" },
            { label: "Rectangle", value: "rectangle" },
            { label: "Round Rectangle", value: "roundrectangle" },
            { label: "Triangle", value: "triangle" },
            { label: "Diamond", value: "diamond" },
            { label: "Pin", value: "pin" },
            { label: "Arrow", value: "arrow" },
        ];
        //Computed value from the block data
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, "option");
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, "option"]).get();
        //useeffect to update initial state if available
        useEffect(() => {
            const option = JSON.parse(computedValue);
            const columnDetails = option["customSettings"]?.["columnDetails"];
            if (columnDetails) {
                let startDate = {},
                    endDate = {},
                    milestone = {};
                startDate = {
                    ...columnDetails["startdate"],
                    ["currentKey"]: "startdate",
                };
                endDate = {
                    ...columnDetails["enddate"],
                    ["currentKey"]: "enddate",
                };
                milestone = columnDetails.hasOwnProperty("milestone")
                    ? {
                          ...columnDetails["milestone"],
                          ["currentKey"]: "milestone",
                      }
                    : {};
                const finalData = [];
                if (Object.keys(startDate).length) {
                    finalData.push(startDate);
                }
                if (Object.keys(endDate).length) {
                    finalData.push(endDate);
                }
                if (Object.keys(milestone).length) {
                    finalData.push(milestone);
                }
                setDimensionList((prevDimensionList) => {
                    return [...finalData];
                });
            }
            const existingOption = option["customSettings"]["gantttools"];
            const existingOptionList = customizeSymbolData;
            if (existingOption?.["dimension"]) {
                existingOptionList["dimension"] = existingOption["dimension"];
            }
            if (existingOption?.["symbol"]) {
                existingOptionList["symbol"] = existingOption["symbol"];
            }
            if (existingOption?.["symbolSize"]) {
                existingOptionList["symbolSize"] = existingOption["symbolSize"];
            }
            if (existingOption?.["symbolColor"]) {
                existingOptionList["symbolColor"] =
                    existingOption["symbolColor"];
            }
            if (existingOption?.["symbolColorSelected"]) {
                existingOptionList["symbolColorSelected"] =
                    existingOption["symbolColorSelected"];
            }
            setCustomizeSymbolData((prevCustomizeSymbolData) => {
                return {
                    ...prevCustomizeSymbolData,
                    ...existingOptionList,
                };
            });
            const seriesIndex = option["series"].findIndex((item) =>
                item.hasOwnProperty("chartrendered"),
            );
            const mileStoneIndex = option["series"].findIndex((item) =>
                item.hasOwnProperty("milestonerendered"),
            );
            let startDateData = [];
            let endDateData = [];
            let mileStone = [];
            if (seriesIndex >= 0) {
                startDateData =
                    option["series"][seriesIndex]?.["data"]?.map(
                        (item, index) => {
                            return item.value[0];
                        },
                    ) || [];
                endDateData =
                    option["series"][seriesIndex]?.["data"]?.map(
                        (item, index) => {
                            return item.value[2];
                        },
                    ) || [];
                mileStone =
                    option["series"][mileStoneIndex]?.["data"]?.map(
                        (item, index) => {
                            return item.mileStoneOriginalDate;
                        },
                    ) || [];
                setDimensionInstance((prevDimensionInstance) => {
                    return {
                        ["startdate"]: startDateData,
                        ["enddate"]: endDateData,
                        ["milestone"]: mileStone,
                    };
                });
            }
            //if applied symbol data is available then set the applied symbol data
            const customizeSettings =
                option["customSettings"]["gantttools"]?.["customizeSymbol"] ||
                [];
            setAppliedSymbolData((prevAppliedSymbol) => customizeSettings);
        }, []);
        function convertTimeZone(date) {
            const currentTimezone =
                Intl.DateTimeFormat().resolvedOptions().timeZone;
            const dateConvertedToTimeZone = new Date(date).toLocaleString(
                "en-US",
                {
                    timeZone: currentTimezone,
                },
            );
            return (
                new Date(dateConvertedToTimeZone).getFullYear() +
                "-" +
                (new Date(dateConvertedToTimeZone).getMonth() + 1 < 10
                    ? "0" + (new Date(dateConvertedToTimeZone).getMonth() + 1)
                    : new Date(dateConvertedToTimeZone).getMonth() + 1) +
                "-" +
                (new Date(dateConvertedToTimeZone).getDate() < 10
                    ? "0" + new Date(dateConvertedToTimeZone).getDate()
                    : new Date(dateConvertedToTimeZone).getDate())
            );
        }
        //update fields function will be called when a field is changed
        function updateFields(e, field, directValue = undefined) {
            setCustomizeSymbolData((prevSymbolData) => {
                return {
                    ...prevSymbolData,
                    [field]: directValue ?? e.target.value,
                };
            });
            //if a dimension field is changed, then dimension selected is also updated
            if (field === "dimension") {
                const value = e.target.value;
                const dimensionSelected = dimensionList.find(
                    (item) => item.selector === value,
                );
                if (dimensionSelected.hasOwnProperty("currentKey")) {
                    setDimensionSelected((prevDimensionSelected) => {
                        return dimensionSelected["currentKey"];
                    });
                }
            }
        }
        //updated dimension list with label and value
        const dimensionListUpdated =
            dimensionList.map((item, index) => ({
                label: item.name,
                value: item.selector,
            })) || [];
        //symbol color switch
        const showSymbolColor = customizeSymbolData.symbolColorSelected
            ? true
            : false;
        //based on the selected dimension, the instance values are updated and rendered in instance selection field
        const dimensionInstanceToRender =
            dimensionInstance[dimensionSelected]?.map((item, index) => {
                return item;
            }) || [];
        //dimension name selected based on the selected dimension as selected dimension will have selector value
        const dimensionNameSelected =
            dimensionList.find(
                (item) => item.selector === customizeSymbolData.dimension,
            )?.name || customizeSymbolData.dimension;
        //update chart data when a field is changed
        function updateChartData() {
            const option = JSON.parse(computedValue);
            //if customize symbol is newly being created
            if (editingInstanceIndex === -1) {
                option["customSettings"] = {
                    ...option["customSettings"],
                    ["gantttools"]: {
                        ...option["customSettings"]["gantttools"],
                        ["customizeSymbol"]: option["customSettings"][
                            "gantttools"
                        ]?.["customizeSymbol"]
                            ? [
                                  ...option["customSettings"]["gantttools"][
                                      "customizeSymbol"
                                  ],
                                  {
                                      ["dimension"]:
                                          customizeSymbolData.dimension,
                                      ["symbol"]: customizeSymbolData.symbol,
                                      ["symbolSize"]:
                                          customizeSymbolData.symbolSize,
                                      ["symbolColor"]:
                                          customizeSymbolData.symbolColor ||
                                          GANTT_CHART.MILESTONE_COLOR,
                                      ["symbolColorSelected"]:
                                          customizeSymbolData.symbolColorSelected,
                                      ["dimensionSelected"]: dimensionSelected,
                                      ["dimensionValues"]:
                                          customizeSymbolData.dimensionInstance,
                                  },
                              ]
                            : [
                                  {
                                      ["dimension"]:
                                          customizeSymbolData.dimension,
                                      ["symbol"]: customizeSymbolData.symbol,
                                      ["symbolSize"]:
                                          customizeSymbolData.symbolSize,
                                      ["symbolColor"]:
                                          customizeSymbolData.symbolColor ||
                                          GANTT_CHART.MILESTONE_COLOR,
                                      ["symbolColorSelected"]:
                                          customizeSymbolData.symbolColorSelected,
                                      ["dimensionSelected"]: dimensionSelected,
                                      ["dimensionValues"]:
                                          customizeSymbolData.dimensionInstance,
                                  },
                              ],
                    },
                };
            } else {
                //if the instance is selected for editing, then respective index in the appliedSymbolData is used to update records
                if (
                    option["customSettings"]["gantttools"].hasOwnProperty(
                        "customizeSymbol",
                    )
                ) {
                    if (
                        option["customSettings"]["gantttools"][
                            "customizeSymbol"
                        ]?.[editingInstanceIndex]
                    ) {
                        option["customSettings"]["gantttools"][
                            "customizeSymbol"
                        ][editingInstanceIndex] = {
                            ["dimension"]: customizeSymbolData.dimension,
                            ["symbol"]: customizeSymbolData.symbol,
                            ["symbolSize"]: customizeSymbolData.symbolSize,
                            ["symbolColor"]:
                                customizeSymbolData.symbolColor ||
                                GANTT_CHART.MILESTONE_COLOR,
                            ["symbolColorSelected"]:
                                customizeSymbolData.symbolColorSelected,
                            ["dimensionSelected"]: dimensionSelected,
                            ["dimensionValues"]:
                                customizeSymbolData.dimensionInstance,
                        };
                    }
                }
            }
            setTimeout(() => {
                try {
                    setData(
                        "option",
                        option as PathValue<D["data"], typeof path>,
                    );
                    //updating the applied symbol data only when the state is updated
                    const appliedSymbolDataList = appliedSymbolData;
                    if (
                        editingInstanceIndex > -1 &&
                        appliedSymbolDataList?.[editingInstanceIndex]
                    ) {
                        appliedSymbolDataList[editingInstanceIndex] = {
                            ["dimension"]: customizeSymbolData.dimension,
                            ["symbol"]: customizeSymbolData.symbol,
                            ["symbolSize"]: customizeSymbolData.symbolSize,
                            ["symbolColor"]:
                                customizeSymbolData.symbolColor ||
                                GANTT_CHART.MILESTONE_COLOR,
                            ["symbolColorSelected"]:
                                customizeSymbolData.symbolColorSelected,
                            ["dimensionSelected"]: dimensionSelected,
                            ["dimensionValues"]:
                                customizeSymbolData.dimensionInstance,
                        };
                    } else {
                        appliedSymbolDataList.push({
                            ["dimension"]: customizeSymbolData.dimension,
                            ["symbol"]: customizeSymbolData.symbol,
                            ["symbolSize"]: customizeSymbolData.symbolSize,
                            ["symbolColor"]:
                                customizeSymbolData.symbolColor ||
                                GANTT_CHART.MILESTONE_COLOR,
                            ["symbolColorSelected"]:
                                customizeSymbolData.symbolColorSelected,
                            ["dimensionSelected"]: dimensionSelected,
                            ["dimensionValues"]:
                                customizeSymbolData.dimensionInstance,
                        });
                    }
                    setAppliedSymbolData((prevAppliedSymbol) => {
                        return appliedSymbolDataList;
                    });
                    setCustomizeSymbolData((prevCustomizeData) => {
                        return INITIAL_CUSTOM_STYLE;
                    });
                } catch (e) {}
            }, 300);
        }
        //removing the applied data
        function deleteAppliedData(index) {
            let updatedAppliedData = appliedSymbolData;
            const option = JSON.parse(computedValue);
            updatedAppliedData = updatedAppliedData.filter(
                (item, itemIndex) => itemIndex !== index,
            );
            setAppliedSymbolData((prevSymbolData) => {
                return updatedAppliedData;
            });
            if (option["customSettings"]["gantttools"]?.["customizeSymbol"]) {
                let filteredData =
                    option["customSettings"]["gantttools"]["customizeSymbol"];
                filteredData = filteredData.filter(
                    (filteritem, filterindex) => filterindex !== index,
                );

                option["customSettings"]["gantttools"]["customizeSymbol"] =
                    filteredData;
                setTimeout(() => {
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
        }
        //when the existing instance under applied symbol is clicked, then respective data is loaded into cusomizeSymbolData for editing
        function applyToCurrentCustom(index) {
            if (appliedSymbolData?.[index]) {
                setCustomizeSymbolData((prevCustSymbol) => {
                    return {
                        ...appliedSymbolData[index],
                        ["dimensionInstance"]:
                            appliedSymbolData[index].dimensionValues,
                    };
                });
                setEditingInstanceIndex((prevEditingInstanceIndex) => {
                    return index;
                });
            }
        }
        //reset to Initial state will reset customize symbol component to initial state
        function resetToInitialState() {
            setCustomizeSymbolData((prevCustomizeData) => {
                return {
                    dimension: "",
                    symbol: "",
                    symbolSize: 5,
                    symbolColorSelected: false,
                    symbolColor: "",
                    dimensionInstance: [],
                };
            });
            setEditingInstanceIndex((prevEditingInstanceIndex) => {
                return -1;
            });
            setAppliedSymbolData((prevAppliedSymbol) => {
                return [];
            });
            const option = JSON.parse(computedValue);
            if (option["customSettings"]["gantttools"]?.["customizeSymbol"]) {
                option["customSettings"]["gantttools"]["customizeSymbol"] = [];
                setTimeout(() => {
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
        }
        //updated instances data
        const updatedInstances = appliedSymbolData.map((item, index) => {
            return {
                label:
                    "Instances of " +
                        dimensionList.find(
                            (dimItem) => dimItem.selector === item.dimension,
                        )?.["name"] || item,
                itemData: index,
                itemColor: item.symbolColor,
            };
        });
        return (
            <StyledMainContainer>
                <StyledSubContainer>
                    <label htmlFor="applied-custom-style">
                        Applied (Add Multiple Symbol)
                    </label>
                    {updatedInstances.length > 0 && (
                        <StyledAppliedContainer>
                            {updatedInstances.length > 0 &&
                                updatedInstances.map((item, index) => (
                                    <Chip
                                        size="small"
                                        label={item.label}
                                        onClick={() =>
                                            applyToCurrentCustom(item.itemData)
                                        }
                                        onDelete={() =>
                                            deleteAppliedData(item.itemData)
                                        }
                                        icon={
                                            <StyledSpan
                                                backgroundColor={item.itemColor}
                                            ></StyledSpan>
                                        }
                                    />
                                ))}
                        </StyledAppliedContainer>
                    )}
                    {updatedInstances.length == 0 && (
                        <TextField
                            placeholder="No Symbol Applied"
                            disabled={true}
                        />
                    )}
                </StyledSubContainer>
                {dimensionListUpdated.length > 0 && (
                    <StyledSubContainer>
                        <label htmlFor="dimension">Select Dimension</label>
                        <Select
                            id="dimension-field"
                            label="Select Dimension Field"
                            SelectProps={{
                                multiple: false,
                            }}
                            value={customizeSymbolData.dimension}
                            onChange={(e) => {
                                updateFields(e, "dimension");
                            }}
                        >
                            <Select.Item value="-1">All Nodes</Select.Item>
                            {dimensionListUpdated.length &&
                                dimensionListUpdated.map((item, index) => (
                                    <Select.Item value={item.value} key={index}>
                                        {item.label}
                                    </Select.Item>
                                ))}
                        </Select>
                    </StyledSubContainer>
                )}
                {customizeSymbolData.dimension && (
                    <StyledSubContainer>
                        {/* <label htmlFor='dimensionInstance'>Instance for {dimensionNameSelected}</label> */}
                        {/* <Select
                            id="dimension-field"
                            label="Select Dimension Field"
                            SelectProps={{
                                multiple: true,
                            }}
                            value={customizeSymbolData.dimensionInstance}
                            onChange={(e)=>{
                                updateFields(e,'dimensionInstance');
                            }}
                        >
                            <Select.Item value='-1'>Select All</Select.Item>
                            {
                                dimensionInstanceToRender.length &&
                                dimensionInstanceToRender.map((item, index)=>(<Select.Item value={item.value}>{item.label}</Select.Item>))
                            }
                        </Select> */}
                        <BaseSettingSection
                            label={`Instance for ${dimensionNameSelected}`}
                        >
                            <Autocomplete
                                fullWidth
                                multiple
                                value={customizeSymbolData.dimensionInstance}
                                options={dimensionInstanceToRender}
                                getOptionLabel={(option) => {
                                    return option;
                                }}
                                onChange={(_, value) => {
                                    // update the frame
                                    updateFields(
                                        {},
                                        "dimensionInstance",
                                        value,
                                    );
                                }}
                                freeSolo={false}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select Instance"
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            />
                        </BaseSettingSection>
                    </StyledSubContainer>
                )}
                <StyledSubContainer>
                    <label htmlFor="symbol">Select a Symbol</label>
                    <Select
                        id="symbol-field"
                        label="Select Symbol Field"
                        SelectProps={{
                            multiple: false,
                        }}
                        value={customizeSymbolData.symbol}
                        onChange={(e) => {
                            updateFields(e, "symbol");
                        }}
                    >
                        {symbolList.length &&
                            symbolList.map((item, index) => (
                                <Select.Item value={item.value} key={index}>
                                    {item.label}
                                </Select.Item>
                            ))}
                    </Select>
                </StyledSubContainer>
                <StyledSubContainer>
                    <label>Select Symbol Size:</label>
                    <Slider
                        value={customizeSymbolData.symbolSize}
                        min={1}
                        max={360}
                        valueLabelDisplay="auto"
                        onChange={(event, newValue) =>
                            updateFields(event, "symbolSize", newValue)
                        }
                    />
                </StyledSubContainer>
                <StyledSubContainer>
                    <label>Select Symbol Color</label>
                    <Switch
                        checked={customizeSymbolData.symbolColorSelected}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields(
                                e,
                                "symbolColorSelected",
                                e.target.checked,
                            )
                        }
                    />
                </StyledSubContainer>
                {showSymbolColor && (
                    <StyledSubContainer>
                        <label>Symbol Color</label>
                        <TextField
                            type="color"
                            value={customizeSymbolData.symbolColor}
                            onChange={(e) => updateFields(e, "symbolColor")}
                        />
                    </StyledSubContainer>
                )}
                <StyledSubContainer
                    style={{
                        width: "100%",
                        display: "block",
                        textAlign: "end",
                    }}
                >
                    <Button
                        color="secondary"
                        size="small"
                        onClick={resetToInitialState}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={(e) => updateChartData()}
                    >
                        Execute
                    </Button>
                </StyledSubContainer>
            </StyledMainContainer>
        );
    },
);
