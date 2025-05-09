import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { TextField } from "@semoss/ui";
import { InputAdornment, Typography } from "@mui/material";
import { Paths, PathValue } from "../../../types";
import { useBlockSettings, useBlocks } from "../../../hooks";
import { ActionMessages, BlockDef, Block } from "../../../store";
import { getValueByPath } from "../../../utility";
import { BaseSettingSection } from "../BaseSettingSection";

/**
 * Used for any style settings that utilize a size number
 * No unit ('px') functionality required, only a number input.
 */
interface NumberInputProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label to pass into the input
     */
    label: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>["data"], 4>;
}

export const InputNumberSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label,
        path,
    }: NumberInputProps<D>) => {
        const { state } = useBlocks();
        const { data, setData } = useBlockSettings<D>(id);
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const computedRawValue = useMemo(() => {
            return computed(() => {
                const v = getValueByPath(data, path);
                return typeof v === "undefined" ? "" : v;
            });
        }, [data, path]).get();

        const [input, setInput] = useState(computedRawValue);

        useEffect(() => {
            setInput(computedRawValue);
        }, [computedRawValue]);

        const onChange = (val: string) => {
            // Convert the input value to a number
            const numericValue = Number(val);
            // Check if the input value is empty after trimming whitespace
            const isEmpty = val.trim() === "";

            // If the value is not empty and is either not a number or less than 0, exit the function
            if (!isEmpty && (isNaN(numericValue) || numericValue < 0)) return;

            // Update the input state with the current value
            setInput(val);

            // Clear the previous timeout if it exists to debounce the input
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set a new timeout to delay the update of the data
            timeoutRef.current = setTimeout(() => {
                // Update the data at the specified path with the numeric value
                setData(
                    path,
                    numericValue as PathValue<D["data"], typeof path>,
                );

                // Dispatch an event to indicate that the block has been resized
                state.dispatch({
                    message: ActionMessages.DISPATCH_EVENT,
                    payload: { name: "blockResized" },
                });
            }, 300); // 300 ms debounce delay
        };

        return (
            <BaseSettingSection label={label} wide>
                <TextField
                    fullWidth
                    value={input}
                    onChange={(e) => onChange(e.target.value)}
                    size="small"
                    variant="outlined"
                    placeholder="Enter a number"
                    autoComplete="off"
                    inputProps={{ inputMode: "numeric" }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Typography
                                    variant="body2"
                                    fontSize={13}
                                    fontWeight={600}
                                    color="#0000008A"
                                ></Typography>
                            </InputAdornment>
                        ),
                    }}
                />
            </BaseSettingSection>
        );
    },
);
