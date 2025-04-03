import { useState, useEffect, useMemo, useRef } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { Sync } from "@mui/icons-material";
import Checkbox from "@mui/material/Checkbox";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";

import { Autocomplete, IconButton, TextField } from "@semoss/ui";

import { EchartVisualizationBlockDef } from "../../../echart-visualization-block";
import { BaseSettingSection } from "../../../../block-settings";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";
import {
    useBlockSettings,
    useBlocksPixel,
    useFrameHeaders,
} from "../../../../../hooks";

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
export const FrameOperationsPie = observer(
    <D extends BlockDef = BlockDef>({ id, path }: FieldsSettingsProps<D>) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        // track the value
        const [value, setValue] = useState("");
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        //local states
        const [Label, setLabel] = useState([]);
        const [Value, setDataValue] = useState([]);
        const [tooltip, setTooltip] = useState([]);

        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data?.frame?.name);
        const fields = frameHeaders.data.list.map((field) => field.alias) || [];

        const reinitializeStates = (state) => {
            setLabel(state.Label ?? []);
            setDataValue(state.Value ?? []);
            setTooltip(state.tooltip ?? []);
        };
        // get all of the frames
        const getFrames = useBlocksPixel<string[]>("GetFrames();", {
            data: [],
        });

        // options for the autocomplete
        const options = getFrames.status === "SUCCESS" ? getFrames.data : [];

        // sync block data
        const syncBlockData = () => {
            getFrames.refresh();
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
            const state = json["_state"];
            if (state && state.hasOwnProperty("fields")) {
                reinitializeStates(state["fields"]);
            } else {
                json["_state"] = {};
                setLabel([]);
                setDataValue([]);
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
            axis: "Label" | "Value",
        ) => {
            // insert the new value
            const tempValue = JSON.parse(value);
            tempValue[axis] = {
                ...tempValue[axis],
                name:
                    axis == "Label"
                        ? [newValue[newValue.length - 1]]
                        : newValue,
            };
            if (axis === "Label") {
                setLabel([newValue[newValue.length - 1]]);
            } else if (axis === "Value") {
                setDataValue([newValue[newValue.length - 1]]);
            }

            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                Label:
                    axis === "Label" ? [newValue[newValue.length - 1]] : Label,
                Value:
                    axis === "Value" ? [newValue[newValue.length - 1]] : Value,
                tooltip: tooltip,
            };

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleRemoveLines = (removedChips, segment) => {
            const tempValue = JSON.parse(value);
            if (segment === "Label") {
                setLabel([]);
                tempValue[segment] = {
                    ...tempValue[segment],
                    name: tempValue[segment]["name"].filter(
                        (x) => x != removedChips,
                    ),
                    data: [],
                };
            } else if (segment === "Value") {
                setDataValue(Value.filter((x) => x != removedChips));
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

        const handleTooltipChange = (newValue: string[]) => {
            setTooltip(newValue);
            // insert the new value
            const tempValue = JSON.parse(value);
            if (!tempValue["tooltip"].hasOwnProperty("formatter")) {
                tempValue["tooltip"] = {
                    ...tempValue["tooltip"],
                    formatter:
                        ((params) => {
                            const formatterStringArr = ["<div>"];
                            formatterStringArr.push(
                                `<strong>${params[0].name}</strong><br>`,
                            );
                            params.forEach((param) => {
                                const { value, seriesName, color } = param;
                                formatterStringArr.push(
                                    `<span style="color:${color}">\u25CF</span> Average of ${seriesName}:<strong> ${value?.toFixed(
                                        1,
                                    )}</strong><br>`,
                                );
                            });
                            const { data } = params[0];
                            const tooltips = Object.entries(data);
                            tooltips.shift();
                            if (tooltips.length) {
                                tooltips.forEach((tooltip) => {
                                    formatterStringArr.push(
                                        `Average of ${tooltip[0]}: <strong>${tooltip[1]}</strong><br>`,
                                    );
                                });
                            }
                            formatterStringArr.push("</div>");
                            return formatterStringArr.join("");
                        }) + "",
                };
            }

            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                tooltip: newValue,
            };

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

        return (
            <>
                <BaseSettingSection label="Frame">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={getFrames.status !== "SUCCESS"}
                        value={
                            data?.frame?.name == "" ? null : data?.frame?.name
                        }
                        options={options}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // update the frame
                            setData("frame.name", value);
                        }}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select frame"
                                size="small"
                                variant="outlined"
                            />
                        )}
                    />

                    <IconButton size="small" onClick={() => syncBlockData()}>
                        <Sync />
                    </IconButton>
                </BaseSettingSection>
                <BaseSettingSection label="Label">
                    <Autocomplete
                        size="small"
                        fullWidth
                        multiple
                        disabled={data?.frame?.name === ""}
                        value={Label}
                        options={fields}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value, reason, details) => {
                            // updata option value
                            if (reason === "removeOption")
                                handleRemoveLines(details.option, "Label");
                            handleAxisChange(value, "Label");
                        }}
                        renderOption={renderOption}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Label"
                                placeholder="Select Label"
                            />
                        )}
                    />
                </BaseSettingSection>
                <BaseSettingSection label="Value">
                    <Autocomplete
                        size="small"
                        fullWidth
                        multiple
                        disabled={data?.frame?.name === ""}
                        value={Value}
                        options={fields}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value, reason, details) => {
                            // updata option value
                            if (reason === "removeOption")
                                handleRemoveLines(details.option, "Value");
                            handleAxisChange(value, "Value");
                        }}
                        renderOption={renderOption}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Value"
                                placeholder="Select Value"
                            />
                        )}
                    />
                </BaseSettingSection>
                {/* <BaseSettingSection label="Tooltip">
                    <Autocomplete
                        size="small"
                        fullWidth
                        multiple
                        disabled={data?.frame?.name === ''}
                        value={tooltip}
                        options={fields}
                        getOptionLabel={(option) => {
                            return Array.isArray(option)
                                ? option.join(', ')
                                : option;
                        }}
                        onChange={(_, value, reason, details) => {
                            // updata option value
                            if (reason === 'removeOption')
                                handleRemoveLines(details.option, 'tooltip');
                            handleTooltipChange(
                                value.sort((a, b) => a.localeCompare(b)),
                            );
                        }}
                        renderOption={renderOption}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Tooltip"
                                placeholder="Select tooltip"
                            />
                        )}
                    />
                </BaseSettingSection> */}
            </>
        );
    },
);
