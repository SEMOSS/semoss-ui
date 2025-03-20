import { useState, useEffect, useMemo, useRef } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import Checkbox from "@mui/material/Checkbox";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";

import { Autocomplete, styled, TextField } from "@semoss/ui";

import { BaseSettingSection } from "../../../../block-settings/BaseSettingSection";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { useBlockSettings, useFrameHeaders } from "../../../../../hooks";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";

interface FieldsSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>["data"], 4>;
}
const EmptyContainer = styled("div")(() => ({
    paddingBottom: "20px",
    paddingLeft: "20px",
    paddingRight: "10px",
}));
export const Fields = observer(
    <D extends BlockDef = BlockDef>({ id, path }: FieldsSettingsProps<D>) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        // track the value
        const [value, setValue] = useState("");
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        //local states
        const [xAxis, setXAxis] = useState([]);
        const [yAxis, setYAxis] = useState([]);
        const [tooltip, setTooltip] = useState([]);

        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data.frame.name);
        const fields = frameHeaders.data.list.map((field) => field.alias) || [];

        const reinitializeStates = (state) => {
            setXAxis(state.xAxis ?? []);
            setYAxis(state.yAxis ?? []);
            setTooltip(state.tooltip ?? []);
        };

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

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        useEffect(() => {
            // if (data) {
            const json: PathValue<D["data"], typeof path> =
                JSON.parse(computedValue);
            let state = json["_state"];
            if (state && state.hasOwnProperty("fields")) {
                reinitializeStates(state["fields"]);
            } else {
                json["_state"] = {};
                setXAxis([]);
                setYAxis([]);
                setTooltip([]);
                setValue(JSON.stringify(json, null, 2));
            }
            // }
        }, [id]);

        const dispatchData = (newSpec: PathValue<D["data"], typeof path>) => {
            // clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData("option", newSpec);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const handleAxisChange = (
            newValue: string[],
            axis: "xAxis" | "yAxis",
            addedChips?: string,
        ) => {
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue[axis] = {
                ...tempValue[axis],
                name: axis == "xAxis" ? [newValue[0]] : newValue,
            };
            if (axis === "xAxis") {
                setXAxis([newValue[0]]);
            } else if (axis === "yAxis") {
                setYAxis(newValue);
                for (let i = 0; i < newValue.length; i++) {
                    tempValue["series"][i] = {
                        ...tempValue["series"][i],
                        name: newValue[i],
                        type: "line",
                        data: tempValue["series"][i]?.data ?? [],
                        lineStyle: {
                            type: "solid",
                            width: 1,
                        },
                        label: {
                            show: true,
                            position: "top",
                            rotate: 45,
                            fontSize: 12,
                            color: "#000000",
                        },
                    };
                }
            }
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                xAxis: axis === "xAxis" ? [newValue[0]] : xAxis,
                yAxis: axis === "yAxis" ? newValue : yAxis,
                tooltip: tooltip,
            };
            delete tempValue["tooltip"]["formatter"];
            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleRemoveLines = (removedChips, segment) => {
            let tempValue = JSON.parse(value);
            if (segment === "xAxis") {
                setXAxis([]);
                tempValue[segment] = {
                    ...tempValue[segment],
                    name: tempValue[segment]["name"].filter(
                        (x) => x != removedChips,
                    ),
                    data: [],
                };
            } else if (segment === "yAxis") {
                setYAxis(yAxis.filter((x) => x != removedChips));
                tempValue[segment] = {
                    ...tempValue[segment],
                    name: tempValue[segment]["name"].filter(
                        (x) => x != removedChips,
                    ),
                    data: [],
                };
                tempValue["series"] = tempValue["series"].filter(
                    (x) => x.name != removedChips,
                );
            } else if (segment === "tooltip") {
                setTooltip(tooltip.filter((x) => x != removedChips));
                tempValue["series"][0] = {
                    ...tempValue["series"][0],
                    data: tempValue["series"][0]["data"].map(
                        (x) => delete x[removedChips],
                    ),
                };
            }

            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                [segment]: [segment].filter((x) => x != removedChips),
            };
            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleTooltipChange = (newValue: string[], addedChips) => {
            let tempValue = JSON.parse(value);
            if (!yAxis.includes(addedChips)) {
                setTooltip(newValue);
                if (
                    !tempValue["_state"]["fields"]["xAxis"].includes(
                        newValue,
                    ) &&
                    !tempValue["_state"]["fields"]["yAxis"].includes(newValue)
                ) {
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        tooltip: newValue,
                    };
                }
            }
            // insert the new value
            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
        const checkedIcon = <CheckBoxIcon fontSize="small" />;
        const renderOption = (
            props: any,
            option: string,
            { selected }: any,
        ) => {
            const { ...optionProps } = props;
            return (
                <li {...optionProps}>
                    <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        style={{ marginRight: 8 }}
                        checked={selected}
                    />
                    {option}
                </li>
            );
        };
        const tooltipRenderOption = (
            props: any,
            option: string,
            { selected }: any,
        ) => {
            const { ...optionProps } = props;
            return (
                <li
                    {...optionProps}
                    // aria-disabled={
                    //     xAxis.includes(option) || yAxis.includes(option)
                    // }
                >
                    <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        style={{ marginRight: 8 }}
                        //checked={selected}
                        checked={selected}
                        // disabled={
                        //     xAxis.includes(option) || yAxis.includes(option)
                        // }
                    />
                    {option}
                </li>
            );
        };
        return (
            <>
                <EmptyContainer>
                    <BaseSettingSection label="x-Axis">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple
                            disabled={data.frame.name === ""}
                            value={xAxis}
                            options={fields}
                            getOptionLabel={(option) => {
                                return Array.isArray(option)
                                    ? option.join(", ")
                                    : option;
                            }}
                            onChange={(_, value, reason, details) => {
                                // updata option value
                                if (reason === "removeOption")
                                    handleRemoveLines(details.option, "xAxis");
                                handleAxisChange(
                                    value.sort((a, b) => a.localeCompare(b)),
                                    "xAxis",
                                    details.option,
                                );
                            }}
                            renderOption={renderOption}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="X-Axis"
                                    placeholder="Select X-Axis"
                                />
                            )}
                        />
                    </BaseSettingSection>
                </EmptyContainer>
                <EmptyContainer>
                    <BaseSettingSection label="y-Axis">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple
                            disabled={data.frame.name === ""}
                            value={yAxis}
                            options={fields}
                            getOptionLabel={(option) => {
                                return Array.isArray(option)
                                    ? option.join(", ")
                                    : option;
                            }}
                            onChange={(_, value, reason, details) => {
                                // updata option value
                                if (reason === "removeOption")
                                    handleRemoveLines(details.option, "yAxis");
                                handleAxisChange(
                                    value.sort((a, b) => a.localeCompare(b)),
                                    "yAxis",
                                    details.option,
                                );
                            }}
                            renderOption={renderOption}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Y-Axis"
                                    placeholder="Select Y-Axis"
                                />
                            )}
                        />
                    </BaseSettingSection>
                </EmptyContainer>
                <EmptyContainer>
                    <BaseSettingSection label="Tooltip">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple
                            disabled={data.frame.name === ""}
                            value={tooltip}
                            options={fields}
                            getOptionLabel={(option) => {
                                return Array.isArray(option)
                                    ? option.join(", ")
                                    : option;
                            }}
                            onChange={(_, value, reason, details) => {
                                // updata option value
                                if (reason === "removeOption")
                                    handleRemoveLines(
                                        details.option,
                                        "tooltip",
                                    );
                                handleTooltipChange(
                                    value.sort((a, b) => a.localeCompare(b)),
                                    details.option,
                                );
                            }}
                            renderOption={tooltipRenderOption}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Tooltip"
                                    placeholder="Select tooltip"
                                />
                            )}
                        />
                    </BaseSettingSection>
                </EmptyContainer>
            </>
        );
    },
);
