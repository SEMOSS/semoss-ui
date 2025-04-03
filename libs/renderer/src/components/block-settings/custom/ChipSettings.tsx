//React and Third Party Libraries
import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { Autocomplete, Chip, Stack, TextField } from "@mui/material";
import { Face } from "@mui/icons-material";

//Internal Semoss libs
import { Avatar } from "@semoss/ui";

//Modules internal to current package
import { Paths, PathValue } from "../../../types";
import { useBlocks, useBlockSettings } from "../../../hooks";
import { ActionMessages, Block, BlockDef } from "../../../store";
import { getValueByPath } from "../../../utility";
import { BaseSettingSection } from "../BaseSettingSection";

interface ChipSettingsProps<D extends BlockDef = BlockDef> {
    id: string;
    path: Paths<Block<D>["data"], 4>;
    label: string;
    options?: Array<{ value: string; display: string }>;
    resizeOnSet?: boolean;
}

export const ChipSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
        options,
        resizeOnSet = false,
    }: ChipSettingsProps<D>) => {
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

        const [ChipValue, setChipValue] = useState("");
        const [selectedChipType, setSelectedChipType] = useState("");

        const handleChipChange = (chip, e) => {
            setChipValue(e.target.value);
            setData(chip.toLowerCase(), e.target.value);
        };

        return (
            <Stack width="100%">
                <BaseSettingSection label={label}>
                    <Stack flexDirection="column" width="100%">
                        <Autocomplete
                            fullWidth
                            size="small"
                            value={value}
                            onChange={(_, newValue) => {
                                onChange(newValue);
                                setSelectedChipType(newValue);
                            }}
                            options={options.map((option) => option.value)}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Stack
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        {(() => {
                                            switch (option) {
                                                case "Chip":
                                                    return (
                                                        <Chip label={option} />
                                                    );
                                                case "Icon":
                                                    return (
                                                        <Chip
                                                            label={option}
                                                            icon={<Face />}
                                                        />
                                                    );
                                                case "Avatar":
                                                    return (
                                                        <Chip
                                                            label={option}
                                                            avatar={
                                                                <Avatar>
                                                                    A
                                                                </Avatar>
                                                            }
                                                        />
                                                    );
                                                case "Link":
                                                    return (
                                                        <Chip label={option} />
                                                    );
                                                default:
                                                    return (
                                                        <Chip label={option} />
                                                    );
                                            }
                                        })()}
                                    </Stack>
                                </li>
                            )}
                            renderInput={(params) => <TextField {...params} />}
                            disablePortal
                            disableClearable
                        />
                        {selectedChipType &&
                            (selectedChipType === "Avatar" ||
                                selectedChipType === "Link") && (
                                <TextField
                                    fullWidth
                                    value={ChipValue}
                                    onChange={(e) =>
                                        handleChipChange(selectedChipType, e)
                                    }
                                    size="small"
                                    variant="outlined"
                                    autoComplete="off"
                                    placeholder={`${selectedChipType} value`}
                                    sx={{ mt: 1 }}
                                />
                            )}
                    </Stack>
                </BaseSettingSection>
            </Stack>
        );
    },
);
