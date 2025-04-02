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

const StyledButton = styled(Button)({
    left: "80%",
});

export const EditYAxisScatterPlot = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [showYaxis, setShowYaxis] = useState(true);
        const [value, setValue] = useState("");
        const [showYaxisTitle, setShowYaxisTitle] = useState(true);
        const [yaxisTitle, setYaxisTitle] = useState("");
        const [fontSizeYAxis, setFontSizeYAxis] = useState(12);
        const [fontSizeYAxisLabel, setFontSizeYAxisLabel] = useState(11);
        const [rotateYaxis, setRotateYaxis] = useState(0);
        const [showYaxisTick, setShowYaxisTick] = useState(false);
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
         * Reinitializes the Y-Axis features based on the provided options.
         * @param options The options to reinitialize the features with.
         */
        const reinitializeFeatures = (options) => {
            // Check if the y-axis property exists
            if (options.hasOwnProperty("yAxis")) {
                // Check if the show property exists
                if (options.yAxis && options.yAxis.hasOwnProperty("show")) {
                    // Update the showYaxis state
                    setShowYaxis(options["yAxis"]["show"]);
                }

                // Check if the axis tick show property exists
                if (
                    options.yAxis &&
                    options.yAxis.axisTick &&
                    options.yAxis.axisTick.hasOwnProperty("show")
                ) {
                    // Update the showYaxisTick state
                    setShowYaxisTick(options["yAxis"]["axisTick"]["show"]);
                }

                // Check if the axis label property exists
                if (options.yAxis && options.yAxis.axisLabel) {
                    // Update the rotateYaxis state
                    setRotateYaxis(options["yAxis"]["axisLabel"]["rotate"]);
                    // Update the showAxisLabel state
                    setShowAxisLabel(options["yAxis"]["axisLabel"]["show"]);
                    // Update the fontSizeYAxisLabel state
                    setFontSizeYAxisLabel(
                        options["yAxis"]["axisLabel"]["fontSize"],
                    );
                }

                // Check if the name text style font size exists
                if (
                    options.yAxis &&
                    options.yAxis.nameTextStyle &&
                    options.yAxis.nameTextStyle.hasOwnProperty("fontSize")
                ) {
                    // Update the fontSizeYAxis state
                    setFontSizeYAxis(
                        options["yAxis"]["nameTextStyle"]["fontSize"],
                    );
                }
            }
        };

        useEffect(() => {
            if (data.hasOwnProperty("option")) {
                retainYAxisTitle(data.option);
            }
        }, [data.option["yAxis"]["name"]]);

        /**
         * Checks if the y-axis property exists and if the name property exists.
         * If both conditions are true, it sets the yaxisTitle state to the value of the name property.
         * @param {Object} options - The options object to check.
         */
        const retainYAxisTitle = (options) => {
            if (options.hasOwnProperty("yAxis")) {
                // Check if the name property exists
                if (options.yAxis && options.yAxis.hasOwnProperty("name")) {
                    // Set the yaxisTitle state to the value of the name property
                    setYaxisTitle(data.option["yAxis"]["name"]);
                }
            }
        };

        /**
         * Handles the change event of the show Y-axis switch.
         * Updates the showYaxis state and the 'show' property of the yAxis object in the chart options.
         * @param  e - The change event.
         * @returns {void}
         */
        const showYAxis = (e) => {
            // Create a copy of the chart options
            const option = JSON.parse(value);
            // Toggle the showYaxis state
            setShowYaxis(!showYaxis);
            // Update the 'show' property of the yAxis object in the chart options
            option["yAxis"]["show"] = e.target.checked;
            // Save the updated chart options to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event of the show Y-axis title switch.
         * If the switch is checked, the y-axis title is set to the value of the pixelName property.
         * If the switch is unchecked, the y-axis title is set to an empty string.
         * The updated chart options are then saved to the state.
         * @param  e - The change event.
         * @returns {void}
         */
        const showYAxisTitle = (e) => {
            // Create a copy of the chart options
            const option = JSON.parse(value);
            // Toggle the showYaxisTitle state
            setShowYaxisTitle(!showYaxisTitle);
            // Update the y-axis title based on the switch state
            option["yAxis"]["name"] =
                option["yAxis"]["name"] == ""
                    ? option["yAxis"]["pixelName"]
                    : "";
            // Save the updated chart options to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event of the Y-axis title input field.
         * Updates the yaxisTitle state and the 'name' property of the yAxis object in the chart options.
         * @param  e - The change event.
         * @returns {void}
         */
        const handleYaxisTitleChange = (e) => {
            // Update the yaxisTitle state
            setYaxisTitle(e.target.value);
            // Create a copy of the chart options
            const option = JSON.parse(value);
            // Update the 'name' property of the yAxis object in the chart options
            option["yAxis"]["name"] = e.target.value;
            // Save the updated chart options to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event of the Y-axis font size input field.
         * Updates the fontSizeYAxis state and the 'fontSize' property of the 'nameTextStyle' object in the yAxis object in the chart options.
         * @param  e - The change event.
         * @returns {void}
         */
        const handleChangeYAxisFontSize = (e) => {
            // Create a copy of the chart options
            const option = JSON.parse(value);
            // Update the fontSizeYAxis state
            setFontSizeYAxis(e.target.valueAsNumber);
            // Update the 'fontSize' property of the 'nameTextStyle' object in the yAxis object in the chart options
            option["yAxis"]["nameTextStyle"]["fontSize"] =
                e.target.valueAsNumber;
            // Save the updated chart options to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event of the Y-axis label font size input field.
         * Updates the fontSizeYAxisLabel state and the 'fontSize' property of the 'axisLabel' object in the yAxis object in the chart options.
         * @param e - The change event.
         * @returns {void}
         */
        const handleChangeYAxisLabelFontSize = (e) => {
            // Create a copy of the chart options
            const option = JSON.parse(value);
            // Update the fontSizeYAxisLabel state
            setFontSizeYAxisLabel(e.target.value);
            // Update the 'fontSize' property of the 'axisLabel' object in the yAxis object in the chart options
            option["yAxis"]["axisLabel"]["fontSize"] = e.target.value;
            // Save the updated chart options to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event for rotating the Y-axis labels.
         * Updates the rotateYaxis state and the 'rotate' property of the 'axisLabel' object in the yAxis object in the chart options.
         * @param e - The change event.
         */
        const rotateYAxis = (e) => {
            // Parse the current chart options from the state value
            const option = JSON.parse(value);
            // Update the rotateYaxis state with the new rotation value
            setRotateYaxis(e.target.value);
            // Set the 'rotate' property of the 'axisLabel' object in the yAxis to the new value
            option["yAxis"]["axisLabel"]["rotate"] = e.target.value;
            // Save the updated chart options back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event of the Y-axis tick show checkbox.
         * Updates the showYaxisTick state and the 'show' property of the 'axisTick' object in the yAxis object in the chart options.
         * @param e - The change event.
         */
        const showYAxisTick = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Parse the current chart options from the state value
            const option = JSON.parse(value);
            // Update the showYaxisTick state with the new value
            setShowYaxisTick(!showYaxisTick);
            // Set the 'show' property of the 'axisTick' object in the yAxis to the new value
            option["yAxis"]["axisTick"]["show"] = e.target.checked;
            // Save the updated chart options back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Handles the change event of the Y-axis label show checkbox.
         * Updates the showYAxisLabel state and the 'show' property of the 'axisLabel' object in the yAxis object in the chart options.
         * @param e - The change event.
         */
        const showYAxisLabel = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Parse the current chart options from the state value
            const option = JSON.parse(value);
            // Update the showYAxisLabel state with the new value
            setShowAxisLabel(!showAxisLabel);
            // Set the 'show' property of the 'axisLabel' object in the yAxis to the new value
            option["yAxis"]["axisLabel"]["show"] = e.target.checked;
            // Save the updated chart options back to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };

        /**
         * Resets the Y-axis options to their default values.
         * This function is called when the user clicks the "Reset" button.
         * It updates the state of the Y-axis options and saves the updated chart options to the state.
         * @returns {void}
         */
        const Reset = () => {
            const option = JSON.parse(value);
            // Update the state of the Y-axis options
            setShowYaxis(option["reset"]["axis"]["yaxis"]["show"]);
            setShowYaxisTitle(true);
            setYaxisTitle(option["yAxis"]["pixelName"]);
            setFontSizeYAxis(
                option["reset"]["axis"]["yaxis"]["nameTextStyle"]["fontSize"],
            );
            setFontSizeYAxisLabel(
                option["reset"]["axis"]["yaxis"]["axisLabel"]["fontSize"],
            );
            setRotateYaxis(
                option["reset"]["axis"]["yaxis"]["axisLabel"]["rotate"],
            );
            setShowYaxisTick(
                option["reset"]["axis"]["yaxis"]["axisTick"]["show"],
            );
            setShowAxisLabel(
                option["reset"]["axis"]["yaxis"]["axisLabel"]["show"],
            );
            // Update the Y-axis options in the chart options
            option["yAxis"]["show"] = option["reset"]["axis"]["yaxis"]["show"];
            option["yAxis"]["name"] = option["yAxis"]["pixelName"];
            option["yAxis"]["nameTextStyle"]["fontSize"] =
                option["reset"]["axis"]["yaxis"]["nameTextStyle"]["fontSize"];
            option["yAxis"]["axisLabel"]["fontSize"] =
                option["reset"]["axis"]["yaxis"]["axisLabel"]["fontSize"];
            option["yAxis"]["axisLabel"]["rotate"] =
                option["reset"]["axis"]["yaxis"]["axisLabel"]["rotate"];
            option["yAxis"]["axisTick"]["show"] =
                option["reset"]["axis"]["yaxis"]["axisTick"]["show"];
            option["yAxis"]["axisLabel"]["show"] =
                option["reset"]["axis"]["yaxis"]["axisLabel"]["show"];
            // Save the updated chart options to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        return (
            <StyledAxis>
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showYaxis}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showYAxis(e)
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
                        checked={showYaxisTitle}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showYAxisTitle(e)
                        }
                        title="Show Axis Title"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Show Axis Title
                    </StyledTypography>
                </StyledAxisDiv>
                {showYaxisTitle && (
                    <StyledAxis>
                        <StyledAxisColDiv
                            display="flex"
                            justifyContent="flex-start"
                        >
                            <Typography variant="body2">
                                Set Y Axis Title
                            </Typography>
                            <StyledTextField
                                id="xaxis-title"
                                value={yaxisTitle}
                                size="small"
                                onChange={(e) => handleYaxisTitleChange(e)}
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
                                value={fontSizeYAxis}
                                onChange={(e) => handleChangeYAxisFontSize(e)}
                            />
                        </StyledAxisColDiv>
                    </StyledAxis>
                )}
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showAxisLabel}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showYAxisLabel(e)
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
                            justifyContent="flex-start"
                        >
                            <Typography variant="body2">
                                Edit Label Font Size
                            </Typography>
                            <TextField
                                id="xaxis-edit-title-font-size"
                                type="number"
                                size="small"
                                value={fontSizeYAxisLabel}
                                onChange={(e) =>
                                    handleChangeYAxisLabelFontSize(e)
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
                                value={rotateYaxis}
                                valueLabelDisplay="auto"
                                onChange={(e) => rotateYAxis(e)}
                            />
                        </StyledAxisColDiv>
                    </StyledAxis>
                )}
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showYaxisTick}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showYAxisTick(e)
                        }
                        title="Show Axis Line Ticks"
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
