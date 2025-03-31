import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";

import { Select, styled, Switch, TextField, ToggleTabsGroup } from "@semoss/ui";

import { PathValue } from "../../../../../types";
import { BlockDef } from "../../../../../store";
import { useBlockSettings } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import { BAR_CHART_DATA } from "../../Visualization.constants";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { EchartVisualizationBlockConfig } from "../../../../block-defaults";
import { ColorPickerSettings } from "../../../../block-settings/shared/ColorPickerSettings";

//styled select field to have full width
const StyledSelect = styled(Select)(() => ({
    width: "100%",
}));
//a main section field with custom styling
const StyledMainSection = styled("div")(() => ({
    display: "block",
    padding: "0.5rem",
    width: "100%",
}));
//a sub section field with custom styling
const StyledSubSection = styled("div", {
    shouldForwardProp: (prop) => prop != "display" && prop != "justifyContent",
})<{ display?: string; justifyContent?: string }>(
    ({ theme, display, justifyContent }) => ({
        width: "100%",
        paddingTop: "0.5rem",
        display: display ?? undefined,
        justifyContent: justifyContent ?? undefined,
    }),
);
//a text field with custom styling for full width
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));
//Initial state of custom value labels as default values for managing and restoring
const DEFAULT_VALUE_LABELS = {
    show: false,
    position: "top",
    rotate: "0",
    alignment: "center",
    font: "sans-serif",
    fontsize: "12",
    fontweight: "normal",
    fontcolour: "#000000",
    seriesIndex: "0",
};

//Customize value labels initial value
const INITIAL_VALUE_LABELS = [];

//Customize value labels component's key properties
interface CustomizeValueLabelsKeys {
    show: boolean;
    position: string;
    rotate: string;
    alignment: string;
    font: string;
    fontsize: string;
    fontweight: string;
    fontcolour: string;
    seriesIndex: number | string;
}

