import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";

import {
    Slider,
    styled,
    Switch,
    TextField,
    Typography,
    Select,
    Button,
} from "@semoss/ui";

import { useBlockSettings } from "../../../../../hooks";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";
import { FontFamily, Pie_Alignment } from "../../Visualization.constants";
import { ColorPickerSettings } from "../../../../block-settings/shared/ColorPickerSettings";

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
const StyledButton = styled(Button)({
    left: "80%",
});
const StyledAxisColDiv = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "0.5rem",
}));
const StyledAxisSpan = styled("span")<{
    display?: string;
    justifyContent?: string;
    width?: string;
}>(({ theme, display, justifyContent, width }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    width: width ?? undefined,
}));
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));
const StyledSelect = styled(Select)(() => ({
    width: "100%",
}));
export const PieValueLabel = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [showValueLabel, setShowValueLabel] = useState(true);
        const [valueLabel, setvalueLabel] = useState({
            position: "outside",
            size: 8,
            lineLength: 8,
            family: "",
            rotate: 0,
            rotateLabelMinValue: 0,
            rotateLabelMaxValue: 360,
            color: "#000000",
        });

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
                reInitializeFeatures(data.option);
            }
        }, [id]);
        useEffect(() => {
            if (data.hasOwnProperty("option")) {
                retainLocalState(data.option);
            }
        }, [showValueLabel]);
        //Retain the local state of the feature on toggle switch and on reset button
        //With the local state we will be displaying the values in the fields
        const retainLocalState = (options) => {
            setvalueLabel((prev) => ({
                ...prev,
                position: options["series"][0]["label"]["position"],
                size: options["series"][0]["label"]["fontSize"],
                lineLength: options["series"][0]["labelLine"]["length"],
                family: options["series"][0]["label"]["fontFamily"],
                rotate: options["series"][0]["label"]["rotate"],
            }));
        };
        //Reinitialize the feature when the chart is loaded
        const reInitializeFeatures = (options) => {
            setShowValueLabel(options["series"][0]["label"].show ?? true);
        };
        //Handle the change event for any Value Label input
        function handleInputChange(title, inputValue) {
            let option = JSON.parse(value);
            if (title === "showValueLabel") {
                option["series"][0]["label"].show = inputValue;
                setShowValueLabel(inputValue);
            } else if (title === "labelPosition") {
                option["series"][0]["label"]["position"] = inputValue;
                setvalueLabel((prev) => ({
                    ...prev,
                    position: inputValue,
                }));
            } else if (title === "labelRotate") {
                option["series"][0]["label"]["rotate"] = inputValue;
                setvalueLabel((prev) => ({
                    ...prev,
                    rotate: inputValue,
                }));
            } else if (title === "labelSize") {
                option["series"][0]["label"]["fontSize"] = inputValue;
                setvalueLabel((prev) => ({
                    ...prev,
                    size: inputValue,
                }));
            } else if (title === "labelLength") {
                option["series"][0]["labelLine"]["length"] = inputValue;
                setvalueLabel((prev) => ({
                    ...prev,
                    lineLength: inputValue,
                }));
            } else if (title === "labelFamily") {
                option["series"][0]["label"]["fontFamily"] = inputValue;
                setvalueLabel((prev) => ({
                    ...prev,
                    family: inputValue,
                }));
            }
            setData(path, option as PathValue<D["data"], typeof path>);
        }
        //Retain the local state of the feature on reset button
        //The default values are set in the reset object in the option
        function handleReset() {
            let option = JSON.parse(value);
            option["series"][0]["label"].show =
                option["reset"]["label"]["show"];
            option["series"][0]["label"]["position"] =
                option["reset"]["label"]["position"];
            option["series"][0]["label"]["rotate"] =
                option["reset"]["label"]["rotate"];
            option["series"][0]["label"]["fontSize"] =
                option["reset"]["label"]["fontSize"];
            option["series"][0]["labelLine"]["length"] =
                option["reset"]["labelLine"]["length"];
            option["series"][0]["label"]["fontFamily"] =
                option["reset"]["label"]["fontFamily"];
            option["series"][0]["label"]["color"] =
                option["reset"]["label"]["color"];
            setData(path, option as PathValue<D["data"], typeof path>);
            retainLocalState(option);
        }
        return (
            <StyledAxisDiv>
                <StyledAxisDiv display="flex" justifyContent="space-around">
                    <Switch
                        checked={showValueLabel}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(
                                "showValueLabel",
                                e.target.checked,
                            )
                        }
                        title="Show Value Label"
                    />
                    <label>Show Value Label</label>
                </StyledAxisDiv>
                {showValueLabel && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="value-name">
                            Choose a position for Value Label
                        </label>
                        <StyledSelect
                            id="position"
                            name="position"
                            value={valueLabel?.position}
                            onChange={(e) =>
                                handleInputChange(
                                    "labelPosition",
                                    e.target.value,
                                )
                            }
                        >
                            <Select.Item key="-1" value="">
                                Select
                            </Select.Item>
                            {Pie_Alignment.map((label, index) => {
                                return (
                                    <Select.Item value={label} key={index}>
                                        {label}
                                    </Select.Item>
                                );
                            })}
                        </StyledSelect>
                    </StyledAxisColDiv>
                )}
                {showValueLabel && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="rotate-label">
                            Rotate Value Label:
                        </label>
                        <Slider
                            aria-label="Always visible"
                            value={valueLabel.rotate}
                            min={valueLabel.rotateLabelMinValue}
                            max={valueLabel.rotateLabelMaxValue}
                            valueLabelDisplay="on"
                            onChange={(event, newValue) =>
                                handleInputChange("labelRotate", newValue)
                            }
                        />
                        <StyledAxisSpan
                            display="flex"
                            width="100%"
                            justifyContent="space-between"
                        >
                            <span>{valueLabel.rotateLabelMinValue}</span>
                            <span>{valueLabel.rotateLabelMaxValue}</span>
                        </StyledAxisSpan>
                    </StyledAxisColDiv>
                )}
                {showValueLabel && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="title-size">Value Label Size</label>
                        <StyledTextField
                            id="size"
                            name="size"
                            value={valueLabel?.size}
                            onChange={(e) =>
                                handleInputChange("labelSize", e.target.value)
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showValueLabel && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="title-size">
                            Value Label Line Length
                        </label>
                        <StyledTextField
                            id="length"
                            name="length"
                            value={valueLabel?.lineLength}
                            onChange={(e) =>
                                handleInputChange("labelLength", e.target.value)
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showValueLabel && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <label htmlFor="title-font-family">
                            Select Font Family
                        </label>
                        <StyledSelect
                            id="font-family"
                            name="fontFamily"
                            value={valueLabel?.family}
                            onChange={(e) =>
                                handleInputChange("labelFamily", e.target.value)
                            }
                        >
                            <Select.Item key="-1" value="">
                                Select
                            </Select.Item>
                            {FontFamily.map((label, index) => {
                                return (
                                    <Select.Item value={label} key={index}>
                                        {label}
                                    </Select.Item>
                                );
                            })}
                        </StyledSelect>
                    </StyledAxisColDiv>
                )}
                {showValueLabel && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <ColorPickerSettings
                            id={id}
                            path="option.series.0.label.color"
                            colorValue={valueLabel.color}
                            onChange={(e) => handleInputChange("color", e)}
                        />
                    </StyledAxisColDiv>
                )}
                {showValueLabel && (
                    <StyledButton
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleReset}
                    >
                        Reset
                    </StyledButton>
                )}
            </StyledAxisDiv>
        );
    },
);
