import { useState, useEffect, useMemo, useRef } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { Sync } from "@mui/icons-material";

import { Autocomplete, IconButton, styled, TextField } from "@semoss/ui";

import { BaseSettingSection } from "../../../../block-settings/BaseSettingSection";
import { Fields } from "../line-chart/Fields";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import {
    useBlockSettings,
    useBlocksPixel,
    useFrameHeaders,
} from "../../../../../hooks";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";

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
const EmptyContainer = styled("div")(() => ({
    paddingBottom: "20px",
    paddingLeft: "20px",
    paddingRight: "10px",
}));
export const FrameOperationsLine = observer(
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
        /**
         * Reinitializes the states of the fields to the default values.
         * @param state The state to reinitialize from.
         */
        const reinitializeStates = (state: {
            Label?: string[];
            Value?: string[];
            tooltip?: string[];
        }) => {
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
        }, [id]);
        return (
            <>
                <EmptyContainer>
                    <BaseSettingSection label="Frame">
                        <Autocomplete
                            fullWidth
                            multiple={false}
                            disabled={getFrames.status !== "SUCCESS"}
                            value={
                                data?.frame?.name == ""
                                    ? null
                                    : data?.frame?.name
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
                        <IconButton
                            size="small"
                            onClick={() => syncBlockData()}
                        >
                            <Sync />
                        </IconButton>
                    </BaseSettingSection>
                </EmptyContainer>
                <Fields id={id} path={"option"} />
            </>
        );
    },
);
