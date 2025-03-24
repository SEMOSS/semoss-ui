import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";

import { styled, TextField, Select, Typography } from "@semoss/ui";

import { useBlockSettings } from "../../../../../hooks";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";
import { Line_Curve_Type, Line_Type } from "../../Visualization.constants";
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
const StyledAxisColDiv = styled("div")<{
    display?: string;
    justifyContent: string;
    gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "8px 16px",
    gap: gap ?? undefined,
}));
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));
const StyledSelect = styled(Select)(() => ({
    width: "100%",
}));
export const LineStyling = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [lineCurve, setLineCurve] = useState("");
        const [lineType, setLineType] = useState("");
        const [lineWidth, setLineWidth] = useState(1);
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
        /**
         * Reinitializes the features when the chart is loaded.
         * @param options the options passed in when the chart is loaded
         */
        const reInitializeFeatures = (options) => {
            if (options.hasOwnProperty("series")) {
                const seriesLength = options["series"].length;
                for (let i = 0; i < seriesLength; i++) {
                    // check if the series has smooth curve
                    if (options["series"][i].hasOwnProperty("smooth")) {
                        setLineCurve("Smooth");
                    } else if (options["series"][i].hasOwnProperty("step")) {
                        // check if the series has step curve
                        setLineCurve("Step");
                    } else {
                        // else set it to Exact
                        setLineCurve("Exact");
                    }
                    // check if the series has line style
                    if (
                        options["series"][i]["lineStyle"].hasOwnProperty("type")
                    ) {
                        if (
                            options["series"][i]["lineStyle"]["type"] ===
                            "solid"
                        ) {
                            // check if the line type is solid
                            setLineType("Solid");
                        } else if (
                            options["series"][i]["lineStyle"]["type"] ===
                            "dashed"
                        ) {
                            // check if the line type is dashed
                            setLineType("Dashed");
                        } else {
                            // else set it to dotted
                            setLineType("Dotted");
                        }
                    }
                    // check if the series has line style width
                    if (
                        options["series"][i]["lineStyle"].hasOwnProperty(
                            "width",
                        )
                    ) {
                        // set the line width
                        setLineWidth(
                            options["series"][i]["lineStyle"]["width"],
                        );
                    }
                }
            }
        };
        /**
         * Handle the change event for any Title input
         * @param line the line of the input field
         * @param inputValue the value of the input field
         */
        function handleInputChange(line: string, inputValue) {
            let option = JSON.parse(value);
            if (line === "lineCurve") {
                const dataLength = option["series"].length;
                for (let i = 0; i < dataLength; i++) {
                    if (inputValue === "Smooth") {
                        // set the smooth curve
                        option["series"][i]["step"] = "";
                        option["series"][i]["smooth"] = true;
                    } else if (inputValue === "Exact") {
                        // set the exact curve
                        option["series"][i]["smooth"] = false;
                        option["series"][i]["step"] = "";
                    } else if (inputValue === "Step") {
                        // set the step curve
                        option["series"][i]["step"] = "start";
                    }
                }
                setLineCurve(inputValue);
            } else if (line === "lineType") {
                const dataLength = option["series"].length;
                for (let i = 0; i < dataLength; i++) {
                    if (inputValue === "Solid") {
                        // set the line style to solid
                        option["series"][i]["lineStyle"].type = "solid";
                    } else if (inputValue === "Dashed") {
                        // set the line style to dashed
                        option["series"][i]["lineStyle"].type = "dashed";
                    } else if (inputValue === "Dotted") {
                        // set the line style to dotted
                        option["series"][i]["lineStyle"].type = "dotted";
                    }
                }
                setLineType(inputValue);
            } else if (line === "lineWidth") {
                const dataLength = option["series"].length;
                for (let i = 0; i < dataLength; i++) {
                    // set the line width
                    option["series"][i]["lineStyle"].width = inputValue;
                }
                setLineWidth(inputValue);
            }
            // update the chart data
            setData(path, option as PathValue<D["data"], typeof path>);
        }
        return (
            <StyledAxisDiv>
                <StyledAxisColDiv
                    display="flex"
                    gap="8px"
                    style={{ marginTop: "8px" }}
                    justifyContent="space-around"
                >
                    <Typography variant="body2" color="secondary">
                        Select Graph Curve Type
                    </Typography>
                    <StyledSelect
                        size="small"
                        id="alignment"
                        name="alignment"
                        value={lineCurve}
                        onChange={(e) =>
                            handleInputChange("lineCurve", e.target.value)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select
                        </Select.Item>
                        {Line_Curve_Type.map((label, index) => {
                            return (
                                <Select.Item value={label} key={index}>
                                    {label}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledAxisColDiv>

                <StyledAxisColDiv
                    display="flex"
                    gap="8px"
                    style={{ marginTop: "8px" }}
                    justifyContent="space-around"
                >
                    <Typography variant="body2" color="secondary">
                        Select Line Type
                    </Typography>
                    <StyledSelect
                        size="small"
                        id="alignment"
                        name="alignment"
                        value={lineType}
                        onChange={(e) =>
                            handleInputChange("lineType", e.target.value)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select
                        </Select.Item>
                        {Line_Type.map((label, index) => {
                            return (
                                <Select.Item value={label} key={index}>
                                    {label}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledAxisColDiv>
                <StyledAxisColDiv
                    display="flex"
                    gap="8px"
                    style={{ marginTop: "8px" }}
                    justifyContent="space-around"
                >
                    <Typography variant="body2" color="secondary">
                        Line Width
                    </Typography>
                    <StyledTextField
                        size="small"
                        id="size"
                        name="size"
                        value={lineWidth}
                        onChange={(e) =>
                            handleInputChange("lineWidth", e.target.value)
                        }
                    />
                </StyledAxisColDiv>
            </StyledAxisDiv>
        );
    },
);
