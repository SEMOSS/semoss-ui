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

const columnComparisionList = [
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
    chartType?: string;
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
    <D extends BlockDef = BlockDef>({ id, path, chartType }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [newRules, setNewRules] = useState(INITIAL_NEW_RULES);

        const [valuesToColour, setValuesToColour] = useState([]);
        //custom reference variable to handle color value applying
        const functionCallReference = useRef({
            valuesResetCheck: false,
            assignedRules: [],
            applyRulesToChart: false,
        });
        const updateTimeOutRef = useRef(null);
        let columnData = [];
        if (chartType === "bar" || chartType === "stackchart") {
            columnData = data.columns
                ? data.columns.filter(
                      (item) => item.label?.toLowerCase() === "yaxis",
                  )
                : [];
        } else if (chartType === "pie") {
            columnData = data.columns;
        }
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

        const appliedRules =
            computedValue["customSettings"]?.["appliedRules"] ?? [];

        useEffect(() => {
            return () => {
                clearTimeout(updateTimeOutRef.current);
            };
        }, []);

        const applyRules = (rules) => {
            const optionUpdated = {
                ...computedValue,
                customSettings: {
                    ...computedValue["customSettings"],
                    appliedRules: [...rules],
                    toolsUpdated: true,
                },
            };
            runStateUpdateCustom(optionUpdated);
        };

        function runStateUpdateCustom(
            updatedOption: PathValue<any, typeof path>,
        ) {
            clearTimeout(updateTimeOutRef.current);
            updateTimeOutRef.current = setTimeout(() => {
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
            if (typeof item === "number" || (item && typeof item === "string"))
                return item;
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

            if (column === "columnToColour") {
                const option = data.option;
                let valuesColor = [];
                let name = "";
                if (chartType === "pie" || chartType === "stackchart") {
                    name = event.target.value.name;
                    valuesColor = option["series"].flatMap((item) =>
                        item.data?.map((item) => {
                            const isStr = typeof item === "string";
                            return item.hasOwnProperty("value")
                                ? parseFloat(item.value)
                                : isStr
                                ? parseFloat(item)
                                : item;
                        }),
                    );
                } else if (chartType === "bar") {
                    name = Array.isArray(event.target.value.name)
                        ? event.target.value.name[0]
                        : event.target.value.name;
                    const pixelId = event.target.value.selector;
                    if (option["xAxis"]["pixelvalue"].includes(pixelId)) {
                        valuesColor = option["xAxis"]["data"].map((item) => {
                            return item.hasOwnProperty("value")
                                ? item.value
                                : item;
                        });
                    } else if (
                        option["yAxis"]["pixelvalue"].includes(pixelId)
                    ) {
                        valuesColor = option["series"]
                            .find((item) => item.name === name)
                            ["data"].map((item) => {
                                return item.hasOwnProperty("value")
                                    ? item.value
                                    : item;
                            });
                    }
                    valuesColor = valuesColor.map(convertSeriesDataToValue);
                }
                const valuesColorSet = Array.from(
                    new Set(
                        valuesColor.filter(
                            (item) =>
                                item > 0 &&
                                item !== null &&
                                typeof item !== "object",
                        ),
                    ),
                );
                setValuesToColour(valuesColorSet);
                setNewRules((prevValues) => {
                    return {
                        ...prevValues,
                        ["column"]: name,
                        ["columnName"]: name,
                        ["columnNameToColour"]: name,
                        ["filterMinValue"]: Math.min(...valuesColorSet),
                        ["filterMaxValue"]: Math.max(...valuesColorSet),
                    };
                });
            }
        }

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
                    applyRules(appliedRulesUpdated);
                } else {
                    const index = newRules.index;
                    const assignedRules = appliedRules;
                    const updatedRules = [
                        ...assignedRules.filter(
                            (_, itemIndex) => itemIndex < index,
                        ),
                        newRules,
                        ...assignedRules.filter(
                            (_, itemIndex) => itemIndex > index,
                        ),
                    ];
                    functionCallReference.current.applyRulesToChart = true;
                    applyRules(updatedRules);
                }
            }
            setNewRules(INITIAL_NEW_RULES);
        }

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
                                        <tr
                                            key={`applied-rule-${index}-${rule.columnToColour}`}
                                        >
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
                        {columnData?.map((cols) => {
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
                        {columnComparisionList.map((cols, index) => {
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
                                valuesToColour?.map((cols) => {
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

        function deleteAssignedRule(_, index) {
            let assignedRules = appliedRules;
            assignedRules = assignedRules.filter(
                (_, itemindex) => index !== itemindex,
            );
            functionCallReference.current.applyRulesToChart = true;
            assignedRules = assignedRules.map((item, index) => {
                return {
                    ...item,
                    ["index"]: index,
                };
            });
            applyRules(assignedRules);
        }
        function editAssignedRule(rule) {
            const assignedRules = rule;
            setNewRules(assignedRules);
        }

        return <>{accordionDetails}</>;
    },
);
export default ColourByValue;
