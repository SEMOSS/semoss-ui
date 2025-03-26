import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Sync } from "@mui/icons-material";
import { Stack } from "@mui/material";
import { computed } from "mobx";

import {
    Autocomplete,
    IconButton,
    styled,
    TextField,
    useNotification,
} from "@semoss/ui";

import {
    useBlockSettings,
    useBlocksPixel,
    useFrameHeaders,
} from "../../../../../hooks";
import { Paths } from "../../../../../types";
import { Block, BlockDef } from "../../../../../store";
import { getValueByPath } from "../../../../../utility";
import { BaseSettingSection } from "../../../../block-settings";
import { GridBlockColumn } from "../../../grid-block/grid-block.types";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";

const StyledStack = styled(Stack)(() => ({
    width: "100%",
}));

interface StackChartBlockSettingsProps<D extends BlockDef = BlockDef> {
    /** Id of the block */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>["data"], 4>;
}

export const StackChartBlockSettings = observer(
    ({ id, path }: StackChartBlockSettingsProps) => {
        const notification = useNotification();
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [label, setLabel] = useState<any>([]);
        const [xAxisValue, setXAxisValue] = useState<any>();
        const [yAxisValue, setYAxisValue] = useState<any>();
        const [category, setCategory] = useState<any>();
        const [value, setValue] = useState("");
        const [tooltip, setTooltip] = useState<any>("");

        // get all of the frames
        const getFrames = useBlocksPixel<string[]>("GetFrames();", {
            data: [],
        });
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
            const json = JSON.parse(computedValue);
            let state = json["_state"];
            if (state && state.hasOwnProperty("fields")) {
                reinitializeStates(state["fields"]);
            }
        }, [id]);
        /**
         * Reinitializes the state of the scatter plot block settings.
         * @param {Object} state - The state to reinitialize with.
         */
        const reinitializeStates = (state) => {
            // XAxis
            if (state.XAxis) {
                setXAxisValue(state.XAxis);
            }
            // YAxis
            if (state.YAxis) {
                setYAxisValue(state.YAxis);
            }
            // tooltip
            if (state.tooltip) {
                setTooltip(state.tooltip ?? "");
            }
            // Category
            if (state.category) {
                setCategory(state.category ?? "");
            }
        };
        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data?.frame?.name);
        const fields = frameHeaders.data.list.map((field) => field.alias) || [];

        /**
         * Handles the change in category selection.
         * Updates the state and data with the selected category and its data type.
         *
         * @param {string} category - The selected category alias.
         */
        const handleChangeCategory = (category) => {
            // Parse the current value from JSON
            let tempValue = JSON.parse(value);

            // Find the field associated with the selected category alias
            const filteredArray = frameHeaders.data.list.find(
                (item) => item.alias == category,
            );

            // Get the data type of the selected category
            const categoryDataType = filteredArray.dataType;

            // Initialize or update the '_state' property with the selected category and its data type
            tempValue["_state"] =
                tempValue["_state"] &&
                Object.keys(tempValue["_state"]).length > 0
                    ? tempValue["_state"]
                    : {};
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                category: category,
                categoryDataType: categoryDataType,
            };
            // Update the category in the state
            setCategory(category);

            // Convert the updated value back to a JSON string
            setValue(JSON.stringify(tempValue));

            // Update the data with the new option
            setData("option", tempValue);
        };

        /**
         * Updates the X Axis settings based on the selected alias.
         *
         * @param {string} xaxis - The selected X Axis alias.
         */
        const handleChangeXAxis = (xaxis) => {
            // Parse the current value from JSON
            let tempValue = JSON.parse(value);

            // Find the field associated with the selected X Axis alias
            const filteredArray = frameHeaders.data.list.find(
                (item) => item.alias == xaxis,
            );

            // Get the data type of the selected X Axis
            const XAxisDataType = filteredArray.dataType;

            // Initialize or update the '_state' property with the selected X Axis and its data type
            tempValue["_state"] =
                tempValue["_state"] &&
                Object.keys(tempValue["_state"]).length > 0
                    ? tempValue["_state"]
                    : {};
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                XAxis: xaxis,
                XAxisDataType: XAxisDataType,
            };

            // Update the X Axis value in the state
            setXAxisValue(xaxis);

            // Update the X Axis name and pixel name in the chart options
            tempValue["xAxis"]["name"] = xaxis;
            tempValue["xAxis"]["pixelName"] = xaxis;
            tempValue["xAxis"]["flipAxisName"] = xaxis;
            tempValue["xAxis"]["axisName"] = xaxis;

            // Convert the updated value back to a JSON string
            setValue(JSON.stringify(tempValue));

            // Update the data with the new option
            setData("option", tempValue);
        };
        /**
         * Updates the Y Axis settings based on the selected alias.
         *
         * @param {string} yaxis - The selected Y Axis alias.
         */
        const handleChangeYAxis = (yaxis) => {
            // Update the Y Axis value in the state
            setYAxisValue(yaxis);

            // Parse the current value from JSON
            let tempValue = JSON.parse(value);

            // Find the field associated with the selected Y Axis alias
            const filteredArray = frameHeaders.data.list.find(
                (item) => item.alias == yaxis,
            );

            // Get the data type of the selected Y Axis
            const YAxisDataType = filteredArray.dataType;

            // Initialize or update the '_state' property with the selected Y Axis and its data type
            tempValue["_state"] =
                tempValue["_state"] &&
                Object.keys(tempValue["_state"]).length > 0
                    ? tempValue["_state"]
                    : {};
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                YAxis: yaxis,
                YAxisDataType: YAxisDataType,
            };

            // Update the Y Axis name and pixel name in the chart options
            tempValue["yAxis"]["name"] = yaxis;
            tempValue["yAxis"]["pixelName"] = yaxis;
            tempValue["yAxis"]["flipAxisName"] = yaxis;
            tempValue["yAxis"]["axisName"] = yaxis;

            // Convert the updated value back to a JSON string
            setValue(JSON.stringify(tempValue));

            // Update the data with the new option
            setData("option", tempValue);
        };
        /**
         * Updates the tooltip settings based on the selected alias.
         *
         * @param {string} tooltips - The selected tooltip alias.
         */
        const handleChangeTooltip = (tooltips) => {
            // Parse the current value from JSON
            let tempValue = JSON.parse(value);

            // Find the field associated with the selected tooltip alias
            const filteredArray = frameHeaders.data.list.find(
                (item) => item.alias == tooltips,
            );

            // Get the data type of the selected tooltip
            const tooltipDataType = filteredArray.dataType;

            // Initialize or update the '_state' property with the selected tooltip and its data type
            tempValue["_state"] =
                tempValue["_state"] &&
                Object.keys(tempValue["_state"]).length > 0
                    ? tempValue["_state"]
                    : {};
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                tooltip: tooltips,
                tooltipDataType: tooltipDataType,
            };

            // Update the tooltip value in the state
            setTooltip(tooltips);

            // Convert the updated value back to a JSON string
            setValue(JSON.stringify(tempValue));

            // Update the data with the new option
            setData("option", tempValue);
        };

        /**
         * Remove the specified segment from the option object.
         *
         * @param {string} segment - The segment to remove, can be 'category', 'xAxis', 'yAxis', 'tooltip'.
         */
        const handleRemoveOption = (segment: string) => {
            // Parse the current value from JSON
            let tempValue = JSON.parse(value);

            // Switch on the segment to remove the correct field from the option object
            switch (segment) {
                case "category":
                    // Reset the category value in the state
                    setCategory("");
                    // Remove the category field from the option object
                    const newFields = { ...tempValue };
                    newFields["series"][0]["data"] = [];
                    delete newFields["_state"]["fields"].category;
                    delete newFields["_state"]["fields"].categoryDataType;
                    // Convert the updated value back to a JSON string
                    setValue(JSON.stringify(newFields));
                    // Update the data with the new option
                    setData("option", newFields);
                    break;
                case "xAxis":
                    // Reset the X-axis value in the state
                    setXAxisValue("");
                    // Remove the X-axis field from the option object
                    const newXAxisFields = { ...tempValue };
                    newXAxisFields["series"][0]["data"] = [];
                    delete newXAxisFields["_state"]["fields"].XAxis;
                    delete newXAxisFields["_state"]["fields"].XAxisDataType;
                    newXAxisFields["xAxis"]["pixelName"] = ""; // Reset the X-axis pixel name
                    newXAxisFields["xAxis"]["name"] = ""; // Reset the X-axis name
                    newXAxisFields["xAxis"]["flipAxisName"] = ""; // Reset the X-axis flip axis name
                    newXAxisFields["xAxis"]["axisName"] = ""; // Reset the X-axis axis name
                    // Convert the updated value back to a JSON string
                    setValue(JSON.stringify(newXAxisFields));
                    // Update the data with the new option
                    setData("option", newXAxisFields);
                    break;
                case "yAxis":
                    // Reset the Y-axis value in the state
                    setYAxisValue("");
                    // Remove the Y-axis field from the option object
                    const newYAxisFields = { ...tempValue };
                    newYAxisFields["series"][0]["data"] = [];
                    delete newYAxisFields["_state"]["fields"].YAxis;
                    delete newYAxisFields["_state"]["fields"].YAxisDataType;
                    newYAxisFields["yAxis"]["pixelName"] = ""; // Reset the Y-axis pixel name
                    newYAxisFields["yAxis"]["name"] = ""; // Reset the Y-axis name
                    newYAxisFields["yAxis"]["flipAxisName"] = ""; // Reset the Y-axis flip axis name
                    newYAxisFields["yAxis"]["axisName"] = ""; // Reset the Y-axis axis name
                    // Convert the updated value back to a JSON string
                    setValue(JSON.stringify(newYAxisFields));
                    // Update the data with the new option
                    setData("option", newYAxisFields);
                    break;
                case "tooltip":
                    // Reset the tooltip value in the state
                    setTooltip("");
                    // Remove the tooltip field from the option object
                    const newTooltipFields = { ...tempValue };
                    delete newTooltipFields["_state"]["fields"].tooltip;
                    delete newTooltipFields["_state"]["fields"].tooltipDataType;
                    // Convert the updated value back to a JSON string
                    setValue(JSON.stringify(newTooltipFields));
                    // Update the data with the new option
                    setData("option", newTooltipFields);
                    break;
                default:
                    break;
            }
        };
        /**
         * Sync the columns with the frame headers
         */
        const syncFrameHeaders = () => {
            try {
                // get the columns by selector
                const columnMap: Record<string, GridBlockColumn> = {};

                // get the frameHeaders as columns
                const columns: GridBlockColumn[] = frameHeaders?.data?.list.map(
                    (h) => {
                        return {
                            name: h.alias,
                            width: undefined,
                            // add the previous if it exists
                            ...JSON.parse(
                                JSON.stringify(columnMap[h.alias] || {}),
                            ),
                            selector: h.header,
                        };
                    },
                );
                // frameHeaders &&
                //     setLabel(frameHeaders.data.list.map((item) => item.alias));

                // update the data
                setData("columns", columns);

                notification.add({
                    color: "success",
                    message: "Succesfully synchronized headers",
                });
            } catch (e) {
                notification.add({
                    color: "error",
                    message: e.message,
                });
            }
        };

        // options for the autocomplete
        const options = getFrames.status === "SUCCESS" ? getFrames?.data : [];

        return (
            <StyledStack>
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

                    <IconButton size="small" onClick={() => syncFrameHeaders()}>
                        <Sync />
                    </IconButton>
                </BaseSettingSection>

                <StyledStack>
                    <BaseSettingSection label="X-Axis">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data.frame.name === ""}
                            value={xAxisValue ? xAxisValue : ""}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value, reason) => {
                                // update the frame
                                if (reason === "clear")
                                    handleRemoveOption("xAxis");
                                else handleChangeXAxis(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select X-Axis"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="Y-Axis">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data.frame.name === ""}
                            value={yAxisValue ? yAxisValue : ""}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value, reason) => {
                                // update the frame
                                if (reason === "clear")
                                    handleRemoveOption("yAxis");
                                else handleChangeYAxis(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select Y-Axis"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="Category">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data.frame.name === ""}
                            value={category ? category : ""}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value, reason) => {
                                // update the frame
                                if (reason === "clear")
                                    handleRemoveOption("category");
                                else handleChangeCategory(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select Category"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="Tooltip">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data.frame.name === ""}
                            value={tooltip ? tooltip : ""}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value, reason) => {
                                // update the frame
                                if (reason === "clear")
                                    handleRemoveOption("tooltip");
                                else handleChangeTooltip(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select tooltip"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                </StyledStack>
            </StyledStack>
        );
    },
);
