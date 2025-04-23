import { useEffect, useMemo, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";

import { styled, Switch, TextField, Typography } from "@semoss/ui";

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
const StyledAxis = styled("div")<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
}));

const StyledAxisColDiv = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "8px 16px",
    gap: "8px",
}));

export const ScatterPlotChartTitle = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [chartTitle, setChartTitle] = useState("");
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
         * Reinitializes the chart features based on the provided options.
         * @param {Object} options - The options to reinitialize the chart features with.
         */
        const reinitializeFeatures = (options) => {
            // Check if the title property exists
            if (options.hasOwnProperty("title")) {
                // Check if the text property of the title exists
                if (options.title.hasOwnProperty("text")) {
                    // Update the chartTitle state
                    setChartTitle(options["title"]["text"]);
                }
            }
        };
        /**
         * Handles the change event of the chart title input field.
         * Updates the chartTitle state and the 'text' property of the title object in the chart options.
         * @param  e - The change event.
         * @returns {void}
         */
        const handleChartTitle = (e) => {
            // Update the chartTitle state
            setChartTitle(e.target.value);
            // Create a copy of the chart options
            const option = JSON.parse(value);
            // Update the 'text' property of the title object in the chart options
            option["title"]["text"] = e.target.value;
            // Save the updated chart options to the state
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        return (
            <StyledAxis>
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <Typography variant="body2" color="secondary">
                        Chart Title
                    </Typography>
                    <TextField
                        id="Chart Title"
                        size="small"
                        value={chartTitle}
                        onChange={(e) => {
                            handleChartTitle(e);
                        }}
                    />
                </StyledAxisColDiv>
            </StyledAxis>
        );
    },
);
