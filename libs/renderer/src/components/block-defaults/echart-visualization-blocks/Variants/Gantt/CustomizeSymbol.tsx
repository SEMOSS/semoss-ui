import { observer } from "mobx-react-lite";
import { useBlockSettings, useBlock } from "../../../../../hooks";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import styled from "@emotion/styled";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
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
import { computed } from "mobx";
import { getValueByPath } from "@/utility";
import { DeleteForever } from "@mui/icons-material";
import { BaseSettingSection } from "../../../../block-settings";

interface CustomizeSymbolProps {
    id: string;
}
const StyledSubContainer = styled("div")(({}) => ({
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
}));
const StyledAppliedContainer = styled("div")(() => ({
    border: "1px solid grey",
    borderRadius: 9,
    padding: "10px",
}));
const StyledSpan = styled("span")<{ backgroundColor: string }>((props) => ({
    backgroundColor: props.backgroundColor ?? "",
    padding: "3px",
    borderRadius: "50px",
    width: "15px",
    height: "15px",
    display: "flex",
}));
const INITIAL_CUSTOM_STYLE = {
    dimension: "",
    symbol: "",
    symbolSize: 5,
    symbolColorSelected: false,
    symbolColor: "",
    dimensionInstance: [],
};
export const CustomizeSymbol = observer(({ id }: CustomizeSymbolProps) => {
    const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
    const [customizeSymbolData, setCustomizeSymbolData] =
        useState(INITIAL_CUSTOM_STYLE);
    const [appliedSymbolData, setAppliedSymbolData] = useState([]);
    const [dimensionList, setDimensionList] = useState([]);
    const [dimensionSelected, setDimensionSelected] = useState("");
    const [dimensionInstance, setDimensionInstance] = useState({
        startdate: [],
        enddate: [],
        milestone: [],
    });
    const [editingInstanceIndex, setEditingInstanceIndex] = useState(-1);
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
    useEffect(() => {
        let option = JSON.parse(computedValue);
        let columnDetails = option["customSettings"]?.["columnDetails"];
        console.log(columnDetails, "columnDetails");
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
                ? { ...columnDetails["milestone"], ["currentKey"]: "milestone" }
                : {};
            let finalData = [];
            if (Object.keys(startDate).length) {
                finalData.push(startDate);
            }
            if (Object.keys(endDate).length) {
                finalData.push(endDate);
            }
            if (Object.keys(milestone).length) {
                finalData.push(milestone);
            }
            console.log(finalData, "finalData");
            setDimensionList((prevDimensionList) => {
                return [...finalData];
            });
        }
        let existingOption = option["customSettings"]["gantttools"];
        let existingOptionList = customizeSymbolData;
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
            existingOptionList["symbolColor"] = existingOption["symbolColor"];
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
        let seriesIndex = option["series"].findIndex((item) =>
            item.hasOwnProperty("chartrendered"),
        );
        let mileStoneIndex = option["series"].findIndex((item) =>
            item.hasOwnProperty("milestonerendered"),
        );
        console.log(seriesIndex, "seriesIndex");
        let startDateData = [];
        let endDateData = [];
        let mileStone = [];
        if (seriesIndex >= 0) {
            startDateData =
                option["series"][seriesIndex]?.["data"]?.map((item, index) => {
                    return item.value[0];
                }) || [];
            endDateData =
                option["series"][seriesIndex]?.["data"]?.map((item, index) => {
                    return item.value[2];
                }) || [];
            mileStone =
                option["series"][mileStoneIndex]?.["data"]?.map(
                    (item, index) => {
                        return item.value[0];
                    },
                ) || [];
            console.log(
                "startDate",
                startDateData,
                "endDate",
                endDateData,
                mileStone,
                "milestone",
            );
            setDimensionInstance((prevDimensionInstance) => {
                return {
                    ["startdate"]: startDateData,
                    ["enddate"]: endDateData,
                    ["milestone"]: mileStone,
                };
            });
        }
        let customizeSettings =
            option["customSettings"]["gantttools"]?.["customizeSymbol"] || [];
        setAppliedSymbolData((prevAppliedSymbol) => customizeSettings);
    }, []);
    function updateFields(e, field, directValue = undefined) {
        setCustomizeSymbolData((prevSymbolData) => {
            return {
                ...prevSymbolData,
                [field]: directValue ?? e.target.value,
            };
        });
        if (field === "dimension") {
            let value = e.target.value;
            let dimensionSelected = dimensionList.find(
                (item) => item.selector === value,
            );
            if (dimensionSelected.hasOwnProperty("currentKey")) {
                setDimensionSelected((prevDimensionSelected) => {
                    return dimensionSelected["currentKey"];
                });
            }
        }
    }
    const dimensionListUpdated =
        dimensionList.map((item, index) => ({
            label: item.name,
            value: item.selector,
        })) || [];
    const showSymbolColor = customizeSymbolData.symbolColorSelected
        ? true
        : false;
    const dimensionInstanceToRender =
        dimensionInstance[dimensionSelected]?.map((item, index) => {
            return (
                new Date(item).getFullYear() +
                "-" +
                (new Date(item).getMonth() + 1 < 10
                    ? "0" + (new Date(item).getMonth() + 1)
                    : new Date(item).getMonth() + 1) +
                "-" +
                (new Date(item).getDate() < 10
                    ? "0" + new Date(item).getDate()
                    : new Date(item).getDate())
            );
        }) || [];
    const dimensionNameSelected =
        dimensionList.find(
            (item) => item.selector === customizeSymbolData.dimension,
        )?.name || customizeSymbolData.dimension;
    console.log(
        "dimensionList",
        dimensionList,
        dimensionInstanceToRender,
        dimensionInstance,
        dimensionSelected,
    );
    function updateChartData() {
        let option = JSON.parse(computedValue);
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
                                  ["dimension"]: customizeSymbolData.dimension,
                                  ["symbol"]: customizeSymbolData.symbol,
                                  ["symbolSize"]:
                                      customizeSymbolData.symbolSize,
                                  ["symbolColor"]:
                                      customizeSymbolData.symbolColor,
                                  ["symbolColorSelected"]:
                                      customizeSymbolData.symbolColorSelected,
                                  ["dimensionSelected"]: dimensionSelected,
                                  ["dimensionValues"]:
                                      customizeSymbolData.dimensionInstance,
                              },
                          ]
                        : [
                              {
                                  ["dimension"]: customizeSymbolData.dimension,
                                  ["symbol"]: customizeSymbolData.symbol,
                                  ["symbolSize"]:
                                      customizeSymbolData.symbolSize,
                                  ["symbolColor"]:
                                      customizeSymbolData.symbolColor,
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
            if (
                option["customSettings"]["gantttools"].hasOwnProperty(
                    "customizeSymbol",
                )
            ) {
                if (
                    option["customSettings"]["gantttools"]["customizeSymbol"]?.[
                        editingInstanceIndex
                    ]
                ) {
                    option["customSettings"]["gantttools"]["customizeSymbol"][
                        editingInstanceIndex
                    ] = {
                        ["dimension"]: customizeSymbolData.dimension,
                        ["symbol"]: customizeSymbolData.symbol,
                        ["symbolSize"]: customizeSymbolData.symbolSize,
                        ["symbolColor"]: customizeSymbolData.symbolColor,
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
                setData("option", option);
                let appliedSymbolDataList = appliedSymbolData;
                if (
                    editingInstanceIndex > -1 &&
                    appliedSymbolDataList?.[editingInstanceIndex]
                ) {
                    appliedSymbolDataList[editingInstanceIndex] = {
                        ["dimension"]: customizeSymbolData.dimension,
                        ["symbol"]: customizeSymbolData.symbol,
                        ["symbolSize"]: customizeSymbolData.symbolSize,
                        ["symbolColor"]: customizeSymbolData.symbolColor,
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
                        ["symbolColor"]: customizeSymbolData.symbolColor,
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
    function deleteAppliedData(index) {
        let updatedAppliedData = appliedSymbolData;
        let option = JSON.parse(computedValue);
        updatedAppliedData = updatedAppliedData.filter(
            (item, itemIndex) => itemIndex !== index,
        );
        console.log("updated applied data", updatedAppliedData);
        setAppliedSymbolData((prevSymbolData) => {
            return updatedAppliedData;
        });
        if (option["customSettings"]["gantttools"]?.["customizeSymbol"]) {
            let filteredData =
                option["customSettings"]["gantttools"]["customizeSymbol"];
            console.log(filteredData, "filteredData");
            filteredData = filteredData.filter(
                (filteritem, filterindex) => filterindex !== index,
            );
            console.log(
                filteredData.filter(
                    (filteritem, filterindex) => filterindex !== index,
                ),
                "filterAction",
            );
            option["customSettings"]["gantttools"]["customizeSymbol"] =
                filteredData;
            setTimeout(() => {
                try {
                    setData("option", option);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
    }
    function applyToCurrentCustom(index) {
        if (appliedSymbolData?.[index]) {
            console.log(appliedSymbolData[index], "appliedsymboldata");
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
    function resetToInitialState() {
        setCustomizeSymbolData((prevCustomizeData) => {
            return INITIAL_CUSTOM_STYLE;
        });
    }
    let updatedInstances = appliedSymbolData.map((item, index) => {
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
        <>
            <StyledSubContainer>
                <label htmlFor="applied-custom-style">
                    Applied (Add Multiple Symbol)
                </label>
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
                    {updatedInstances.length == 0 && (
                        <span>No Symbols Applied.</span>
                    )}
                </StyledAppliedContainer>
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
                                // setData('frame.name', value);
                                updateFields({}, "dimensionInstance", value);
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
                        updateFields(e, "symbolColorSelected", e.target.checked)
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
        </>
    );
});