//having custom fields to customize charts text parts like: position, alignment, rotate, etc
export const CustomizeValueLabels = observer(
    <D extends BlockDef = BlockDef>({ option, chartType, id, path }) => {
        const [fieldData, setFieldData] =
            useState<CustomizeValueLabelsKeys[]>(INITIAL_VALUE_LABELS);
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [value, setValue] = useState<
            typeof EchartVisualizationBlockConfig.data.option
        >(data.option);
        const [selectedSeries, setSelectedSeries] = useState<string>("0");
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        const [valueLabelsUpdated, setValueLabelsUpdated] = useState<
            "initial" | "updated"
        >("initial");
        const labelPositionValues: string[] = [
            "top",
            "left",
            "right",
            "bottom",
            "inside",
            "insideLeft",
            "insideRight",
            "insideTop",
            "insideBottom",
            "insideTopLeft",
            "insideBottomLeft",
            "insideTopRight",
            "insideBottomRight",
        ];
        const alignment: string[] = ["left", "center", "right"];
        const fontFamily: string[] = ["sans-serif", "serif", "monospace"];
        const fontWeight: string[] = [
            "normal",
            "bold",
            "bolder",
            "lighter",
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
        ];
        //for retaining the previously selected values, this useeffect will help
        useEffect(() => {
            const option =
                typeof value === "string" ? JSON.parse(value) : value;
            if (option["series"]) {
                const seriesData = getFilteredSeriesIndex();
                const fieldsData = fieldData;
                const fieldsDataToUpdate = seriesData.map((seriesChartData) => {
                    if (
                        option["series"][seriesChartData]["label"] === undefined
                    ) {
                        return {
                            ...DEFAULT_VALUE_LABELS,
                            seriesIndex: seriesChartData,
                        };
                    } else {
                        return {
                            show:
                                option["series"][seriesChartData]["label"]
                                    .show ?? false,
                            position:
                                option["series"][seriesChartData]["label"]
                                    .position ?? DEFAULT_VALUE_LABELS.position,
                            rotate:
                                option["series"][seriesChartData]["label"]
                                    .rotate ?? DEFAULT_VALUE_LABELS.rotate,
                            alignment:
                                option["series"][seriesChartData]["label"]
                                    .align ?? DEFAULT_VALUE_LABELS.alignment,
                            font:
                                option["series"][seriesChartData]["label"]
                                    .fontFamily ?? DEFAULT_VALUE_LABELS.font,
                            fontsize:
                                option["series"][seriesChartData]["label"]
                                    .fontSize ?? DEFAULT_VALUE_LABELS.fontsize,
                            fontweight:
                                option["series"][seriesChartData]["label"]
                                    .fontWeight ??
                                DEFAULT_VALUE_LABELS.fontweight,
                            fontcolour:
                                option["series"][seriesChartData]["label"]
                                    .color ?? DEFAULT_VALUE_LABELS.fontcolour,
                            seriesIndex: seriesChartData,
                        };
                    }
                });
                setFieldData((prevFieldsData) => {
                    return fieldsDataToUpdate;
                });
            }
        }, []);
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
        //updating local 'value' state to the most recent state
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        //update the chart data to state, when any of customize value labels field is changed
        useEffect(() => {
            if (valueLabelsUpdated === "updated") {
                updateChartData(fieldData);
            }
        }, [fieldData]);
        //handles different input fields by setting values to state, whenever a change happens
        const updateFields = (
            fieldName,
            fieldValue,
            fieldType,
            seriesIndex,
        ): void => {
            if (valueLabelsUpdated === "initial") {
                setValueLabelsUpdated("updated");
            }
            const fieldsData = fieldData;
            fieldsData[seriesIndex] = {
                ...fieldsData[seriesIndex],
                [fieldName]:
                    fieldType === "switch"
                        ? fieldValue.target.checked
                        : fieldValue.target.value,
            };
            setFieldData((prevData) => {
                return [...fieldsData];
            });
        };
        //update the chart data to state, when customize value labels fields section is updated to new value
        function updateChartData(values: CustomizeValueLabelsKeys[]) {
            let option = typeof value === "string" ? JSON.parse(value) : value;
            let optionUpdated = option;
            const customizeLabelOptionsData = {};
            values.forEach((item) => {
                customizeLabelOptionsData[item.seriesIndex] = {
                    show: item.show,
                    position: item.position,
                    rotate: item.rotate,
                    alignment: item.alignment,
                    font: item.font,
                    fontsize: item.fontsize,
                    fontweight: item.fontweight,
                    fontcolour: item.fontcolour,
                };
            });
            const customizeLabelOptionsValue = customizeLabelOptionsData;
            //get matching series index for bar chart
            const filteredSeries: number[] = getFilteredSeriesIndex();
            //update the series with new styles for every matching series index
            filteredSeries.forEach((item) => {
                const displayPositionIndex: number = item;
                const showValueLabel: boolean =
                    customizeLabelOptionsValue[displayPositionIndex]["show"] ??
                    false;
                if (customizeLabelOptionsValue[displayPositionIndex]["show"]) {
                    if (option["series"][displayPositionIndex]) {
                        option["series"][displayPositionIndex] = {
                            ...option["series"][displayPositionIndex],
                            ["label"]: {
                                ...option["series"][displayPositionIndex][
                                    "label"
                                ],
                                ["show"]: showValueLabel,
                            },
                        };
                    }
                }
                if (
                    customizeLabelOptionsValue[displayPositionIndex]["position"]
                ) {
                    if (option["series"][displayPositionIndex]) {
                        option["series"][displayPositionIndex] = {
                            ...option["series"][displayPositionIndex],
                            ["label"]: {
                                ...option["series"][displayPositionIndex][
                                    "label"
                                ],
                                ["show"]: showValueLabel,
                                ["position"]:
                                    customizeLabelOptionsValue[
                                        displayPositionIndex
                                    ]["position"],
                            },
                        };
                    }
                }
                if (
                    customizeLabelOptionsValue[displayPositionIndex]["rotate"]
                ) {
                    if (option["series"][displayPositionIndex]) {
                        option["series"][displayPositionIndex] = {
                            ...option["series"][displayPositionIndex],
                            ["label"]: {
                                ...option["series"][displayPositionIndex][
                                    "label"
                                ],
                                ["show"]: showValueLabel,
                                ["rotate"]:
                                    customizeLabelOptionsValue[
                                        displayPositionIndex
                                    ]["rotate"],
                            },
                        };
                    }
                }
                if (
                    customizeLabelOptionsValue[displayPositionIndex][
                        "alignment"
                    ]
                ) {
                    if (option["series"][displayPositionIndex]) {
                        option["series"][displayPositionIndex] = {
                            ...option["series"][displayPositionIndex],
                            ["label"]: {
                                ...option["series"][displayPositionIndex][
                                    "label"
                                ],
                                ["show"]: showValueLabel,
                                ["align"]:
                                    customizeLabelOptionsValue[
                                        displayPositionIndex
                                    ]["alignment"],
                            },
                        };
                    }
                }
                if (customizeLabelOptionsValue[displayPositionIndex]["font"]) {
                    if (option["series"][displayPositionIndex]) {
                        option["series"][displayPositionIndex] = {
                            ...option["series"][displayPositionIndex],
                            ["label"]: {
                                ...option["series"][displayPositionIndex][
                                    "label"
                                ],
                                ["show"]: showValueLabel,
                                ["fontFamily"]:
                                    customizeLabelOptionsValue[
                                        displayPositionIndex
                                    ]["font"],
                            },
                        };
                    }
                }
                if (
                    customizeLabelOptionsValue[displayPositionIndex]["fontsize"]
                ) {
                    if (option["series"][displayPositionIndex]) {
                        option["series"][displayPositionIndex] = {
                            ...option["series"][displayPositionIndex],
                            ["label"]: {
                                ...option["series"][displayPositionIndex][
                                    "label"
                                ],
                                ["show"]: showValueLabel,
                                ["fontSize"]:
                                    Number(
                                        customizeLabelOptionsValue[
                                            displayPositionIndex
                                        ]["fontsize"],
                                    ) || undefined,
                            },
                        };
                    }
                }
                if (
                    customizeLabelOptionsValue[displayPositionIndex][
                        "fontweight"
                    ]
                ) {
                    if (option["series"][displayPositionIndex]) {
                        option["series"][displayPositionIndex] = {
                            ...option["series"][displayPositionIndex],
                            ["label"]: {
                                ...option["series"][displayPositionIndex][
                                    "label"
                                ],
                                ["show"]: showValueLabel,
                                ["fontWeight"]:
                                    customizeLabelOptionsValue[
                                        displayPositionIndex
                                    ]["fontweight"],
                            },
                        };
                    }
                }
                if (
                    customizeLabelOptionsValue[displayPositionIndex][
                        "fontcolour"
                    ]
                ) {
                    if (option["series"][displayPositionIndex]) {
                        option["series"][displayPositionIndex] = {
                            ...option["series"][displayPositionIndex],
                            ["label"]: {
                                ...option["series"][displayPositionIndex][
                                    "label"
                                ],
                                ["show"]: showValueLabel,
                                ["color"]:
                                    customizeLabelOptionsValue[
                                        displayPositionIndex
                                    ]["fontcolour"] ||
                                    option["series"][displayPositionIndex][
                                        "label"
                                    ]["color"],
                            },
                        };
                    }
                }
            });
            option = {
                ...option,
                ["customSettings"]: {
                    ["toolsUpdated"]: true,
                },
            };
            optionUpdated = option;
            runStateUpdateCustom(optionUpdated);
        }
        //function to check and retrieve the indexes for bar chart type
        function getFilteredSeriesIndex() {
            const index = [];
            const option =
                typeof value === "string" ? JSON.parse(value) : value;
            const seriesAvailable = option["series"].filter((item) =>
                BAR_CHART_DATA.JSONVALUE.includes(item.type),
            );
            seriesAvailable.forEach((item, seriesIndex) => {
                index.push(seriesIndex);
            });
            return index;
        }
        //update the state when any of the fields in custom value labels is changed
        function runStateUpdateCustom(
            optionUpdated: typeof EchartVisualizationBlockConfig.data.option,
        ) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        "option",
                        optionUpdated as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }

        const fieldSelectedSeries: CustomizeValueLabelsKeys =
            fieldData[parseInt(selectedSeries)] || DEFAULT_VALUE_LABELS;

        const getAccordianDetails = (
            <StyledMainSection>
                <StyledSubSection display="flex" justifyContent="space-between">
                    <ToggleTabsGroup
                        onChange={(e: React.SyntheticEvent, val: string) =>
                            setSelectedSeries((prevSelectedSeries) => val)
                        }
                        value={selectedSeries}
                    >
                        {fieldData.length &&
                            fieldData.map((item, index) => {
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
                </StyledSubSection>
                {parseInt(selectedSeries) >= 0 && (
                    <StyledSubSection
                        display="flex"
                        justifyContent="space-between"
                    >
                        <Switch
                            checked={fieldSelectedSeries?.show ?? undefined}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                updateFields(
                                    "show",
                                    e,
                                    "switch",
                                    selectedSeries,
                                )
                            }
                            title="Show Value Labels"
                        />
                        <label htmlFor="show-value-labels">
                            Show Value Labels
                        </label>
                    </StyledSubSection>
                )}
                {fieldSelectedSeries?.show && (
                    <>
                        <StyledSubSection>
                            <label htmlFor="label-position">Position</label>
                            <StyledSelect
                                id="label-position"
                                value={fieldSelectedSeries.position ?? ""}
                                onChange={(e) =>
                                    updateFields(
                                        "position",
                                        e,
                                        "select",
                                        selectedSeries,
                                    )
                                }
                            >
                                <Select.Item key="-1" value="">
                                    Select
                                </Select.Item>
                                {labelPositionValues.map((label, index) => {
                                    return (
                                        <Select.Item value={label} key={index}>
                                            {label}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="rotate-label">
                                Rotate Label(In Degrees)
                            </label>
                            <StyledTextField
                                variant={"outlined"}
                                type="number"
                                id="rotate-label"
                                value={fieldSelectedSeries.rotate ?? ""}
                                onChange={(e) =>
                                    updateFields(
                                        "rotate",
                                        e,
                                        "text",
                                        selectedSeries,
                                    )
                                }
                            ></StyledTextField>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="alignment-label">
                                Select Alignment
                            </label>
                            <StyledSelect
                                id="alignment-label"
                                value={fieldSelectedSeries.alignment ?? ""}
                                onChange={(e) =>
                                    updateFields(
                                        "alignment",
                                        e,
                                        "select",
                                        selectedSeries,
                                    )
                                }
                            >
                                <Select.Item key="-1" value="">
                                    Select Alignment
                                </Select.Item>
                                {alignment.map((label, index) => {
                                    return (
                                        <Select.Item value={label} key={index}>
                                            {label}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="font">Select Font</label>
                            <StyledSelect
                                id="font"
                                value={fieldSelectedSeries.font ?? ""}
                                onChange={(e) =>
                                    updateFields(
                                        "font",
                                        e,
                                        "select",
                                        selectedSeries,
                                    )
                                }
                            >
                                <Select.Item key="-1" value="">
                                    Select Font
                                </Select.Item>
                                {fontFamily.map((label, index) => {
                                    return (
                                        <Select.Item value={label} key={index}>
                                            {label}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="font-size">
                                Select Font Size (Default: 12)
                            </label>
                            <StyledTextField
                                variant={"outlined"}
                                type="number"
                                id="font-size"
                                // defaultValue={fieldData.fontsize}
                                value={fieldSelectedSeries.fontsize}
                                onChange={(e) =>
                                    updateFields(
                                        "fontsize",
                                        e,
                                        "text",
                                        selectedSeries,
                                    )
                                }
                            ></StyledTextField>
                        </StyledSubSection>
                        <StyledSubSection>
                            <label htmlFor="font-weight">
                                Select Font Weight
                            </label>
                            <StyledSelect
                                id="font-weight"
                                value={fieldSelectedSeries.fontweight}
                                onChange={(e) =>
                                    updateFields(
                                        "fontweight",
                                        e,
                                        "select",
                                        selectedSeries,
                                    )
                                }
                            >
                                <Select.Item key="-1" value="">
                                    Select Font Weight
                                </Select.Item>
                                {fontWeight.map((label, index) => {
                                    return (
                                        <Select.Item value={label} key={index}>
                                            {label}
                                        </Select.Item>
                                    );
                                })}
                            </StyledSelect>
                        </StyledSubSection>
                        <StyledSubSection>
                            <ColorPickerSettings
                                id={id}
                                path={`option.series.${selectedSeries}.label.color`}
                                colorValue={fieldSelectedSeries.fontcolour}
                                onChange={(e) =>
                                    updateFields(
                                        "fontcolour",
                                        { target: { value: e } },
                                        "text",
                                        selectedSeries,
                                    )
                                }
                            />
                        </StyledSubSection>
                    </>
                )}
                <br />
            </StyledMainSection>
        );

        return <>{getAccordianDetails}</>;
    },
);
