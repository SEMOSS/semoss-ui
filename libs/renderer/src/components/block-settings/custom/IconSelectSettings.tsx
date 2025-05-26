import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { Paths, PathValue } from "../../../types";
import { useBlocks, useBlockSettings } from "../../../hooks";
import { ActionMessages, Block, BlockDef } from "../../../store";
import { getValueByPath } from "../../../utility";
import { BaseSettingSection } from "../BaseSettingSection";
import { Autocomplete, TextField } from "@mui/material";
import { iconMap } from "../../../constants";

interface IconSelectSettingsProps<D extends BlockDef = BlockDef> {
    id: string;
    path: Paths<Block<D>["data"], 4>;
    label: string;
    options: Array<{ value: string; display: string }>;
    /** Whether we should dispatch an event to the designer to update the frame around the block */
    resizeOnSet?: boolean;
}

export const inputOptions = Object.keys(iconMap).map((key) => ({
    value: key,
    display: key,
}));

export const IconSelectSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
        options,
        resizeOnSet = false,
    }: IconSelectSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);
        const { state } = useBlocks();

        const [autocompleteOptions, setAutocompleteOptions] = useState<
            Array<string>
        >([]);

        useEffect(() => {
            setAutocompleteOptions(options.map((option) => option.value));
        }, [options]);

        // track the value
        const [value, setValue] = useState("");

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

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

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value
            setValue(value);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(path, value as PathValue<D["data"], typeof path>);
                    if (resizeOnSet) {
                        // emit event to resize the block on the screen
                        state.dispatch({
                            message: ActionMessages.DISPATCH_EVENT,
                            payload: {
                                name: "blockResized",
                            },
                        });
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const displayIcon = (key: string) => {
            const Icon = iconMap[key];
            return <Icon />;
        };

        return (
            <BaseSettingSection label={label}>
                <Autocomplete
                    fullWidth
                    size="small"
                    value={value}
                    onChange={(_, newValue) => {
                        onChange(newValue);
                    }}
                    options={options.map((option) => option.value)}
                    renderOption={(props, option) => (
                        <li {...props}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                {displayIcon(option)}
                                {options.find(
                                    (element) => element.value === option,
                                )?.display ?? option}
                            </div>
                        </li>
                    )}
                    renderInput={(params) => <TextField {...params} />}
                    disablePortal
                    disableClearable
                />
            </BaseSettingSection>
        );
    },
);
