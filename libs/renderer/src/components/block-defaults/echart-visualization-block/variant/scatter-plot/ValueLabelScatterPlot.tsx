import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

import {
    Button,
    MenuItem,
    Select,
    Slider,
    styled,
    Switch,
    TextField,
    Typography,
} from "@semoss/ui";

import { useBlockSettings } from "../../../../../hooks";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";
import { ColorPickerSettings } from "../../../../block-settings/shared/ColorPickerSettings";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    path: Paths<Block<D>["data"], 4>;
}
const StyledAxisDiv = styled("div")<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "0.5rem",
    marginLeft: "4px",
}));
const StyledAxis = styled("div")<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "0.5rem",
}));

const StyledAxisColDiv = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "0.5rem",
    position: "relative",
    right: "3px",
}));

const StyledTypography = styled(Typography)({
    paddingLeft: "10px",
});

const StyledButton = styled(Button)({
    left: "80%",
});

export const ValueLabelScatterPlot = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [showLabel, setShowLabel] = useState(true);
        const [labelPosition, setLabelPosition] = useState("top");
        const [labelRotation, setLabelRotation] = useState(0);
        const [labelFont, setLabelFont] = useState("sans-serif");
        const [labelFontSize, setLabelFontSize] = useState(12);
        const [labelColor, setLabelColor] = useState("#000000");

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
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue, data]);

        useEffect(() => {
            if (data.hasOwnProperty("option")) {
                reinitializeFeatures(data.option);
            }
        }, [id]);

        /**
         * Reinitializes the label features based on the provided options.
         * @param options The options to reinitialize the label features with.
         */
        const reinitializeFeatures = (options) => {
            // Check if the x-axis property exists
            if (options.hasOwnProperty("xAxis")) {
                // Check if the series property exists
                if (options.hasOwnProperty("series")) {
                    // Check if the label property exists in the first series
                    if (options.series[0].hasOwnProperty("label")) {
                        // Update the label position state
                        setLabelPosition(
                            options["series"][0]["label"]["position"],
                        );
                        // Update the label rotation state
                        setLabelRotation(
                            options["series"][0]["label"]["rotate"],
                        );
                        // Update the label font family state
                        setLabelFont(
                            options["series"][0]["label"]["fontFamily"],
                        );
                        // Update the label font size state
                        setLabelFontSize(
                            options["series"][0]["label"]["fontSize"],
                        );
                        // Update the show label state
                        setShowLabel(options["series"][0]["label"]["show"]);
                        setLabelColor(options["series"][0]["label"]["color"]);
                    }
                }
            }
        };

        /**
         * Handles the switch change event for the value labels by toggling the showLabel state and updating the label options in the data.
         * @param e The switch change event.
         */
        const showValueLabel = (e) => {
            const parsedValue = JSON.parse(value);
            // Toggle the showLabel state
            setShowLabel(!showLabel);
            // Update the 'show' property of the 'label' object in the series to the new value
            parsedValue["series"][0]["label"]["show"] = e.target.checked;
            // Save the updated chart options back to the state
            setData(path, parsedValue as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event for the value label position by updating the label position state and the label options in the data.
         * @param e The change event.
         */
        const handleValuePosition = (e) => {
            // Update the label position state
            setLabelPosition(e.target.value);
            // Parse the value to a JSON object
            let option = JSON.parse(value);
            // Update the 'position' property of the 'label' object in the series to the new value
            option["series"][0]["label"]["position"] = e.target.value;
            // Save the updated chart options back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event for the value label rotation by updating the label rotation state and the label options in the data.
         * @param e The change event.
         */
        const handleChangelabelRotation = (e) => {
            // Parse the value to a JSON object
            let option = JSON.parse(value);
            // Update the label rotation state
            setLabelRotation(e.target.value);
            // Update the 'rotate' property of the 'label' object in the series to the new value
            option["series"][0]["label"]["rotate"] = e.target.value;
            // Save the updated chart options back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event for the value label font family by updating the label font family state and the label options in the data.
         * @param e The change event.
         */
        const handlelabelFont = (e) => {
            // Update the label font family state
            setLabelFont(e.target.value);
            // Parse the value to a JSON object
            let option = JSON.parse(value);
            // Update the 'fontFamily' property of the 'label' object in the series to the new value
            option["series"][0]["label"]["fontFamily"] = e.target.value;
            // Save the updated chart options back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event for the label font size by updating the label font size state and the label options in the data.
         * @param e The change event.
         */
        const handleLabelSize = (e) => {
            // Parse the value to a JSON object
            let option = JSON.parse(value);
            // Update the label font size state
            setLabelFontSize(e.target.value);
            // Update the 'fontSize' property of the 'label' object in the series to the new value
            option["series"][0]["label"]["fontSize"] = e.target.value;
            // Save the updated chart options back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Resets the label options to their default values.
         * This function is called when the user clicks the "Reset" button.
         * It updates the state of the label options and saves the updated chart options to the state.
         * @returns {void}
         */
        const Reset = () => {
            let option = JSON.parse(value);

            // Update the state of the label position
            setLabelPosition(option["reset"]["label"]["position"]);

            // Update the state of the label rotation
            setLabelRotation(option["reset"]["label"]["rotate"]);

            // Update the state of the label font family
            setLabelFont(option["reset"]["label"]["fontFamily"]);

            // Update the state of the label font size
            setLabelFontSize(option["reset"]["label"]["fontSize"]);

            // Update the state of the label show
            setShowLabel(option["reset"]["label"]["show"]);

            // Update the label options in the series to the new values
            option["series"][0]["label"]["show"] =
                option["reset"]["label"]["show"];
            option["series"][0]["label"]["position"] =
                option["reset"]["label"]["position"];
            option["series"][0]["label"]["rotate"] =
                option["reset"]["label"]["rotate"];
            option["series"][0]["label"]["fontFamily"] =
                option["reset"]["label"]["fontFamily"];
            option["series"][0]["label"]["fontSize"] =
                option["reset"]["label"]["fontSize"];
            option["series"][0]["label"]["color"] =
                option["reset"]["label"]["color"];

            // Save the updated chart options back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        return (
            <StyledAxis>
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showLabel}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showValueLabel(e)
                        }
                        title="Show Labels"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Show Labels
                    </StyledTypography>
                </StyledAxisDiv>
                {showLabel && (
                    <StyledAxis>
                        <StyledAxisColDiv
                            display="flex"
                            justifyContent="space-around"
                        >
                            <Typography variant="body2">
                                Choose a Position For Value Label
                            </Typography>
                            <Select
                                name="Choose a position for the Label"
                                value={labelPosition}
                                onChange={handleValuePosition}
                                size="small"
                            >
                                <MenuItem value="top">Top</MenuItem>
                                <MenuItem value="left">Left</MenuItem>
                                <MenuItem value="right">Right</MenuItem>
                                <MenuItem value="bottom">Bottom</MenuItem>
                                <MenuItem value="inside">Inside</MenuItem>
                                <MenuItem value="insideLeft">
                                    Inside Left
                                </MenuItem>
                                <MenuItem value="insideRight">
                                    Inside Right
                                </MenuItem>
                                <MenuItem value="insideBottom">
                                    Inside Bottom
                                </MenuItem>
                                <MenuItem value="insideTop">
                                    Inside Top
                                </MenuItem>
                            </Select>
                        </StyledAxisColDiv>
                        <StyledAxisColDiv
                            display="flex"
                            justifyContent="space-around"
                        >
                            <Typography variant="body2">
                                Rotate Value Label
                            </Typography>
                            <Slider
                                size="small"
                                min={0}
                                max={360}
                                value={labelRotation}
                                valueLabelDisplay="auto"
                                marks={[
                                    { value: 0, label: "0" },
                                    { value: 360, label: "360" },
                                ]}
                                onChange={(e) => handleChangelabelRotation(e)}
                            />
                        </StyledAxisColDiv>
                        <StyledAxisColDiv
                            display="flex"
                            justifyContent="space-around"
                        >
                            <Typography variant="body2">Select Font</Typography>
                            <Select
                                name="Select Font"
                                value={labelFont}
                                onChange={handlelabelFont}
                                size="small"
                            >
                                <MenuItem value="sans-serif">
                                    sans-serif
                                </MenuItem>
                                <MenuItem value="serif">serif</MenuItem>
                                <MenuItem value="monospace">monospace</MenuItem>
                            </Select>
                        </StyledAxisColDiv>

                        <StyledAxisColDiv
                            display="flex"
                            justifyContent="space-around"
                        >
                            <Typography variant="body2">
                                Select Font Size
                            </Typography>
                            <TextField
                                id="Select Font Size"
                                size="small"
                                value={labelFontSize}
                                onChange={handleLabelSize}
                            />
                        </StyledAxisColDiv>
                        <ColorPickerSettings
                            id={id}
                            path={"option.series.0.label.color"}
                            colorValue={labelColor}
                            onChange={(e) => {}}
                        ></ColorPickerSettings>
                    </StyledAxis>
                )}
                <StyledAxisDiv display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={Reset}
                    >
                        Reset
                    </Button>
                </StyledAxisDiv>
            </StyledAxis>
        );
    },
);
