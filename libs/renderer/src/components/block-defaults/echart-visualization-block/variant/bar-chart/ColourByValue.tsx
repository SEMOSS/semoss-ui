import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Delete, Edit } from "@mui/icons-material";
import { PathValue } from "react-hook-form";
import { computed } from "mobx";

import { Button, Select, Stack, styled, Table, TextField } from "@semoss/ui";

import { BlockDef } from "../../../../../store";
import { useBlockSettings } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { BAR_CHART_DATA } from "../../Visualization.constants";
import { ECHART_BAR_COLOUR } from "../../Visualization.constants";

// styled main section with custom styling
const StyledMainSection = styled("div")(() => ({
    display: "inline-flex",
    width: "100%",
    gap: "8px",
}));
//select field with custom styling design to show two select fields in a row
const StyledSelect = styled(Select)(() => ({
    width: "48%",
}));
//custom text field with reduced width
const StyledTextField = styled(TextField)<{
    width?: string;
}>(({ width }) => ({
    width: width ?? "48%",
}));
//styled span section
const StyledSpan = styled("span")(() => ({
    display: "flex",
    justifyContent: "space-around",
}));

//Color by value props
export interface ColourByValueProps {
    id: string;
    updateChart: (option: any) => void;
}
//initial new rules for managing the state and for restoring
const INITIAL_NEW_RULES = {
    column: "",
    columnColour: "#000000",
    columnToColour: "",
    columnComparision: "",
    valuesToColour: [],
    filterValue: 0,
    filterMinValue: 0,
    filterMaxValue: 0,
    index: -1,
};

