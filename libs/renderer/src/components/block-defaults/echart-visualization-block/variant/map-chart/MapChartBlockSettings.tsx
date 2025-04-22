import { observer } from "mobx-react-lite";
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
import { BaseSettingSection } from "../../../../block-settings";
import { Sync } from "@mui/icons-material";

import { Stack } from "@mui/material";
import { GridBlockColumn } from "../../../grid-block/grid-block.types";
import { useEffect, useMemo, useState } from "react";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { computed } from "mobx";
import { getValueByPath } from "@/utility";
import { Paths } from "@/types";
import { Block, BlockDef } from "../../../../../store";

interface MapChartBlockSettingsProps<D extends BlockDef = BlockDef> {
    /** Id of the block */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>["data"], 4>;
}

const StyledStack = styled(Stack)(() => ({
    width: "100%",
}));

export const MapChartBlockSettings = observer(
    ({ id, path }: MapChartBlockSettingsProps) => {
        const notification = useNotification();
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [label, setLabel] = useState<any>([]);
        const [latitudeValue, setLatitudeValue] = useState<any>();
        const [longitudeValue, setLongitudeValue] = useState<any>();
        const [dataLabel, setDataLabel] = useState<any>();
        const [color, setColor] = useState<any>();
        const [size, setSize] = useState<any>();
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
            const state = json["_state"];
            if (state && state.hasOwnProperty("fields")) {
                reinitializeStates(state["fields"]);
            }
        }, [id]);
        /**
         * Reinitializes the state of the scatter plot block settings.
         * @param {Object} state - The state to reinitialize with.
         */
        const reinitializeStates = (state) => {
            // Latitude
            if (state.Latitude) {
                setLatitudeValue(state.Latitude);
            }
            // Longitude
            if (state.Longitude) {
                setLongitudeValue(state.Longitude);
            }
            // tooltip
            if (state.tooltip) {
                setTooltip(state.tooltip ?? "");
            }
            // label
            if (state.label) {
                setDataLabel(state.label ?? "");
            }
            // size
            if (state.size) {
                setSize(state.size ?? "");
            }
            // color
            if (state.color) {
                setColor(state.color ?? "");
            }
        };
        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data?.frame?.name);
        const fields = frameHeaders.data.list.map((field) => field.alias) || [];

        /**
         * Handles the change in label selection.
         * Updates the state and data with the selected label and its data type.
         *
         * @param {string} label - The selected label alias.
         */
        const handleChangeLabel = (label) => {
            // debugger;
            // Parse the current value from JSON
            const tempValue = JSON.parse(value);

            // Find the field associated with the selected label alias
            const filteredArray = frameHeaders.data.list.find(
                (item) => item.alias == label,
            );

            // Get the data type of the selected label
            const labelDataType = filteredArray.dataType;

            // Initialize or update the '_state' property with the selected label and its data type
            tempValue["_state"] =
                tempValue["_state"] &&
                Object.keys(tempValue["_state"]).length > 0
                    ? tempValue["_state"]
                    : {};
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                label: label,
                labelDataType: labelDataType,
            };

            // Update the series label name
            // tempValue['series'][0]['label']['name'] = label;

            // Update the label in the state
            setDataLabel(label);

            // Convert the updated value back to a JSON string
            setValue(JSON.stringify(tempValue));

            // Update the data with the new option
            setData("option", tempValue);
        };

        /**
         * Updates the latitude settings based on the selected alias.
         *
         * @param {string} latitude - The selected latitude alias.
         */
        const handleChangeLatitude = (latitude) => {
            // Parse the current value from JSON
            const tempValue = JSON.parse(value);

            // Find the field associated with the selected latitude alias
            const filteredArray = frameHeaders.data.list.find(
                (item) => item.alias == latitude,
            );

            // Get the data type of the selected latitude
            const LatitudeDataType = filteredArray.dataType;

            // Initialize or update the '_state' property with the selected latitude and its data type
            tempValue["_state"] =
                tempValue["_state"] &&
                Object.keys(tempValue["_state"]).length > 0
                    ? tempValue["_state"]
                    : {};
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                Latitude: latitude,
                LatitudeDataType: LatitudeDataType,
            };

            // Update the latitude value in the state
            setLatitudeValue(latitude);

            // Update the latitude name and pixel name in the chart options
            // tempValue['Latitude']['name'] = latitude;
            // tempValue['Latitude']['pixelName'] = latitude;

            // Convert the updated value back to a JSON string
            setValue(JSON.stringify(tempValue));

            // Update the data with the new option
            setData("option", tempValue);
        };
        /**
         * Updates the longitude settings based on the selected alias.
         *
         * @param {string} longitude - The selected longitude alias.
         */
        const handleChangeLongitude = (longitude) => {
            // Update the longitude value in the state
            setLongitudeValue(longitude);

            // Parse the current value from JSON
            const tempValue = JSON.parse(value);

            // Find the field associated with the selected longitude alias
            const filteredArray = frameHeaders.data.list.find(
                (item) => item.alias == longitude,
            );

            // Get the data type of the selected longitude
            const LongitudeDataType = filteredArray.dataType;

            // Initialize or update the '_state' property with the selected longitude and its data type
            tempValue["_state"] =
                tempValue["_state"] &&
                Object.keys(tempValue["_state"]).length > 0
                    ? tempValue["_state"]
                    : {};
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                Longitude: longitude,
                LongitudeDataType: LongitudeDataType,
            };

            // Update the longitude name and pixel name in the chart options
            // tempValue['Longitude']['name'] = longitude;
            // tempValue['Longitude']['pixelName'] = longitude;

            // Convert the updated value back to a JSON string
            setValue(JSON.stringify(tempValue));

            // Update the data with the new option
            setData("option", tempValue);
        };
        /**
         * Updates the color settings based on the selected alias.
         *
         * @param {string} colors - The selected color alias.
         */
        const handleChangeColor = (colors) => {
            // Parse the current value from JSON
            const tempValue = JSON.parse(value);

            // Find the field associated with the selected color alias
            const filteredArray = frameHeaders.data.list.find(
                (item) => item.alias == colors,
            );

            // Get the data type of the selected color
            const colorDataType = filteredArray.dataType;

            // Initialize or update the '_state' property with the selected color and its data type
            tempValue["_state"] =
                tempValue["_state"] &&
                Object.keys(tempValue["_state"]).length > 0
                    ? tempValue["_state"]
                    : {};
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                color: colors,
                colorDataType: colorDataType,
            };

            // Update the color value in the state
            setColor(colors);

            // Convert the updated value back to a JSON string
            setValue(JSON.stringify(tempValue));

            // Update the data with the new option
            setData("option", tempValue);
        };
        /**
         * Updates the size settings based on the selected alias.
         *
         * @param {string} size - The selected size alias.
         */
        const handleChangeSize = (size) => {
            // Parse the current value from JSON
            const tempValue = JSON.parse(value);

            // Find the field associated with the selected size alias
            const filteredArray = frameHeaders.data.list.find(
                (item) => item.alias == size,
            );

            // Get the data type of the selected size
            const sizeDataType = filteredArray.dataType;

            // Initialize or update the '_state' property with the selected size and its data type
            tempValue["_state"] =
                tempValue["_state"] &&
                Object.keys(tempValue["_state"]).length > 0
                    ? tempValue["_state"]
                    : {};
            tempValue["_state"]["fields"] = {
                ...tempValue["_state"]["fields"],
                size: size,
                sizeDataType: sizeDataType,
            };

            // Update the size value in the state
            setSize(size);

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
            const tempValue = JSON.parse(value);

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
         * @param {string} segment - The segment to remove, can be 'label', 'latitude', 'longitude', 'size', 'color', or 'tooltip'.
         */
        const handleRemoveOption = (segment: string) => {
            // Parse the current value from JSON
            const tempValue = JSON.parse(value);

            // Switch on the segment to remove the correct field from the option object
            switch (segment) {
                case "label":
                    // Reset the label value in the state
                    setDataLabel("");
                    // Remove the label field from the option object
                    const newFields = { ...tempValue };
                    delete newFields["_state"]["fields"].label;
                    delete newFields["_state"]["fields"].labelDataType;
                    // Convert the updated value back to a JSON string
                    setValue(JSON.stringify(newFields));
                    // Update the data with the new option
                    setData("option", newFields);
                    break;
                case "Latitude":
                    // Reset the Latitude value in the state
                    setLatitudeValue("");
                    // Remove the Latitude field from the option object
                    const newLatitudeFields = { ...tempValue };
                    delete newLatitudeFields["_state"]["fields"].Latitude;
                    delete newLatitudeFields["_state"]["fields"]
                        .LatitudeDataType;
                    newLatitudeFields["Latitude"]["pixelName"] = ""; // Reset the Latitude pixel name
                    newLatitudeFields["Latitude"]["name"] = ""; // Reset the Latitude name
                    // Convert the updated value back to a JSON string
                    setValue(JSON.stringify(newLatitudeFields));
                    // Update the data with the new option
                    setData("option", newLatitudeFields);
                    break;
                case "Longitude":
                    // Reset the Longitude value in the state
                    setLongitudeValue("");
                    // Remove the Longitude field from the option object
                    const newLongitudeFields = { ...tempValue };
                    delete newLongitudeFields["_state"]["fields"].Longitude;
                    delete newLongitudeFields["_state"]["fields"]
                        .LongitudeDataType;
                    newLongitudeFields["Longitude"]["pixelName"] = ""; // Reset the Longitude pixel name
                    newLongitudeFields["Longitude"]["name"] = ""; // Reset the Longitude name
                    // Convert the updated value back to a JSON string
                    setValue(JSON.stringify(newLongitudeFields));
                    // Update the data with the new option
                    setData("option", newLongitudeFields);
                    break;
                case "size":
                    // Reset the size value in the state
                    setSize("");
                    // Remove the size field from the option object
                    const newSizeFields = { ...tempValue };
                    delete newSizeFields["_state"]["fields"].size;
                    delete newSizeFields["_state"]["fields"].sizeDataType;
                    // Convert the updated value back to a JSON string
                    setValue(JSON.stringify(newSizeFields));
                    // Update the data with the new option
                    setData("option", newSizeFields);
                    break;
                case "color":
                    // Reset the color value in the state
                    setColor("");
                    // Remove the color field from the option object
                    const newColorFields = { ...tempValue };
                    delete newColorFields["_state"]["fields"].color;
                    delete newColorFields["_state"]["fields"].colorDataType;
                    // Convert the updated value back to a JSON string
                    setValue(JSON.stringify(newColorFields));
                    // Update the data with the new option
                    setData("option", newColorFields);
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
                frameHeaders &&
                    setLabel(frameHeaders.data.list.map((item) => item.alias));

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
                    <BaseSettingSection label="Label">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data?.frame?.name === ""}
                            value={dataLabel ? dataLabel : ""}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value, reason) => {
                                // update the frame
                                if (reason === "clear")
                                    handleRemoveOption("label");
                                else handleChangeLabel(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select label"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="Latitude">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data?.frame?.name === ""}
                            value={latitudeValue ? latitudeValue : ""}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value, reason) => {
                                // update the frame
                                if (reason === "clear")
                                    handleRemoveOption("Latitude");
                                else handleChangeLatitude(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select Latitude"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="Longitude">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data?.frame?.name === ""}
                            value={longitudeValue ? longitudeValue : ""}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value, reason) => {
                                // update the frame
                                if (reason === "clear")
                                    handleRemoveOption("Longitude");
                                else handleChangeLongitude(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select Longitude"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="Size">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data?.frame?.name === ""}
                            value={size ? size : ""}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value, reason) => {
                                // update the frame
                                if (reason == "clear")
                                    handleRemoveOption("size");
                                else handleChangeSize(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select size"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        />
                    </BaseSettingSection>
                    <BaseSettingSection label="Color">
                        <Autocomplete
                            size="small"
                            fullWidth
                            multiple={false}
                            disabled={data?.frame?.name === ""}
                            value={color ? color : ""}
                            options={fields}
                            getOptionLabel={(option) => {
                                return option;
                            }}
                            onChange={(_, value, reason) => {
                                // update the frame
                                if (reason === "clear")
                                    handleRemoveOption("color");
                                else handleChangeColor(value);
                            }}
                            freeSolo={false}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select color"
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
                            disabled={data?.frame?.name === ""}
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
