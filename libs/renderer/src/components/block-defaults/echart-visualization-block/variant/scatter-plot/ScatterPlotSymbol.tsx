import { useEffect, useMemo, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";

import {
    MenuItem,
    Select,
    styled,
    Switch,
    TextField,
    Typography,
} from "@semoss/ui";

import { Block, BlockDef } from "../../../../../store";
import { useBlockSettings } from "../../../../../hooks";
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

export const ScatterPlotSymbol = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [symbolShape, setSymbolShape] = useState("circle");
        const [symbolSize, setSymbolSize] = useState(15);
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
         * Reinitializes the features of the scatter plot based on the provided options.
         * @param options The options to reinitialize the features with.
         */
        const reinitializeFeatures = (options) => {
            if (options.hasOwnProperty("series")) {
                // Check if the symbol type exists
                if (options.series[0].hasOwnProperty("symbol")) {
                    // Update the symbol shape
                    setSymbolShape(options["series"][0]["symbol"]);
                }
                // Check if the symbol size exists
                if (options.series[0].hasOwnProperty("symbolSize")) {
                    // Update the symbol size
                    setSymbolSize(options["series"][0]["symbolSize"]);
                }
            }
        };
        /**
         * Handles the change event of the symbol shape select box.
         * @param e The event that triggered this function.
         */
        const handleSymbolShape = (e) => {
            // Update the symbol shape to the selected value
            setSymbolShape(e.target.value);
            // Parse the value of the input to a JSON object
            const option = JSON.parse(value);
            // Update the symbol shape in the JSON object
            option["series"][0]["symbol"] = e.target.value;
            // Set the JSON object back to the input field
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        /**
         * Handles the change event for the symbol size input.
         * @param e The event that triggered this function.
         */
        const handleChangeSymbolSize = (e) => {
            // Parse the current value to a JSON object
            const option = JSON.parse(value);
            // Update the symbol size to the selected value
            setSymbolSize(e.target.value);
            // Set the symbol size in the JSON object
            option["series"][0]["symbolSize"] = e.target.value;
            // Update the data with the new symbol size option
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        return (
            <StyledAxis>
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <Typography variant="body2" color="secondary">
                        Symbol Shape
                    </Typography>
                    <Select
                        name="Symbol Shape"
                        value={symbolShape}
                        onChange={handleSymbolShape}
                        size="small"
                    >
                        <MenuItem value="circle">Circle</MenuItem>
                        <MenuItem value="rect">Rectangle</MenuItem>
                        <MenuItem value="roundRect">Round Rectangle</MenuItem>
                        <MenuItem value="triangle">traingle</MenuItem>
                        <MenuItem value="arrow">Arrow</MenuItem>
                        <MenuItem value="pin">Pin</MenuItem>
                        <MenuItem value="diamond">Diamond</MenuItem>
                    </Select>
                </StyledAxisColDiv>
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <Typography variant="body2" color="secondary">
                        Symbol Size
                    </Typography>
                    <TextField
                        id="Symbol Size"
                        size="small"
                        value={symbolSize}
                        onChange={handleChangeSymbolSize}
                    />
                </StyledAxisColDiv>
            </StyledAxis>
        );
    },
);