const ColourByValue = observer(
    <D extends BlockDef = BlockDef>({ id, updateChart, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        // console.log("ColourByValue data ", data);
        const [newRules, setNewRules] = useState(INITIAL_NEW_RULES);

        const [valuesToColour, setValuesToColour] = useState([]);
        // const [value, setValue] = useState({});
        const [appliedRules, setAppliedRules] = useState([]);
        const [valuesColourMapping, setValuesColourMapping] = useState({});
        //custom reference variable to handle color value applying
        const functionCallReference = useRef({
            valuesResetCheck: false,
            assignedRules: [],
            applyRulesToChart: false,
        });
        const columnData = data.columns
            ? data.columns.filter((item) => item.label === "yAxis")
            : [];
        console.log("columnData ", columnData);
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
                return v; //JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();
        //initial setting of state data based on the json value
        useEffect(() => {
            functionCallReference.current.applyRulesToChart = false;
            const v = getValueByPath(data, path);
            const option = typeof v === "string" ? JSON.parse(v) : v;
            if (
                option.hasOwnProperty("customSettings") &&
                option["customSettings"].hasOwnProperty("appliedRules")
            ) {
                const appliedRules = option["customSettings"]["appliedRules"];
                setAppliedRules(appliedRules);
            }
        }, []);
        //whenever a computed value is changed, then respective change for colour by value component is
        // useEffect(() => {
        //     setValue(computedValue);
        // }, [computedValue]);
        useEffect(() => {
            if (functionCallReference.current.applyRulesToChart) {
                const option =
                    typeof computedValue === "string"
                        ? JSON.parse(computedValue)
                        : computedValue;
                //let colourObj = {};
                appliedRules.forEach((appliedItem, index) => {
                    // const xAxisPosition = getXAxisPositions(appliedItem);
                    //take all the series indexes to update the data
                    // option["series"] = [
                    //     ...option["series"].map((item) => {
                    //         if (typeof item.color === "function") {
                    //             return item;
                    //         }
                    //         return {
                    //             ...item,
                    //             ["itemStyle"]: {
                    //                 ...item["itemStyle"],
                    //                 ["color"]: (seriesData) =>
                    //                     updateColorData(seriesData, {
                    //                         ...appliedItem,
                    //                     }),
                    //             },
                    //         };
                    //     }),
                    // ];
                    const filteredSeriesIndex = []; //getFilteredSeriesIndex();
                    // if (xAxisPosition.length) {
                    filteredSeriesIndex.forEach((item, index) => {
                        const seriesIndexData = item;
                        if (seriesIndexData > -1) {
                            // const data =
                            //     option["series"][seriesIndexData]["data"];
                            // data.forEach((item, dataindex) => {
                            //     colourObj = {
                            //         ...colourObj,
                            //         [dataindex]: xAxisPosition.includes(
                            //             dataindex,
                            //         )
                            //             ? appliedItem.columnColour
                            //             : colourObj.hasOwnProperty(
                            //                   dataindex,
                            //               )
                            //             ? colourObj[dataindex]
                            //             : ECHART_BAR_COLOUR,
                            //     };
                            // });
                            // option["series"][seriesIndexData] = {
                            //     ...option["series"][seriesIndexData],
                            //     ["itemStyle"]: {
                            //         ...option["series"][seriesIndexData][
                            //             "itemStyle"
                            //         ],
                            // ["color"]: (seriesData) =>
                            //     updateColorData(seriesData, {
                            //         ...appliedItem,
                            //     }),
                            //     },
                            // }; //working one
                        }
                    });
                    // }
                });
                // if (!appliedRules.length) {
                //     const filteredSeriesIndex = getFilteredSeriesIndex();
                //     filteredSeriesIndex.forEach((index) => {
                //         option["series"][index] = {
                //             ...option["series"][index],
                //             ["itemStyle"]: {
                //                 ...option["series"][index]["itemStyle"],
                //                 ["color"]: (seriesData) =>
                //                     updateColorData(seriesData),
                //             },
                //         }; //working one
                //     });
                // }
                // option["series"] = [
                //     ...option["series"].map((item) => {
                //         if (typeof item.color === "function") {
                //             return item;
                //         }
                //         return {
                //             ...item,
                //             ["itemStyle"]: {
                //                 ...item["itemStyle"],
                //                 ["color"]: (seriesData) =>
                //                     updateColorData(
                //                         seriesData,
                //                         option.customSettings
                //                             .appliedColourByValue,
                //                     ),
                //             },
                //         };
                //     }),
                // ];
                console.log("colorby appliedRules ", appliedRules);
                const optionUpdated = {
                    ...option,
                    customSettings: {
                        ...option.customSettings,
                        appliedRules: [...appliedRules],
                        toolsUpdated: true,
                        // appliedColors: {
                        //     ...option.customSettings.colourObj,
                        //     ...colourObj,
                        // },
                    },
                };
                runStateUpdateCustom(optionUpdated);
                functionCallReference.current.applyRulesToChart = false;
            }
        }, [appliedRules]);

        //function to check and retrieve the indexes for bar chart type
        function getFilteredSeriesIndex() {
            const index = [];
            const seriesAvailable: any[] = data.option["series"].filter(
                (item) => BAR_CHART_DATA.JSONVALUE.includes(item.type),
            );
            seriesAvailable.forEach((item, seriesIndex) => {
                index.push(seriesIndex);
            });
            return index;
        }

        function runStateUpdateCustom(
            updatedOption: PathValue<any, typeof path>,
        ) {
            setTimeout(() => {
                console.log("runStateUpdateCustom ---->", updatedOption);
                try {
                    setData(
                        "option",
                        updatedOption as PathValue<any, typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        //data array conversion function
        function convertSeriesDataToValue(item) {
            if (typeof item === "object" && item.hasOwnProperty("value")) {
                return item.value;
            }
            if (typeof item === "number") return item;
            if (isNaN(item)) return 0;
        }

        //when fields are updated, new rules are updated
        function updateFields(column, event) {
            setNewRules((prevRules) => {
                return {
                    ...prevRules,
                    [column]:
                        event.target.value?.selector || event.target.value,
                };
            });
            console.log(
                "updatefields computedValue ",
                computedValue,
                data.option,
            );
            //if column updated is columnToColour then values to be selected if fetched from series and added to valuestocolor state
            if (column === "columnToColour") {
                const option = data.option;
                const name = Array.isArray(event.target.value.name)
                    ? event.target.value.name[0]
                    : event.target.value.name;
                const pixelId = event.target.value.selector;
                let valuesToColour = [];
                if (option["xAxis"]["pixelvalue"].includes(pixelId)) {
                    valuesToColour = option["xAxis"]["data"].map((item) => {
                        return item.hasOwnProperty("value") ? item.value : item;
                    });
                } else if (option["yAxis"]["pixelvalue"].includes(pixelId)) {
                    valuesToColour = option["series"]
                        .find((item) => item.name === name)
                        ["data"].map((item) => {
                            return item.hasOwnProperty("value")
                                ? item.value
                                : item;
                        });
                }
                const dataArray = valuesToColour.map(convertSeriesDataToValue);
                console.log("dataArray valueTo colour ", dataArray);
                setValuesToColour(valuesToColour);
                setNewRules((prevValues) => {
                    return {
                        ...prevValues,
                        ["column"]: name,
                        ["columnName"]: name,
                        ["columnNameToColour"]: name,
                        ["filterMinValue"]: Math.min(...dataArray),
                        ["filterMaxValue"]: Math.max(...dataArray),
                    };
                });
            }
        }
        //get the xaxis positons to be updated with the colour selected
        function getXAxisPositions(sourceObject: any = {}) {
            const option =
                typeof computedValue === "string"
                    ? JSON.parse(computedValue)
                    : computedValue;
            let positions = [];
            if (Object.keys(sourceObject).length === 0) {
                sourceObject = newRules;
            }
            if (sourceObject.columnComparision === "==") {
                sourceObject.valuesToColour.forEach((item) => {
                    const xAxisPosition = [];
                    option["xAxis"]["data"].forEach((itemAvailable, index) => {
                        if (
                            item === itemAvailable ||
                            (itemAvailable.hasOwnProperty("value") &&
                                itemAvailable.value === item)
                        ) {
                            xAxisPosition.push(index);
                        }
                    });
                    positions = [...xAxisPosition, ...positions];
                });
            }
            if (sourceObject.columnComparision === "!=") {
                const dataVerify = option["xAxis"]["data"];
                //finding the similar values as like == condition, and then reversing the process for more optimal results
                sourceObject.valuesToColour.forEach((item) => {
                    const xAxisPosition = [];
                    option["xAxis"]["data"].forEach((itemAvailable, index) => {
                        if (
                            item === itemAvailable ||
                            (itemAvailable.hasOwnProperty("value") &&
                                itemAvailable.value === item)
                        ) {
                            xAxisPosition.push(index);
                        }
                    });
                    positions = [...xAxisPosition, ...positions];
                });
                //reversing the positions to get the positions to be excluded
                const xAxisReversedPositions = [];
                option["xAxis"]["data"].forEach((itemAvailable, index) => {
                    if (!positions.includes(index)) {
                        xAxisReversedPositions.push(index);
                    }
                });
                positions = xAxisReversedPositions;
            }
            if (sourceObject.columnComparision === "<") {
                //less than comparision
                const dataVerify = option["xAxis"]["data"];
                dataVerify.forEach((item, index) => {
                    if (
                        (item.hasOwnProperty("value") &&
                            item.value < sourceObject.filterValue) ||
                        parseInt(item) < sourceObject.filterValue
                    ) {
                        positions.push(index);
                    }
                });
            }
            if (sourceObject.columnComparision === ">") {
                //greater than comparision
                const dataVerify = option["xAxis"]["data"];
                dataVerify.forEach((item, index) => {
                    if (
                        (item.hasOwnProperty("value") &&
                            item.value > sourceObject.filterValue) ||
                        parseInt(item) > sourceObject.filterValue
                    ) {
                        positions.push(index);
                    }
                });
            }
            if (sourceObject.columnComparision === "<=") {
                //less than or equal to comparision
                const dataVerify = option["xAxis"]["data"];
                dataVerify.forEach((item, index) => {
                    if (
                        (item.hasOwnProperty("value") &&
                            item.value <= sourceObject.filterValue) ||
                        parseInt(item) <= sourceObject.filterValue
                    ) {
                        positions.push(index);
                    }
                });
            }
            if (sourceObject.columnComparision === ">=") {
                //greater than or equal to comparision
                const dataVerify = option["xAxis"]["data"];
                dataVerify.forEach((item, index) => {
                    if (
                        (item.hasOwnProperty("value") &&
                            item.value >= sourceObject.filterValue) ||
                        parseInt(item) >= sourceObject.filterValue
                    ) {
                        positions.push(index);
                    }
                });
            }

            return positions;
        }
        //THE COLOR data function return the colour data for the rules

        //when the condition is met, values from newRules will be added to applied rules, then it will applied to chart
        function updateData() {
            if (
                newRules.column !== "" &&
                newRules.columnComparision !== "" &&
                newRules.columnComparision !== ""
            ) {
                if (newRules.index === -1) {
                    const appliedRulesLength = appliedRules.length;
                    const appliedRulesUpdated = [
                        ...appliedRules,
                        { ...newRules, ["index"]: appliedRulesLength },
                    ];
                    functionCallReference.current.applyRulesToChart = true;
                    setAppliedRules(appliedRulesUpdated);
                } else {
                    const index = newRules.index;
                    const assignedRules = appliedRules;
                    const updatedRules = [
                        ...assignedRules.filter(
                            (item, itemIndex) => itemIndex < index,
                        ),
                        newRules,
                        ...assignedRules.filter(
                            (item, itemIndex) => itemIndex > index,
                        ),
                    ];
                    functionCallReference.current.applyRulesToChart = true;
                    setAppliedRules(updatedRules);
                }
            }
            setNewRules(INITIAL_NEW_RULES);
        }
        //column comparision object
        const columnComparision = [
            {
                name: "is Equal To",
                value: "==",
            },
            {
                name: "is Not Equal To",
                value: "!=",
            },
            {
                name: "is Less than",
                value: "<",
            },
            {
                name: "is greater than",
                value: ">",
            },
            {
                name: "is Lesser than or Equal to",
                value: "<=",
            },
            {
                name: "is greater than or Equal to",
                value: ">=",
            },
        ];
        //condition to show a text field, when the comparision is not '=='
        const conditionForShowingField =
            newRules.columnComparision == "<" ||
            newRules.columnComparision == ">" ||
            newRules.columnComparision == "<=" ||
            newRules.columnComparision == ">=";

        const accordionDetails = (
            <Stack width={"100%"} style={{ padding: "0.95rem" }}>
                <StyledMainSection>
                    <h3>Applied Rules</h3>
                </StyledMainSection>
                <StyledMainSection>
                    <table>
                        <thead>
                            <tr>
                                <td>Column</td>
                                <td>Applied Rule</td>
                                <td>Action</td>
                            </tr>
                        </thead>
                        <tbody>
                            {appliedRules.length === 0 && (
                                <tr>
                                    <td colSpan={3}>No Records Found</td>
                                </tr>
                            )}
                            {appliedRules.length > 0 &&
                                appliedRules.map((rule, index) => {
                                    return (
                                        <tr>
                                            <td>
                                                {rule.column}{" "}
                                                {rule.columnToColour}
                                            </td>
                                            <td>{`${rule.column} ${
                                                rule.columnComparision
                                            } ${
                                                rule.columnComparision ===
                                                    "==" ||
                                                rule.columnComparision === "!="
                                                    ? rule.valuesToColour.join(
                                                          ",",
                                                      )
                                                    : rule.filterValue
                                            }`}</td>
                                            <td>
                                                <StyledSpan>
                                                    <span
                                                        onClick={() =>
                                                            deleteAssignedRule(
                                                                rule,
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <Delete />
                                                    </span>
                                                    <span
                                                        onClick={() =>
                                                            editAssignedRule(
                                                                rule,
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <Edit />
                                                    </span>
                                                </StyledSpan>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </StyledMainSection>
                <StyledMainSection>
                    <h3>New Rule</h3>
                </StyledMainSection>
                <StyledMainSection>
                    <StyledTextField
                        label="Enter Colour"
                        name="columnColour"
                        type="color"
                        value={newRules.columnColour}
                        onChange={(e) => updateFields("columnColour", e)}
                    ></StyledTextField>
                </StyledMainSection>
                <StyledMainSection>
                    <StyledSelect
                        label="Select Column"
                        name="columnToColour"
                        value={newRules.columnToColour}
                        onChange={(e) => {
                            const selected = columnData.find(
                                (col) => col.selector === e.target.value,
                            );
                            updateFields("columnToColour", {
                                target: { value: selected },
                            });
                        }}
                    >
                        {columnData?.map((cols, index) => {
                            return (
                                <Select.Item
                                    value={cols.selector}
                                    key={`columnToColour_${cols.selector}`}
                                >
                                    {typeof cols.name === "string"
                                        ? cols.name
                                        : cols.name?.[0]}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                    <StyledSelect
                        label="Select Comparision"
                        name="columnComparision"
                        value={newRules.columnComparision}
                        onChange={(e) => updateFields("columnComparision", e)}
                    >
                        {columnComparision.map((cols, index) => {
                            return (
                                <Select.Item
                                    value={cols.value}
                                    key={`columnComparision_${index}`}
                                >
                                    {cols.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledMainSection>
                {(newRules.columnComparision == "==" ||
                    newRules.columnComparision == "!=") && (
                    <StyledMainSection>
                        <StyledSelect
                            label="Select Values"
                            name="valuesToColour"
                            SelectProps={{
                                multiple: true,
                            }}
                            value={newRules?.valuesToColour || []}
                            onChange={(e) => updateFields("valuesToColour", e)}
                        >
                            {(valuesToColour === undefined ||
                                valuesToColour.length === 0) && (
                                <Select.Item value="">
                                    No Values to display
                                </Select.Item>
                            )}
                            {valuesToColour !== undefined &&
                                valuesToColour?.length > 0 && (
                                    <Select.Item value="">
                                        Select Values
                                    </Select.Item>
                                )}
                            {valuesToColour !== undefined &&
                                valuesToColour?.length > 0 &&
                                valuesToColour?.map((cols, index) => {
                                    return (
                                        <Select.Item
                                            value={cols}
                                            key={`columnComparision_${cols}`}
                                        >
                                            {cols}
                                        </Select.Item>
                                    );
                                })}
                        </StyledSelect>
                    </StyledMainSection>
                )}
                {
                    <StyledMainSection>
                        {conditionForShowingField && (
                            <StyledMainSection>
                                <label>Min: {newRules.filterMinValue}</label>
                                <br />
                                <label>Max: {newRules.filterMaxValue}</label>
                                <br />
                            </StyledMainSection>
                        )}
                        {conditionForShowingField && (
                            <StyledTextField
                                label="Select Value"
                                name="filterValue"
                                value={newRules.filterValue}
                                onChange={(e) => updateFields("filterValue", e)}
                            ></StyledTextField>
                        )}
                    </StyledMainSection>
                }
                <StyledMainSection>
                    <Button onClick={updateData}>Execute</Button>
                </StyledMainSection>
            </Stack>
        );

        function deleteAssignedRule(rule, index) {
            let assignedRules = appliedRules;
            assignedRules = assignedRules.filter(
                (item, itemindex) => index !== itemindex,
            );
            functionCallReference.current.applyRulesToChart = true;
            assignedRules = assignedRules.map((item, index) => {
                return {
                    ...item,
                    ["index"]: index,
                };
            });
            setAppliedRules(assignedRules);
        }
        function editAssignedRule(rule, index) {
            const assignedRules = rule;
            setNewRules(assignedRules);
        }

        return <>{accordionDetails}</>;
    },
);
export default ColourByValue;
