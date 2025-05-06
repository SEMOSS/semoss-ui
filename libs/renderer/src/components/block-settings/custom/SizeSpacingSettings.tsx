import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import {
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    InputAdornment,
    IconButton,
} from "@semoss/ui";
import { SelectAll } from "@mui/icons-material";
import { SvgIcon } from "@mui/material";
import { Paths, PathValue } from "../../../types";
import { useBlockSettings, useBlocks } from "../../../hooks";
import { ActionMessages, Block, BlockDef } from "../../../store";
import { getValueByPath } from "../../../utility";
import { BaseSettingSection } from "../BaseSettingSection";

/**
 * Used for Margin and Padding style settings that utilize a size number, ex width and height
 * Supports % and px units for size
 * Can customize left, top, right, bottom sizes
 */

interface SizeSpacingSettingsProps<D extends BlockDef = BlockDef> {
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

const SIZE_VALUE_TYPES = ["em", "px", "%"] as const;

export const SizeSpacingSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = "",
        path,
    }: SizeSpacingSettingsProps<D>) => {
        const { state } = useBlocks();
        const { data, setData } = useBlockSettings<D>(id);

        //set the value of all sides
        const [customView, setCustomView] = useState(false);

        // track the value
        const [parsed, setParsed] = useState<{
            unit: "%" | "px" | "em" | "";
            left: string;
            top: string;
            right: string;
            bottom: string;
        }>({
            unit: "",
            left: "",
            top: "",
            right: "",
            bottom: "",
        });

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
            const p: typeof parsed = {
                unit: "",
                left: "",
                top: "",
                right: "",
                bottom: "",
            };

            // get the unit
            if (computedValue.includes("%")) {
                p.unit = "%";
            } else if (computedValue.includes("px")) {
                p.unit = "px";
            } else if (computedValue.includes("em")) {
                p.unit = "em";
            }

            console.log({ computedValue });

            //check if the computed value has spaces
            if (p.unit) {
                const amount = computedValue.replace(/\D+/g, "");
                const parts = amount.split(" ");

                if (JSON.stringify(computedValue).indexOf(" ") == 1) {
                    p.top = parts[0];
                    p.bottom = parts[0];
                    p.left = parts[1];
                    p.right = parts[1];
                } else if (JSON.stringify(computedValue).indexOf(" ") == 2) {
                    p.top = parts[0];
                    p.left = parts[1];
                    p.right = parts[1];
                    p.bottom = parts[2];
                } else if (JSON.stringify(computedValue).indexOf(" ") == 3) {
                    p.top = parts[0];
                    p.right = parts[1];
                    p.bottom = parts[2];
                    p.left = parts[3];
                } else {
                    p.left = amount;
                    p.top = amount;
                    p.right = amount;
                    p.bottom = amount;
                }
            } else {
                p.left = computedValue;
                p.top = computedValue;
                p.right = computedValue;
                p.bottom = computedValue;
            }

            setParsed(p);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (
            amount: string,
            sideType: string,
            unit: "%" | "px" | "em" | "",
        ) => {
            // updated the parsed value
            if (customView) {
                switch (sideType) {
                    case "top":
                        setParsed({
                            unit: unit,
                            top: amount,
                            bottom: amount,
                            left: parsed.left,
                            right: parsed.right,
                        });
                        break;
                    case "bottom":
                        setParsed({
                            unit: unit,
                            top: parsed.top,
                            bottom: amount,
                            left: parsed.left,
                            right: parsed.right,
                        });
                        break;
                    case "left":
                        setParsed({
                            unit: unit,
                            top: parsed.top,
                            bottom: parsed.bottom,
                            left: amount,
                            right: parsed.right,
                        });
                        break;
                    case "right":
                        setParsed({
                            unit: unit,
                            top: parsed.top,
                            bottom: parsed.bottom,
                            left: parsed.left,
                            right: amount,
                        });
                        break;
                }
            } else {
                switch (sideType) {
                    case "top":
                        setParsed({
                            unit: unit,
                            top: amount,
                            bottom: amount,
                            left: parsed.left,
                            right: parsed.right,
                        });
                        break;
                    case "left":
                        setParsed({
                            unit: unit,
                            top: parsed.top,
                            bottom: parsed.bottom,
                            left: amount,
                            right: amount,
                        });
                        break;
                }
            }

            if (sideType == "unit") {
                setParsed({
                    unit: unit,
                    top: parsed.top,
                    bottom: parsed.bottom,
                    left: parsed.left,
                    right: parsed.right,
                });
            }

            // get value with unit for setting data
            const v = unit
                ? parsed.top +
                  unit +
                  " " +
                  parsed.left +
                  unit +
                  " " +
                  parsed.right +
                  unit +
                  " " +
                  parsed.bottom +
                  unit
                : amount;
            console.log({ parsed });

            // clear the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(path, v as PathValue<D["data"], typeof path>);
                    // emit event to resize the block on the screen
                    state.dispatch({
                        message: ActionMessages.DISPATCH_EVENT,
                        payload: {
                            name: "blockResized",
                        },
                    });
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection label={label} wide>
                {customView ? (
                    <>
                        <TextField
                            fullWidth
                            value={parsed.left}
                            id={label + "-left"}
                            onChange={(e) => {
                                // sync the data on change
                                onChange(e.target.value, "left", parsed.unit);
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SvgIcon>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <line
                                                    x1="5"
                                                    y1="5"
                                                    x2="5"
                                                    y2="19"
                                                    stroke="black"
                                                    strokeWidth="2"
                                                />
                                                <path
                                                    d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z"
                                                    fill="black"
                                                />
                                            </svg>
                                        </SvgIcon>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            value={parsed.top}
                            id={label + "-top"}
                            onChange={(e) => {
                                // sync the data on change
                                onChange(e.target.value, "top", parsed.unit);
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SvgIcon>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <line
                                                    x1="5"
                                                    y1="5"
                                                    x2="19"
                                                    y2="5"
                                                    stroke="black"
                                                    strokeWidth="2"
                                                />
                                                <path
                                                    d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z"
                                                    fill="black"
                                                />
                                            </svg>
                                        </SvgIcon>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            value={parsed.right}
                            id={label + "-right"}
                            onChange={(e) => {
                                // sync the data on change
                                onChange(e.target.value, "right", parsed.unit);
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SvgIcon>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z"
                                                    fill="black"
                                                />
                                                <line
                                                    x1="19"
                                                    y1="5"
                                                    x2="19"
                                                    y2="19"
                                                    stroke="black"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        </SvgIcon>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            value={parsed.bottom}
                            id={label + "-bottom"}
                            onChange={(e) => {
                                // sync the data on change
                                onChange(e.target.value, "bottom", parsed.unit);
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SvgIcon>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <line
                                                    x1="5"
                                                    y1="19"
                                                    x2="19"
                                                    y2="19"
                                                    stroke="black"
                                                    strokeWidth="2"
                                                />
                                                <path
                                                    d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z"
                                                    fill="black"
                                                />
                                            </svg>
                                        </SvgIcon>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </>
                ) : (
                    <>
                        <TextField
                            fullWidth
                            value={parsed.left}
                            id={label + "-leftRight"}
                            onChange={(e) => {
                                // sync the data on change
                                onChange(e.target.value, "left", parsed.unit);
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SvgIcon>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <line
                                                    x1="6"
                                                    y1="5"
                                                    x2="6"
                                                    y2="19"
                                                    stroke="black"
                                                    strokeWidth="2"
                                                />
                                                <path
                                                    d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z"
                                                    fill="black"
                                                />
                                                <line
                                                    x1="18"
                                                    y1="5"
                                                    x2="18"
                                                    y2="19"
                                                    stroke="black"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        </SvgIcon>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            value={parsed.top}
                            id={label + "-topBottom"}
                            onChange={(e) => {
                                // sync the data on change
                                onChange(e.target.value, "top", parsed.unit);
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SvgIcon>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <line
                                                    x1="5"
                                                    y1="5"
                                                    x2="19"
                                                    y2="5"
                                                    stroke="black"
                                                    strokeWidth="2"
                                                />
                                                <path
                                                    d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z"
                                                    fill="black"
                                                />
                                                <line
                                                    x1="5"
                                                    y1="19"
                                                    x2="19"
                                                    y2="19"
                                                    stroke="black"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        </SvgIcon>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </>
                )}
                <ToggleButtonGroup value={parsed.unit} exclusive size="small">
                    {SIZE_VALUE_TYPES.map((unit) => {
                        return (
                            <ToggleButton
                                key={unit}
                                value={unit}
                                color={
                                    parsed.unit === unit ? "primary" : undefined
                                }
                                onClick={() => {
                                    onChange("", "unit", unit);
                                }}
                            >
                                {unit}
                            </ToggleButton>
                        );
                    })}
                </ToggleButtonGroup>
                <IconButton
                    onClick={() => setCustomView(!customView)}
                    color={customView ? "primary" : "default"}
                    data-testId={"sizeSpacingSetting-button-allSides"}
                >
                    <SelectAll />
                </IconButton>
            </BaseSettingSection>
        );
    },
);
