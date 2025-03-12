import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { styled, Switch, Typography, Slider } from "@semoss/ui";
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
    left: "3px",
}));

const StyledTypography = styled(Typography)({
    paddingLeft: "10px",
});

export const StackChartBarStyle = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [barWidth, setBarWidth] = useState(10);
        const [flipAxis, setFlipAxis] = useState(false);
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
         * Reinitializes the features of the tooltip based on the provided options.
         * @param options The options to reinitialize the features with.
         */
        const reinitializeFeatures = (options: any) => {
            if (options.hasOwnProperty("barWidth")) {
                setBarWidth(options["barWidth"]);
            }
            if (options.hasOwnProperty("flipAxis")) {
                setFlipAxis(options["flipAxis"]);
            }
        };
        // this function is used to set the barWidth of the stack chart
        const stackbarWidth = (e) => {
            let option = JSON.parse(value);
            setBarWidth(e.target.value);
            option["barWidth"] = e.target.value;
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        // this function is used to flip the axis of the stack chart
        const flipAxisStack = (e: ChangeEvent<HTMLInputElement>) => {
            let option = JSON.parse(value);
            setFlipAxis(e.target.checked);
            option["flipAxis"] = e.target.checked;
            if (e.target.checked === true) {
                option["xAxis"]["name"] = option["yAxis"]["flipAxisName"];
                option["yAxis"]["name"] = option["xAxis"]["flipAxisName"];
                option["xAxis"]["pixelName"] = option["yAxis"]["axisName"];
                option["yAxis"]["pixelName"] = option["xAxis"]["axisName"];
                option["xAxis"]["type"] = "value";
                option["yAxis"]["type"] = "category";
            } else {
                option["xAxis"]["name"] = option["xAxis"]["flipAxisName"];
                option["yAxis"]["name"] = option["yAxis"]["flipAxisName"];
                option["xAxis"]["pixelName"] = option["xAxis"]["axisName"];
                option["yAxis"]["pixelName"] = option["yAxis"]["axisName"];
                option["xAxis"]["type"] = "category";
                option["yAxis"]["type"] = "value";
            }
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        return (
            <StyledAxis>
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <Typography variant="body2">Bar Width</Typography>
                    <Slider
                        size="small"
                        min={0}
                        max={40}
                        value={barWidth}
                        valueLabelDisplay="auto"
                        marks={[
                            { value: 0, label: "0" },
                            { value: 40, label: "40" },
                        ]}
                        onChange={(e) => stackbarWidth(e)}
                    />
                </StyledAxisColDiv>
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={flipAxis}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            flipAxisStack(e)
                        }
                        title="Show Tooltip"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Flip Axis
                    </StyledTypography>
                </StyledAxisDiv>
            </StyledAxis>
        );
    },
);
