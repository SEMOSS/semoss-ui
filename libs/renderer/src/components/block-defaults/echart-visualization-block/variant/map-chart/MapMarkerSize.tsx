import { useBlockSettings } from "../../../../../hooks";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";
import {
    MenuItem,
    Select,
    styled,
    Switch,
    TextField,
    Typography,
} from "@semoss/ui";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
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
}));

const StyledAxisColDiv = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "0.5rem",
}));

export const MapMarkerSize = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [markerSize, setMarkerSize] = useState(5);
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
                // Check if the symbol size exists
                if (options.series[0].hasOwnProperty("symbolSize")) {
                    // Update the symbol size
                    setMarkerSize(options["series"][0]["symbolSize"]);
                }
            }
        };
        /**
         * Handles the change event for the symbol size input.
         * @param e The event that triggered this function.
         */
        const handleChangeSymbolSize = (e) => {
            // Parse the current value to a JSON object
            const option = JSON.parse(value);
            // Update the symbol size to the selected value
            setMarkerSize(e.target.value);
            // Set the symbol size in the JSON object
            option["series"][0]["symbolSize"] = e.target.value;
            option["symbolSize"] = e.target.value;
            // Update the data with the new symbol size option
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        return (
            <StyledAxisDiv>
                <StyledAxisColDiv display="flex" justifyContent="space-around">
                    <Typography variant="body2">Marker Size</Typography>
                    <TextField
                        id="Symbol Size"
                        size="small"
                        value={markerSize}
                        onChange={handleChangeSymbolSize}
                    />
                </StyledAxisColDiv>
            </StyledAxisDiv>
        );
    },
);
