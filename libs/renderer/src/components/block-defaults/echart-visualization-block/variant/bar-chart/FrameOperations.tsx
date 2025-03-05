import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Sync } from "@mui/icons-material";
import { computed } from "mobx";

import { Autocomplete, Button, Select, styled, TextField } from "@semoss/ui";

import {
    useBlockSettings,
    useBlocksPixel,
    useFrameHeaders,
} from "../../../../../hooks";
import { EChartColumns } from "./Bar";
import { BlockDef } from "../../../../../store";
import { PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";
import { BAR_CHART_DATA } from "../../Visualization.constants";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";

//frame operations component props structure
export interface FrameOperationsProps {
    id: string;
    updateFrame: (option) => void;
}
// a styled section to maintain the basic styles for every element in the component
const StyledSubSection = styled("div")(() => ({
    display: "flex",
    justifyContent: "center",
    padding: "0.5rem",
    width: "100%",
}));
//dropdown section with custom styling
const StyledDropDownSection = styled("div")(() => ({
    display: "flex",
    justifyContent: "center",
    padding: "0.5rem",
}));
//select section with full width
const StyledSelect = styled(Select)(() => ({
    width: "100%",
}));

const COLOUR_PALATTE_DATA = [
    "#5470c6",
    "#91cc75",
    "#fac858",
    "#ee6666",
    "#73c0de",
    "#3ba272",
    "#fc8452",
    "#9a60b4",
    "#ea7ccc",
];

export const FrameOperations = observer(
    <D extends BlockDef = BlockDef>({ id, updateFrame, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [columnsData, setColumnsData] = useState([]);
        const [fieldsData, setFieldsData] = useState({
            xaxis: [],
            yaxis: [],
        });
        const [value, setValue] = useState({});
        const [selectedValues, setSelectedValues] = useState({
            xAxis: [],
            yAxis: [],
        });
        // get all of the frames
        const getFrames = useBlocksPixel<string[]>("GetFrames();", {
            data: [],
        });
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        let [frameOperationState, setFrameOperationState] = useState<
            "initial" | "updated"
        >("initial");

        // options for the autocomplete
        const options = getFrames.status === "SUCCESS" ? getFrames.data : [];
        // using frameheaders hook to get the header details for the selected frame
        const frameHeaders = useFrameHeaders(data.frame?.name);
        // fetch custom details about headers like alias, header, etc and assign to the variable for using it whenever required
        const columnsSelector = useMemo(() => {
            return frameHeaders.data.list.map((item) => {
                return {
                    name: item.alias,
                    selector: item.header,
                    width: undefined,
                };
            });
        }, [frameHeaders]);
        //this function is called to update the chart whenever x and y axis data is present
        const initialUpdateOfData = () => {
            if (data.frame.name === "") return;
            const option =
                typeof computedValue === "string"
                    ? JSON.parse(computedValue)
                    : computedValue;
            let xAxisData = option["xAxis"]["pixelvalue"] || []; //fetch data from xaxis
            let yAxisData = option["yAxis"]["pixelvalue"] || []; //fetch data from yaxis
            let recentValue = xAxisData.slice(-1) || [];
            let name = columnsSelector.find(
                (col) => col.selector === recentValue[0],
            );
            let initialColumns = { ...fieldsData };
            initialColumns["xaxis"] = [
                {
                    ["name"]: option["xAxis"]["pixelname"],
                    ["selector"]: recentValue,
                    ["width"]: undefined,
                },
            ];
            let pixelName = [],
                pixelValue = [];
            yAxisData.forEach((item, index) => {
                let name = columnsSelector.find(
                    (col: EChartColumns) => col.selector === item,
                );
                initialColumns["yaxis"].push({
                    ["name"]: name?.name || option["yAxis"]["pixelname"][index],
                    ["selector"]: item,
                    ["width"]: undefined,
                });
                pixelName.push(
                    name?.name || option["yAxis"]["pixelname"][index],
                );
                pixelValue.push(item);
            });
            setFieldsData((prevFields) => {
                return initialColumns;
            });
            let selectedValuesData = { ...selectedValues };
            selectedValuesData.xAxis = recentValue;
            selectedValuesData.yAxis = yAxisData;
            setSelectedValues((prevSelectedValues) => {
                return selectedValuesData;
            });
        };
        //additional function to trigger a sync, when a frame is newly selected
        function syncHeaders() {
            const columns = frameHeaders.data.list.map((item) => {
                return {
                    name: item.alias,
                    selector: item.header,
                    width: undefined,
                };
            });
            setColumnsData((prevColumns) => {
                return columns;
            });
        }

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
        //update the local state value when computed value is getting updated
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        //trying to check for updating the fields, when x and y axis is getting updated
        useEffect(() => {
            let option = typeof value === "string" ? JSON.parse(value) : value;
            initialUpdateOfData();
        }, [, id]);
        //update the x and y axis fields when a field change is detected, and update data.columns, at both x and y axis values are set
        function updateFields(axis, event) {
            let value = event.target.value || [];
            let columns = { ...fieldsData };
            if (axis === "xaxis") {
                let recentValue = value.slice(-1) || [];
                let name = columnsSelector.find(
                    (col: EChartColumns) => col.selector === recentValue[0],
                );
                columns["xaxis"] = [
                    {
                        ["name"]: name?.name || "",
                        ["selector"]: recentValue,
                        ["width"]: undefined,
                    },
                ];
                setFieldsData((prevFields) => {
                    return {
                        ...prevFields,
                        ["xaxis"]: columns["xaxis"],
                    };
                });
                setSelectedValues((prevValues) => {
                    return {
                        ...prevValues,
                        ["xAxis"]: columns["xaxis"][0]["selector"],
                    };
                });
            }
            if (axis === "yaxis") {
                columns["yaxis"] = [];
                value.forEach((item, index) => {
                    let name = columnsSelector.find(
                        (col) => col.selector === item,
                    );
                    columns["yaxis"].push({
                        ["name"]: name?.name || "",
                        ["selector"]: item,
                        ["width"]: undefined,
                    });
                });
                setFieldsData((prevFields) => {
                    return {
                        ...prevFields,
                        ["yaxis"]: columns["yaxis"],
                    };
                });
                let yAxisData = [];
                columns["yaxis"].forEach((yaxisItem, yAxisIndex) => {
                    yAxisData = [...yAxisData, yaxisItem.selector];
                });
                setSelectedValues((prevValues) => {
                    return {
                        ...prevValues,
                        ["yAxis"]: yAxisData,
                    };
                });
            }
            if (columns["xaxis"] && columns["yaxis"]) {
                let tempVal = JSON.parse(computedValue) || {};
                let seriesIndex =
                    tempVal["series"].findIndex((item) =>
                        BAR_CHART_DATA.JSONVALUE.includes(item.type),
                    ) || 0;
                let columnsmerged = [];
                if (columns["xaxis"].length) {
                    tempVal["xAxis"] = {
                        ...tempVal["xAxis"],
                        ["name"]: columns["xaxis"][0].name || "",
                        ["pixelname"]: columns["xaxis"][0].name || "",
                        ["pixelvalue"]: columns["xaxis"][0].selector || "",
                    };
                }

                columnsmerged = [
                    {
                        name: columns["xaxis"][0].name || "",
                        selector: columns["xaxis"][0].selector[0] || "",
                    },
                ];
                let pixelName = [],
                    pixelValue = [];
                columns["yaxis"].forEach((columItem, columIndex) => {
                    pixelName.push(columItem.name);
                    pixelValue.push(columItem.selector);
                    columnsmerged.push({
                        name: columItem.name,
                        selector: columItem.selector,
                    });
                });
                if (columns["yaxis"].length) {
                    tempVal["yAxis"] = {
                        ...tempVal["yAxis"],
                        ["name"]: columns["yaxis"][0]?.name || pixelName[0],
                        ["pixelname"]: pixelName,
                        ["pixelvalue"]: pixelValue,
                    };
                }
                for (let i = 0; i < columns["yaxis"].length; i++) {
                    tempVal["series"][i] = {
                        ...tempVal["series"][i],
                        data: [],
                        name: columns["yaxis"][i].name,
                        type: "bar",
                        barWidth: 5,
                        ["itemStyle"]: {
                            ["color"]:
                                tempVal["color"][i] ?? COLOUR_PALATTE_DATA[i],
                        },
                    };
                }
                tempVal = {
                    ...tempVal,
                    ["customSettings"]: {
                        ...tempVal["customSettings"],
                        ["toolsUpdated"]: false,
                    },
                };
                dispatchData(tempVal);
                setData("columns", columnsmerged);
            }
        }
        function dispatchData(option) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData("option", option as PathValue<any, typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 100);
        }
        return (
            <>
                <StyledSubSection>
                    <label htmlFor="Echart-Frame">Select a Frame</label>
                </StyledSubSection>
                <StyledSubSection>
                    <Autocomplete
                        fullWidth
                        id="Echart-Frame"
                        multiple={false}
                        disabled={getFrames.status !== "SUCCESS"}
                        value={data.frame?.name}
                        options={options}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // update the frame
                            setData("frame.name", value);
                        }}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select frame"
                                size="small"
                                variant="outlined"
                            />
                        )}
                    />
                    <Button onClick={syncHeaders}>
                        <Sync />
                    </Button>
                </StyledSubSection>
                <StyledDropDownSection>
                    <label htmlFor="font-weight">X Axis Field</label>
                    <StyledSelect
                        id="font-weight"
                        label="Select X Axis Field"
                        SelectProps={{
                            multiple: true,
                        }}
                        value={
                            columnsSelector.length > 0
                                ? selectedValues["xAxis"] ?? []
                                : []
                        }
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields("xaxis", e)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select X Axis Field
                        </Select.Item>
                        {columnsSelector?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDropDownSection>
                <StyledDropDownSection>
                    <label htmlFor="font-weight">Y Axis Field</label>
                    <StyledSelect
                        id="font-weight"
                        label="Select Y Axis Field"
                        SelectProps={{
                            multiple: true,
                        }}
                        value={
                            columnsSelector.length > 0
                                ? selectedValues["yAxis"] ?? []
                                : []
                        }
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields("yaxis", e)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select Y Axis Field
                        </Select.Item>
                        {columnsSelector?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDropDownSection>
            </>
        );
    },
);
