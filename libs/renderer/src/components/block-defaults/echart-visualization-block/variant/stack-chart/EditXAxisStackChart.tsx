import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";

import {
    Button,
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

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));

const StyledTypography = styled(Typography)({
    paddingLeft: "10px",
});

export const EditXAxisStackChart = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [showXaxis, setShowXaxis] = useState(true);
        const [value, setValue] = useState("");
        const [showXaxisTitle, setShowXaxisTitle] = useState(true);
        const [xaxisTitle, setXaxisTitle] = useState("");
        const [fontSizeXAxis, setFontSizeXAxis] = useState(12);
        const [fontSizeXAxisLabel, setFontSizeXAxisLabel] = useState(11);
        const [rotateXaxis, setRotateXaxis] = useState(0);
        const [showXaxisTick, setShowXaxisTick] = useState(false);
        const [showAxisLabel, setShowAxisLabel] = useState(true);
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
         * Reinitializes the features of the x-axis based on the provided options
         * @param options The options to reinitialize the features with
         */
        const reinitializeFeatures = (options) => {
            // Check if the x-axis show property exists
            if (options.hasOwnProperty("xAxis")) {
                // Check if the show property exists
                if (options.xAxis && options.xAxis.hasOwnProperty("show")) {
                    // Update the showXaxis state
                    setShowXaxis(options["xAxis"]["show"]);
                }

                // Check if the name property exists
                if (options.xAxis && options.xAxis.hasOwnProperty("name")) {
                    // Update the showXaxisTitle state
                    setShowXaxisTitle(
                        options["xAxis"]["name"] == "" ? false : true,
                    );
                }

                // Check if the axis tick show property exists
                if (
                    options.xAxis &&
                    options.xAxis.axisTick &&
                    options.xAxis.axisTick.hasOwnProperty("show")
                ) {
                    // Update the showXaxisTick state
                    setShowXaxisTick(options["xAxis"]["axisTick"]["show"]);
                }

                // Check if the axis label show property exists
                if (options.xAxis && options.xAxis.axisLabel) {
                    // Update the rotateXaxis state
                    setRotateXaxis(options["xAxis"]["axisLabel"]["rotate"]);
                    // Update the showAxisLabel state
                    setShowAxisLabel(options["xAxis"]["axisLabel"]["show"]);
                    // Update the fontSizeXAxisLabel state
                    setFontSizeXAxisLabel(
                        options["xAxis"]["axisLabel"]["fontSize"],
                    );
                }

                // Check if the name text style exists
                if (
                    options.xAxis &&
                    options.xAxis.nameTextStyle &&
                    options.xAxis.nameTextStyle.hasOwnProperty("fontSize")
                ) {
                    // Update the fontSizeXAxis state
                    setFontSizeXAxis(
                        options["xAxis"]["nameTextStyle"]["fontSize"],
                    );
                }
            }
        };

        useEffect(() => {
            if (data.hasOwnProperty("option")) {
                retainXAxisTitle(data.option);
            }
        }, [data.option["xAxis"]["name"]]);

        /**
         * @name retainXAxisTitle
         * @function
         * @description A function that checks if the data option has an xAxis property and if the xAxis property has a name property.
         *              If both conditions are true, it sets the xaxisTitle state to the value of the name property.
         * @param {Object} options - The data option object
         * @returns {void}
         */
        const retainXAxisTitle = (options) => {
            if (options.hasOwnProperty("xAxis")) {
                if (options.xAxis && options.xAxis.hasOwnProperty("name")) {
                    setXaxisTitle(data.option["xAxis"]["name"]);
                }
            }
        };

        /**
         * @name showXAxis
         * @function
         * @description A function that toggles the visibility of the x-axis.
         *              If the x-axis is visible, it sets the showXaxis state to false.
         *              If the x-axis is not visible, it sets the showXaxis state to true.
         *              It also updates the show property of the x-axis in the data option.
         * @param {ChangeEvent<HTMLInputElement>} e - The event object
         * @returns {void}
         */
        const showXAxis = (e: ChangeEvent<HTMLInputElement>) => {
            const option = JSON.parse(value);
            setShowXaxis(!showXaxis);
            option["xAxis"]["show"] = e.target.checked;
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * @name showXAxisTitle
         * @function
         * @description A function that toggles the visibility of the x-axis title.
         *              If the x-axis title is visible, it sets the showXaxisTitle state to false.
         *              If the x-axis title is not visible, it sets the showXaxisTitle state to true.
         *              It also updates the x-axis title in the data option.
         * @param {ChangeEvent<HTMLInputElement>} e - The event object
         * @returns {void}
         */
        const showXAxisTitle = (e) => {
            const option = JSON.parse(value);
            setShowXaxisTitle(!showXaxisTitle);
            option["xAxis"]["name"] =
                option["xAxis"]["name"] == ""
                    ? option["xAxis"]["pixelName"]
                    : "";
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * @name handleXaxisTitleChange
         * @function
         * @description A function that updates the x-axis title in the data option.
         *              It is called when the user changes the value of the x-axis title input field.
         * @param {ChangeEvent<HTMLInputElement>} e - The event object
         * @returns {void}
         */
        const handleXaxisTitleChange = (e) => {
            // Update the xaxisTitle state
            setXaxisTitle(e.target.value);
            // Parse the data option
            const option = JSON.parse(value);
            // Update the x-axis title in the data option
            option["xAxis"]["name"] = e.target.value;
            option["xAxis"]["flipAxisName"] = e.target.value;
            // Set the data option with the updated title
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * @name handleChangeXAxisFontSize
         * @function
         * @description A function that updates the font size of the x-axis title.
         *              It is called when the user changes the value of the x-axis title font size input field.
         * @param {ChangeEvent<HTMLInputElement>} e - The event object
         * @returns {void}
         */
        const handleChangeXAxisFontSize = (e) => {
            // Parse the data option
            const option = JSON.parse(value);
            // Update the fontSizeXAxis state
            setFontSizeXAxis(e.target.value);
            // Update the font size of the x-axis title in the data option
            option["xAxis"]["nameTextStyle"]["fontSize"] = e.target.value;
            // Set the data option with the updated font size
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * @name handleChangeXAxisLabelFontSize
         * @function
         * @description A function that updates the font size of the x-axis label.
         *              It is called when the user changes the value of the x-axis label font size input field.
         * @param {ChangeEvent<HTMLInputElement>} e - The event object
         * @returns {void}
         */
        const handleChangeXAxisLabelFontSize = (e) => {
            // Parse the data option
            const option = JSON.parse(value);
            // Update the fontSizeXAxisLabel state
            setFontSizeXAxisLabel(e.target.value);
            // Update the font size of the x-axis label in the data option
            option["xAxis"]["axisLabel"]["fontSize"] = e.target.value;
            // Set the data option with the updated font size
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * @name rotateXAxis
         * @function
         * @description Updates the rotation angle of the x-axis labels based on the user's input.
         * @param {ChangeEvent<HTMLInputElement>} e - The event object containing the new rotation angle for the x-axis labels.
         * @returns {void}
         */
        const rotateXAxis = (e) => {
            // Parse the current data option from the JSON string
            const option = JSON.parse(value);

            // Update the rotateXaxis state with the new value from the event
            setRotateXaxis(e.target.value);

            // Update the rotation angle of the x-axis labels in the data option
            option["xAxis"]["axisLabel"]["rotate"] = e.target.value;

            // Save the updated data option back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * @name showXAxisTick
         * @function
         * @description Toggles the visibility of the x-axis tick marks.
         *              Updates the showXaxisTick state and the data option accordingly.
         * @param {ChangeEvent<HTMLInputElement>} e - The event object
         * @returns {void}
         */
        const showXAxisTick = (e: ChangeEvent<HTMLInputElement>) => {
            // Parse the current data option from the JSON string
            const option = JSON.parse(value);

            // Toggle the showXaxisTick state
            setShowXaxisTick(!showXaxisTick);

            // Update the visibility of the x-axis tick marks in the data option
            option["xAxis"]["axisTick"]["show"] = e.target.checked;

            // Save the updated data option back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * @name showXAxisLabel
         * @function
         * @description Toggles the visibility of the x-axis labels.
         *              Updates the showAxisLabel state and the data option accordingly.
         * @param {ChangeEvent<HTMLInputElement>} e - The event object
         * @returns {void}
         */
        const showXAxisLabel = (e: ChangeEvent<HTMLInputElement>) => {
            // Parse the current data option from the JSON string
            const option = JSON.parse(value);

            // Toggle the showAxisLabel state
            setShowAxisLabel(!showAxisLabel);

            // Update the visibility of the x-axis labels in the data option
            option["xAxis"]["axisLabel"]["show"] = e.target.checked;

            // Save the updated data option back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * @name Reset
         * @function
         * @description Resets the x-axis settings to their default values based on the 'reset' configuration.
         *              Updates the states and data options accordingly.
         * @returns {void}
         */
        const Reset = () => {
            // Parse the current data option from the JSON string
            const option = JSON.parse(value);

            // Reset the show state of the x-axis
            setShowXaxis(option["reset"]["axis"]["xaxis"]["show"]);
            // Always show the x-axis title
            setShowXaxisTitle(true);
            // Set the x-axis title based on the default pixel name
            setXaxisTitle(option["xAxis"]["pixelName"]);
            // Set the font size for the x-axis title
            setFontSizeXAxis(
                option["reset"]["axis"]["xaxis"]["nameTextStyle"]["fontSize"],
            );
            // Set the font size for the x-axis labels
            setFontSizeXAxisLabel(
                option["reset"]["axis"]["xaxis"]["axisLabel"]["fontSize"],
            );
            // Rotate the x-axis labels based on the reset configuration
            setRotateXaxis(
                option["reset"]["axis"]["xaxis"]["axisLabel"]["rotate"],
            );
            // Reset the show state of the x-axis tick marks
            setShowXaxisTick(
                option["reset"]["axis"]["xaxis"]["axisTick"]["show"],
            );
            // Reset the show state of the x-axis labels
            setShowAxisLabel(
                option["reset"]["axis"]["xaxis"]["axisLabel"]["show"],
            );

            // Update the data option with the reset x-axis settings
            option["xAxis"]["show"] = option["reset"]["axis"]["xaxis"]["show"];
            option["xAxis"]["name"] = option["xAxis"]["pixelName"];
            option["xAxis"]["flipAxisName"] = option["xAxis"]["pixelName"];
            option["xAxis"]["nameTextStyle"]["fontSize"] =
                option["reset"]["axis"]["xaxis"]["nameTextStyle"]["fontSize"];
            option["xAxis"]["axisLabel"]["fontSize"] =
                option["reset"]["axis"]["xaxis"]["axisLabel"]["fontSize"];
            option["xAxis"]["axisLabel"]["rotate"] =
                option["reset"]["axis"]["xaxis"]["axisLabel"]["rotate"];
            option["xAxis"]["axisTick"]["show"] =
                option["reset"]["axis"]["xaxis"]["axisTick"]["show"];
            option["xAxis"]["axisLabel"]["show"] =
                option["reset"]["axis"]["xaxis"]["axisLabel"]["show"];

            // Save the updated data option back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        return (
            <StyledAxis>
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showXaxis}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showXAxis(e)
                        }
                        title="Show/Hide Axis"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Show/Hide Axis
                    </StyledTypography>
                </StyledAxisDiv>
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showXaxisTitle}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showXAxisTitle(e)
                        }
                        title="Show Axis Title"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Show Axis Title
                    </StyledTypography>
                </StyledAxisDiv>
                {showXaxisTitle && (
                    <StyledAxis>
                        <StyledAxisColDiv
                            display="flex"
                            justifyContent="space-around"
                        >
                            <Typography variant="body2">
                                Set X Axis Title
                            </Typography>
                            <StyledTextField
                                id="xaxis-title"
                                value={xaxisTitle}
                                size="small"
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    handleXaxisTitleChange(e)
                                }
                            />
                        </StyledAxisColDiv>
                        <StyledAxisColDiv
                            display="flex"
                            justifyContent="space-around"
                        >
                            <Typography variant="body2">
                                Edit Axis Title Font Size
                            </Typography>
                            <TextField
                                id="xaxis-edit-title-font-size"
                                type="number"
                                size="small"
                                value={fontSizeXAxis}
                                onChange={(e) => handleChangeXAxisFontSize(e)}
                            />
                        </StyledAxisColDiv>
                    </StyledAxis>
                )}

                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showAxisLabel}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showXAxisLabel(e)
                        }
                        title="Show Labels"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Show Labels
                    </StyledTypography>
                </StyledAxisDiv>
                {showAxisLabel && (
                    <StyledAxis>
                        <StyledAxisColDiv
                            display="flex"
                            justifyContent="space-around"
                        >
                            <Typography variant="body2">
                                Edit Label Font Size
                            </Typography>
                            <TextField
                                id="xaxis-edit-title-font-size"
                                type="number"
                                size="small"
                                value={fontSizeXAxisLabel}
                                onChange={(e) =>
                                    handleChangeXAxisLabelFontSize(e)
                                }
                            />
                        </StyledAxisColDiv>
                        <StyledAxisColDiv
                            display="flex"
                            justifyContent="space-around"
                        >
                            <Typography variant="body2">
                                Rotate Labels
                            </Typography>
                            <Slider
                                size="small"
                                min={0}
                                max={360}
                                value={rotateXaxis}
                                valueLabelDisplay="auto"
                                marks={[
                                    { value: 0, label: "0" },
                                    { value: 360, label: "360" },
                                ]}
                                onChange={(e) => rotateXAxis(e)}
                            />
                        </StyledAxisColDiv>
                    </StyledAxis>
                )}
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showXaxisTick}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showXAxisTick(e)
                        }
                        title="Show/Hide Axis"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Show Axis Line Ticks
                    </StyledTypography>
                </StyledAxisDiv>
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
