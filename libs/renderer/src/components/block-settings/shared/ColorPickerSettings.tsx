import { useEffect, useMemo, useRef, useState, MouseEvent } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { SketchPicker } from "react-color";
import { OutlinedInput } from "@mui/material";

import { IconButton, InputAdornment, Popover, styled } from "@semoss/ui";

import { Paths, PathValue } from "../../../types";
import { useBlockSettings } from "../../../hooks";
import { getValueByPath } from "../../../utility";
import { Block, BlockDef } from "../../../store";
interface ColorPickerSettingProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>["data"], 4>;
    colorValue: string;
    onChange: (color: string) => void;
}

const StyledSketchContainer = styled(SketchPicker)({
    ".custom-sketch-picker .flexbox-fix::before": {
        marginLeft: "32px",
        display: "block",
        fontSize: "12px",
        fontWeight: "bold",
        color: "black",
    },
    ".custom-sketch-picker .flexbox-fix:last-child div": {
        width: "24px !important" /* Set the width of the color circle */,
        height: "24px !important" /* Set the height of the color circle */,
        borderRadius: "50% !important" /* Makes only preset colors circular */,
        overflow: "hidden",
    },
});
const StyledMainContainer = styled("div")({});
const StyledSpanSection = styled("span")(({ color }) => ({
    backgroundColor: color,
    width: "33px",
    height: "33px",
    borderRadius: "20%",
    display: "block",
    border: "1px solid #000",
}));
export const ColorPickerSettings = observer<ColorPickerSettingProps>(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        colorValue = "#000000",
        onChange,
    }) => {
        const [showPopover, setShowPopover] =
            useState<HTMLButtonElement | null>(null); //show and hide the color picker
        const [color, setColor] = useState(colorValue); //default color and state to maintain color value
        const { data, setData } = useBlockSettings<any>(id); //data to update the color of the chart
        const [value, setValue] = useState<string | null>(null); //local state to store a copy of main state
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null); //timeout ref to delay update of state
        const optiontimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        const [colorPickerState, setColorPickerState] = useState<
            "initial" | "updated"
        >("initial");
        const optionPathVal = "option";
        const [optionValue, setOptionValue] = useState(data.option);
        //get the latest value of state and store it in computedValue
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
        const optionComputedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, optionPathVal);
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, optionPathVal]).get();
        useEffect(() => {
            setOptionValue(optionComputedValue);
        }, [optionComputedValue]);
        //close the color picker when color picker is visible
        function handleClose() {
            setShowPopover(null);
        }
        //update the local state value, when computed value is changed
        useEffect(() => {
            setValue(computedValue);
            if (colorPickerState === "updated") {
                updateLatestChartDetail();
            }
        }, [computedValue]);

        function updateLatestChartDetail() {
            if (optiontimeoutRef.current) {
                clearTimeout(optiontimeoutRef.current);
                optiontimeoutRef.current = null;
            }
            optiontimeoutRef.current = setTimeout(() => {
                try {
                    const options = JSON.parse(optionComputedValue);
                    options["lastUpdatedTime"] = Date.now();
                    setData(
                        optionPathVal,
                        options as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        //update run state update, when color value is changed
        function runStateUpdateCustom(option) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(path, option as PathValue<D["data"], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        //detect the current state of popover and update to open variable
        const open = Boolean(showPopover);
        return (
            <StyledMainContainer>
                <label htmlFor="outlined-adornment-password">
                    Select Colour
                </label>
                <OutlinedInput
                    id="outlined-adornment-password"
                    placeholder="Select Colour"
                    aria-label="Select Colour"
                    type={"text"}
                    value={value}
                    style={{ width: "100%" }}
                    onChange={(e) => {
                        setColor(e.target.value);
                        runStateUpdateCustom(e.target.value);
                        setColorPickerState("updated");
                    }}
                    endAdornment={
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={"select colour"}
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                    if (showPopover) setShowPopover(null);
                                    else setShowPopover(e.currentTarget);
                                }}
                                edge="end"
                            >
                                <StyledSpanSection
                                    color={value}
                                ></StyledSpanSection>
                            </IconButton>
                        </InputAdornment>
                    }
                    label="Select Colour"
                />
                <Popover
                    id={id}
                    open={open}
                    anchorEl={showPopover}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                    }}
                >
                    <StyledSketchContainer
                        onChange={(newColor) => {
                            setColor(newColor.hex);
                            runStateUpdateCustom(newColor.hex);
                            onChange(newColor.hex);
                            setColorPickerState("updated");
                        }}
                        color={value}
                    ></StyledSketchContainer>
                </Popover>
            </StyledMainContainer>
        );
    },
);
