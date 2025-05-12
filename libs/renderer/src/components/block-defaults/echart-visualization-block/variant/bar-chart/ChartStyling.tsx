import { useMemo, useRef, useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";

import { Button, Select, styled, TextField, Typography } from "@semoss/ui";

import { getValueByPath } from "../../../../../utility";
import { useBlockSettings } from "../../../../../hooks";
import { PathValue } from "../../../../../types";
import { BlockDef } from "../../../../../store";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { ColorPickerSettings } from "../../../../block-settings/shared/ColorPickerSettings";

//Styled select with custom styling
const StyledSelect = styled(Select)(() => ({
    width: "100%",
}));
//Styled chart main section with custom styling
const StyledChartMainSection = styled("div")(() => ({
    display: "block",
    width: "100%",
    // padding: "0.75em",
}));
//styled textfield with width 100%
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));
//Styled chart sub section with custom styling
const StyledAxisDiv = styled("div")<{
    display?: string;
    justifyContent?: string;
    gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "8px 16px",
    alignItems: "center",
    gap: gap ?? undefined,
}));

const StyledAxisColDiv = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "8px 16px",
    gap: "8px",
}));

//initial chart style for chart styling component
const INITIAL_CHART_STYLE = {
    title: "",
    alignment: "left",
    textSize: 12,
    fontColour: "#000000",
    fontWeight: "bold",
    fontFamily: "",
};

