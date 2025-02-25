import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { styled, Tooltip, Typography, Stack } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import { Switch } from "@semoss/ui";

import { Paths, PathValue } from "../../../types";
import { useBlockSettings } from "../../../hooks";
import { Block, BlockDef } from "../../../store";
import { getValueByPath } from "../../../utility";

interface SwitchSettingsProps<D extends BlockDef = BlockDef> {
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

    resetValueOnChange?: boolean;

    /**
     * Desciption that will show on tooltip, to inform user about the setting
     */
    description?: string;
}

const StyledTypography = styled(Typography)(() => ({
    overflowWrap: "break-word",
    whiteSpace: "normal",
}));

export const SwitchSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = "",
        description = "",
        path,
        resetValueOnChange = false,
    }: SwitchSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState<boolean>(false);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return false;
                }

                const v = getValueByPath(data, path);
                if (typeof v === "undefined") {
                    return false;
                } else if (typeof v === "string") {
                    return v === "true";
                } else if (typeof v === "boolean") {
                    return v;
                }

                return JSON.stringify(v) === "true";
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: boolean) => {
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
                    if (resetValueOnChange) {
                        setData(
                            "value" as Paths<Block<D>["data"], 4>,
                            undefined,
                        );
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <div>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    marginTop="8px"
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.5}
                        width="100%"
                    >
                        <StyledTypography variant="body2">
                            {label}
                        </StyledTypography>
                        {description && (
                            <Tooltip placement="top" title={description} arrow>
                                <HelpOutlineIcon
                                    color="action"
                                    sx={{
                                        fontSize: 15,
                                        marginLeft: "5px", // Small margin to separate tooltip from label
                                    }}
                                />
                            </Tooltip>
                        )}
                    </Stack>
                    <Stack
                        direction="row"
                        justifyContent="end"
                        height="16px"
                        alignItems="center"
                    >
                        <Switch
                            checked={value}
                            onChange={() => {
                                // sync the data on change
                                onChange(!value);
                            }}
                            size="small"
                        />
                    </Stack>
                </Stack>
            </div>
        );
    },
);
