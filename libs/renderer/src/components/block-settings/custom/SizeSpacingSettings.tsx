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
import VeritcalPaddingIcon from "../../../assets/containerBlock/VerticalPaddingIcon.svg";
import HorizontalPaddingIcon from "../../../assets/containerBlock/HorizontalPaddingIcon.svg";
import BottomPaddingIcon from "../../../assets/containerBlock/BottomPaddingIcon.svg";
import TopPaddingIcon from "../../../assets/containerBlock/TopPaddingIcon.svg";
import LeftPaddingIcon from "../../../assets/containerBlock/LeftPaddingIcon.svg";
import RightPaddingIcon from "../../../assets/containerBlock/RightPaddingIcon.svg";
import PaddingButton from "../../../assets/containerBlock/PaddingButton.svg";

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
            left?: string;
            top?: string;
            right?: string;
            bottom?: string;
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

            //check if the computed value has spaces
            if (p.unit) {
                //remove the units from the computed value, keep numbers and spaces
                const amount = JSON.stringify(computedValue).replace(
                    /[^0-9\s]/g,
                    "",
                );
                const parts = amount.split(" ");

                //determine which sides have value based on spacing
                //i.e. padding: "8px 5px 10px"
                if (amount.match(/\s/g)) {
                    if (amount.match(/\s/g).length == 1) {
                        p.top = parts[0];
                        p.bottom = parts[0];
                        p.left = parts[1];
                        p.right = parts[1];
                    } else if (amount.match(/\s/g).length == 2) {
                        p.top = parts[0];
                        p.left = parts[1];
                        p.right = parts[1];
                        p.bottom = parts[2];
                    } else if (amount.match(/\s/g).length == 3) {
                        p.top = parts[0];
                        p.right = parts[1];
                        p.bottom = parts[2];
                        p.left = parts[3];
                    }
                } else {
                    p.top = amount;
                    p.right = amount;
                    p.bottom = amount;
                    p.left = amount;
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
            type: string,
            unit: "%" | "px" | "em" | "",
        ) => {
            //value to set
            let v;

            // updated the parsed value
            if (customView) {
                switch (type) {
                    case "top":
                        setParsed({
                            unit: unit,
                            top: amount,
                            bottom: parsed.bottom,
                            left: parsed.left,
                            right: parsed.right,
                        });
                        v =
                            amount +
                            unit +
                            " " +
                            parsed.right +
                            unit +
                            " " +
                            parsed.bottom +
                            unit +
                            " " +
                            parsed.left +
                            unit;
                        break;
                    case "bottom":
                        setParsed({
                            unit: unit,
                            bottom: amount,
                            top: parsed.top,
                            left: parsed.left,
                            right: parsed.right,
                        });
                        v =
                            parsed.top +
                            unit +
                            " " +
                            parsed.right +
                            unit +
                            " " +
                            amount +
                            unit +
                            " " +
                            parsed.left +
                            unit;
                        break;
                    case "left":
                        setParsed({
                            unit: unit,
                            left: amount,
                            top: parsed.top,
                            bottom: parsed.bottom,
                            right: parsed.right,
                        });
                        v =
                            parsed.top +
                            unit +
                            " " +
                            parsed.right +
                            unit +
                            " " +
                            parsed.bottom +
                            unit +
                            " " +
                            amount +
                            unit;
                        break;
                    case "right":
                        setParsed({
                            unit: unit,
                            right: amount,
                            top: parsed.top,
                            bottom: parsed.bottom,
                            left: parsed.left,
                        });
                        v =
                            parsed.top +
                            unit +
                            " " +
                            amount +
                            unit +
                            " " +
                            parsed.bottom +
                            unit +
                            " " +
                            parsed.left +
                            unit;
                        break;
                }
            } else {
                switch (type) {
                    case "top":
                        setParsed({
                            unit: unit,
                            left: parsed.left,
                            right: parsed.right,
                            top: amount,
                            bottom: amount,
                        });
                        v =
                            parsed.top +
                            unit +
                            " " +
                            parsed.right +
                            unit +
                            " " +
                            parsed.bottom +
                            unit +
                            " " +
                            amount +
                            unit;
                        break;
                    case "left":
                        setParsed({
                            unit: unit,
                            left: amount,
                            right: amount,
                            top: parsed.top,
                            bottom: parsed.bottom,
                        });
                        v =
                            parsed.top +
                            unit +
                            " " +
                            amount +
                            unit +
                            " " +
                            parsed.bottom +
                            unit +
                            " " +
                            amount +
                            unit;
                        break;
                    default:
                        break;
                }
            }

            if (type == "unit") {
                setParsed({
                    unit: unit,
                    top: parsed.top,
                    bottom: parsed.bottom,
                    left: parsed.left,
                    right: parsed.right,
                });
            }

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
                                        <img src={LeftPaddingIcon.toString()} />
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
                                        <img src={TopPaddingIcon.toString()} />
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
                                        <img
                                            src={RightPaddingIcon.toString()}
                                        />
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
                                        <img
                                            src={BottomPaddingIcon.toString()}
                                        />
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
                                        <img
                                            src={HorizontalPaddingIcon.toString()}
                                        />
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
                                        <img
                                            src={VeritcalPaddingIcon.toString()}
                                        />
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
                    data-testid={"sizeSpacingSetting-button-allSides"}
                >
                    <img src={PaddingButton.toString()} />
                </IconButton>
            </BaseSettingSection>
        );
    },
);