//handles chart styling with custom title, colour, etc
export const ChartStyling = observer(
    <D extends BlockDef = BlockDef>({ updateChart, option, id, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id); //json data for chart rendering
        const [chartStyle, setChartStyle] = useState(INITIAL_CHART_STYLE); //chart style initial state
        const [value, setValue] = useState(data.option);
        const [chartDataChanged, setChartDataChanged] = useState(false);
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        //default chart alignment for dropdown
        const chartAlignment = [
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
            { label: "Center", value: "center" },
        ];
        //default font weight details for dropdown
        const fontWeightDetails = [
            { label: "Normal", value: "normal" },
            { label: "Bold", value: "bold" },
            { label: "100", value: "100" },
            { label: "200", value: "200" },
            { label: "300", value: "300" },
            { label: "400", value: "400" },
            { label: "500", value: "500" },
            { label: "600", value: "600" },
            { label: "700", value: "700" },
            { label: "800", value: "800" },
            { label: "900", value: "900" },
        ];
        //default font family details for dropdown
        const fontFamilyDetails = [
            { label: "Arial", value: "Arial" },
            { label: "Arial Black", value: "Arial Black" },
            { label: "Arial Narrow", value: "Arial Narrow" },
            { label: "Calibri", value: "Calibri" },
            { label: "Century Gothic", value: "Century Gothic" },
            { label: "Comic Sans MS", value: "Comic Sans MS" },
            { label: "Courier New", value: "Courier New" },
            { label: "Garamound", value: "Garamound" },
            { label: "Georgia", value: "Georgia" },
            { label: "Helvetica", value: "Helvetica" },
            { label: "Inter", value: "Inter" },
            { label: "Open Sans", value: "Open Sans" },
            { label: "Sans-Serif", value: "Sans-Serif" },
            { label: "Segoe UI", value: "Segoe UI" },
            { label: "Times New Roman", value: "Times New Roman" },
        ];
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
        //when the computed value is changed, local state is updated
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        //for retaining the previously selected values, this useeffect will help
        useEffect(() => {
            let chartStyleData = INITIAL_CHART_STYLE;
            const option =
                typeof value === "string" ? JSON.parse(value) : value;
            if (option["title"]) {
                if (option["title"].hasOwnProperty("text")) {
                    chartStyleData = {
                        ...chartStyleData,
                        ["title"]: option["title"]["text"],
                    };
                }
                if (option["title"].hasOwnProperty("left")) {
                    chartStyleData = {
                        ...chartStyleData,
                        ["alignment"]: option["title"]["left"],
                    };
                }
                if (
                    option["title"].hasOwnProperty("textStyle") &&
                    option["title"]["textStyle"].hasOwnProperty("color")
                ) {
                    chartStyleData = {
                        ...chartStyleData,
                        ["fontColour"]: option["title"]["textStyle"]["color"],
                    };
                }
                if (
                    option["title"].hasOwnProperty("textStyle") &&
                    option["title"]["textStyle"].hasOwnProperty("fontWeight")
                ) {
                    chartStyleData = {
                        ...chartStyleData,
                        ["fontWeight"]:
                            option["title"]["textStyle"]["fontWeight"],
                    };
                }
                if (
                    option["title"].hasOwnProperty("textStyle") &&
                    option["title"]["textStyle"].hasOwnProperty("fontFamily")
                ) {
                    chartStyleData = {
                        ...chartStyleData,
                        ["fontFamily"]:
                            option["title"]["textStyle"]["fontFamily"],
                    };
                }
                if (
                    option["title"].hasOwnProperty("textStyle") &&
                    option["title"]["textStyle"].hasOwnProperty("textSize")
                ) {
                    chartStyleData = {
                        ...chartStyleData,
                        ["textSize"]: option["title"]["textStyle"]["textSize"],
                    };
                }
                setChartStyle((prevChartStyle) => {
                    return {
                        ...prevChartStyle,
                        ...chartStyleData,
                    };
                });
            }
        }, []);

        useEffect(() => {
            //update chart style to store when chart fields are uploaded
            if (chartDataChanged) {
                let option =
                    typeof value === "string" ? JSON.parse(value) : value;
                let optionUpdated = option;
                if (option.hasOwnProperty("title")) {
                    option["title"] = {
                        ...option["title"],
                        ["text"]: chartStyle.title,
                        ["show"]: true,
                        ["left"]: chartStyle.alignment,
                    };
                    if (option["title"].hasOwnProperty("textStyle")) {
                        option["title"]["textStyle"] = {
                            ...option["title"]["textStyle"],
                            ["color"]: chartStyle.fontColour,
                            ["fontWeight"]: chartStyle.fontWeight,
                            ["fontFamily"]: chartStyle.fontFamily,
                            ["fontSize"]: chartStyle.textSize,
                        };
                    }
                } else {
                    option = {
                        ...option,
                        ["title"]: {
                            ["text"]: chartStyle.title,
                            ["show"]: true,
                            ["left"]: chartStyle.alignment,
                            ["textStyle"]: {
                                ["color"]: chartStyle.fontColour,
                                ["fontWeight"]: chartStyle.fontWeight,
                                ["fontFamily"]: chartStyle.fontFamily,
                                ["fontSize"]: chartStyle.textSize,
                            },
                        },
                    };
                }
                option = {
                    ...option,
                    ["customSettings"]: {
                        ...option["customSettings"],
                        ["toolsUpdated"]: true,
                    },
                };
                optionUpdated = option;
                runStateUpdate(optionUpdated);
            }
        }, [chartStyle]);
        //reset the chart style to initial state
        function resetToInitialState() {
            setChartStyle(INITIAL_CHART_STYLE);
        }
        //handles different input fields by setting values to state, whenever a change happens
        function handleInputChange(event, field) {
            if (chartDataChanged === false) setChartDataChanged(true);
            setChartStyle((prevChartStyle) => {
                return {
                    ...prevChartStyle,
                    [field]: event.target.value,
                };
            });
        }
        // update state when chart fields are updated
        function runStateUpdate(optionUpdated) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        "option",
                        optionUpdated as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        //define component to a variable and assign the value to accordion
        const accordionDetails = (
            <StyledChartMainSection>
                <StyledAxisColDiv display="flex" justifyContent="start">
                    <Typography variant="body2" color="secondary">
                        Set Chart Title
                    </Typography>
                    <StyledTextField
                        size="small"
                        value={chartStyle.title}
                        id="change-chart-title"
                        onChange={(e) => handleInputChange(e, "title")}
                    />
                </StyledAxisColDiv>
                <StyledAxisColDiv display="flex" justifyContent="flex-start">
                    <Typography variant="body2" color="secondary">
                        Select Alignment
                    </Typography>
                    <StyledSelect
                        size="small"
                        id="change-alignment"
                        value={chartStyle.alignment}
                        onChange={(e) => handleInputChange(e, "alignment")}
                    >
                        <Select.Item value="" key="-1">
                            Select Alignment
                        </Select.Item>
                        {chartAlignment.map((chart, index) => {
                            return (
                                <Select.Item value={chart.value} key={index}>
                                    {chart.label}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledAxisColDiv>
                <StyledAxisColDiv display="flex" justifyContent="flex-start">
                    <Typography variant="body2" color="secondary">
                        Choose Text Size(px)
                    </Typography>
                    <StyledTextField
                        size="small"
                        value={chartStyle.textSize}
                        type="number"
                        id="change-text-size"
                        onChange={(e) => handleInputChange(e, "textSize")}
                    />
                </StyledAxisColDiv>

                <ColorPickerSettings
                    id={id}
                    path={`option.title.textStyle.color`}
                    colorValue={chartStyle.fontColour}
                    onChange={(e) =>
                        handleInputChange(
                            { target: { value: e } },
                            "fontColour",
                        )
                    }
                />

                <StyledAxisColDiv display="flex" justifyContent="flex-start">
                    <Typography variant="body2" color="secondary">
                        Font Weight
                    </Typography>
                    <StyledSelect
                        size="small"
                        id="change-font-weight"
                        value={chartStyle.fontWeight}
                        onChange={(e) => handleInputChange(e, "fontWeight")}
                    >
                        <Select.Item value="" key="-1">
                            Font Weight
                        </Select.Item>
                        {fontWeightDetails.map((chart, index) => {
                            return (
                                <Select.Item value={chart.value} key={index}>
                                    {chart.label}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledAxisColDiv>
                <StyledAxisColDiv display="flex" justifyContent="flex-start">
                    <Typography variant="body2" color="secondary">
                        Font Family
                    </Typography>
                    <StyledSelect
                        size="small"
                        id="change-font-family"
                        value={chartStyle.fontFamily}
                        onChange={(e) => handleInputChange(e, "fontFamily")}
                    >
                        <Select.Item value="" key="-1">
                            Select Font Family
                        </Select.Item>
                        {fontFamilyDetails.map((chart, index) => {
                            return (
                                <Select.Item value={chart.value} key={index}>
                                    {chart.label}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledAxisColDiv>
                <StyledAxisDiv display="flex" justifyContent="end">
                    <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        onClick={resetToInitialState}
                    >
                        Reset
                    </Button>
                </StyledAxisDiv>
            </StyledChartMainSection>
        );
        return <>{accordionDetails}</>;
    },
);
