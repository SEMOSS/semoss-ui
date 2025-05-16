import { ChangeEvent, createElement, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";
import { Sync, Search } from "@mui/icons-material";
import { Tooltip, Checkbox } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Autocomplete, Button, Select, styled, TextField, InputAdornment, IconButton, Stack, Accordion, Typography } from "@semoss/ui";
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
import { DataTabStyling } from "./DataTabStyling";
import StringIcon from '../../../../../assets/img/StringIcon.svg';
import NumberIcon from '../../../../../assets/img/NumberIcon.svg';
import { buildListener } from "../../../block-defaults.shared";
import { ListenerSettings } from "../../../../block-settings";
import { ExpandMore } from '@mui/icons-material';

//frame operations component props structure
export interface FrameOperationsProps {
    id: string;
    updateFrame: (option) => void;
}
// a styled section to maintain the basic styles for every element in the component
const StyledDropDownSection = styled("div")(() => ({
    display: "flex",
    justifyContent: "space-between", // Ensures space between the two sections
    alignItems: "stretch", // Aligns items vertically in the center
    padding: "0.5rem",
    width: "100%",
    height: "100%",
}));

const StyledSubSection = styled("div")(() => ({
    alignItems: "center",
    padding: "0.5rem",
    width: "40%",
    minHeight: "639px",
    borderRight: "1px solid #ccc",
    "&:last-child": {
        borderRight: "none",
        width: "60%",
    },
}));

const StyledLabelIcon = styled("img")(() => ({
    marginRight: "2px",
}));

const StyledSpanDimension = styled("span")(() => ({
    padding: "0.5rem",
    fontSize: "1rem",
    color: "#808080",
    position: "relative",
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

interface AccordionSection {
    [key :string]: {
        expanded: boolean;
        title: string;
    }
};

export const FrameOperations = observer(
    <D extends BlockDef = BlockDef>({ id, updateFrame, path, chart, storedColumns, handleStoreData }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [columnsData, setColumnsData] = useState([]);
        const [search, setSearch] = useState("");
        const [isAdd, setIsAdd] = useState(false);
        const [addedColumnName, setAddedColumnName] = useState("");
        const [droppedColumns, setDroppedColumns] = useState<Record<string, string[]>>({});
        const [selectedColumn, setSelectedColumn] = useState<string[]>([]);
        const [accordionSection, setAccordionSection] = useState<AccordionSection[]>([{
            ["preProcess"]:{
                expanded: true,
                title: "PRE PROCESS"
            }
        }]);
        const accordionList = ["preProcess"];
        const [value, setValue] = useState("");
        // get all of the frames
        const getFrames = useBlocksPixel<string[]>("GetFrames();", {
            data: [],
        });
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        const [filteredColumns, setFilteredColumns] = useState([]);
        const [temp, setTemp] = useState(true);

        const [frameOperationState, setFrameOperationState] = useState<
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
                    dataType: item.dataType,
                };
            });
        }, [frameHeaders]);

        useEffect(() => {
            if (columnsSelector.length > 0 && temp) {
                setFilteredColumns(columnsSelector);
                setTemp(false);
            }
        }, [columnsSelector]);

        useEffect(() => {
            setSelectedColumn(storedColumns);
        }, [storedColumns]);

        const handleSearch = (searchValue: string) => {
            setSearch(searchValue); // Update the search state
            const lowerCaseSearch = searchValue.toLowerCase();
            const filtered = columnsSelector.filter((col) =>
                col.name.toLowerCase().includes(lowerCaseSearch)
            );
            setFilteredColumns(filtered); // Update the filtered columns
        };

        //additional function to trigger a sync, when a frame is newly selected
        function syncHeaders(value: any) {
            if (!value) return;
            const columns = frameHeaders.data.list.map((item) => {
                return {
                    name: item.alias,
                    selector: item.header,
                    width: undefined,
                    dataType: item.dataType,
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

        const formattedColumns = (columnsValue: any[], variation: any) => {
            // check if the columns value has any values
            const hasValues = columnsValue.some(item => item?.values && item?.values.length > 0);
            if (hasValues) {
                setSelectedColumn(columnsValue);
                handleStoreData(columnsValue);
            }

            const columnsDrop = [];
            for (let i = 0; i < columnsValue.length; i++) {
                columnsDrop[i] = columnsValue[i].values.length > 0 ? columnsValue[i] : null;
            }

            const firstColumn = columnsDrop[0];
            const secondColumn = columnsDrop[1];

            let fieldsData = {
                [firstColumn?.label]: [],
                [secondColumn?.label]: [],
            };
            let selectedValues = {
                [firstColumn?.label]: [],
                [secondColumn?.label]: [],
            };

            const columns = { ...fieldsData };
            console.log(columns, 'columns', columnsValue, 'columnsValue');

            if (variation === "echart-bar-graph") {

                if (firstColumn?.label) {
                    columns[firstColumn?.label] = [
                        {
                            ["name"]: firstColumn?.values || "",
                            ["selector"]: firstColumn.selectors,
                            ["width"]: undefined,
                        },
                    ];
                    fieldsData = {
                        ...fieldsData,
                        [firstColumn?.label]: columns[firstColumn?.label],
                    };
                    selectedValues = {
                        ...selectedValues,
                        [firstColumn?.label]: columns[firstColumn?.label][0]["selector"],
                    };
                }
                if (secondColumn?.label) {
                    columns[secondColumn?.label] = [];
                    secondColumn.values.forEach((item, index) => {
                        columns[secondColumn?.label].push({
                            ["name"]: item,
                            ["selector"]: secondColumn.selectors[index],
                            ["width"]: undefined,
                        });
                    });
                    fieldsData = {
                        ...fieldsData,
                        [secondColumn?.label]: columns[secondColumn?.label],
                    };
                    let LabelData = [];
                    columns[secondColumn?.label].forEach((labelItem, labelIndex) => {
                        LabelData = [...LabelData, labelItem.selector];
                    });
                    selectedValues = {
                        ...selectedValues,
                        [secondColumn?.label]: LabelData,
                    };
                }

                if (columns[firstColumn?.label] && columns[secondColumn?.label]) {
                    let tempVal = JSON.parse(computedValue) || {};
                    const seriesIndex =
                        tempVal["series"].findIndex((item) =>
                            BAR_CHART_DATA.JSONVALUE.includes(item.type),
                        ) || 0;
                    let columnsmerged = [];
                    if (columns[firstColumn?.label]?.length) {
                        tempVal[firstColumn?.label] = {
                            ...tempVal[firstColumn?.label],
                            ["name"]: columns[firstColumn?.label][0]?.name || "",
                            ["pixelname"]: columns[firstColumn?.label][0]?.name || "",
                            ["pixelvalue"]: columns[firstColumn?.label][0]?.selector || "",
                        };
                    }

                    columnsmerged = [
                        {
                            name: columns[firstColumn?.label][0]?.name || "",
                            selector: columns[firstColumn?.label][0]?.selector[0] || "",
                        },
                    ];
                    const pixelName = [],
                        pixelValue = [];
                    columns[secondColumn?.label].forEach((columItem, columIndex) => {
                        pixelName.push(columItem?.name);
                        pixelValue.push(columItem?.selector);
                        columnsmerged.push({
                            name: columItem?.name,
                            selector: columItem?.selector,
                        });
                    });
                    if (columns[secondColumn?.label]?.length) {
                        tempVal[secondColumn?.label] = {
                            ...tempVal[secondColumn?.label],
                            ["name"]: columns[secondColumn?.label][0]?.name || pixelName[0],
                            ["pixelname"]: pixelName,
                            ["pixelvalue"]: pixelValue,
                        };
                    }
                    for (let i = 0; i < columns[secondColumn?.label]?.length; i++) {
                        tempVal["series"][i] = {
                            ...tempVal["series"][i],
                            data: [],
                            name: columns[secondColumn?.label][i]?.name,
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
            if (variation === "echart-pie-chart" && firstColumn !== null && secondColumn !== null) {
                const tempValue = JSON.parse(computedValue);

                tempValue["_state"] = {};
                tempValue["_state"]["fields"] = {};

                tempValue["_state"]["fields"] = {
                    ...tempValue["_state"]["fields"],
                    Label: firstColumn?.values,
                    Value: secondColumn?.values,
                };

                // set the value
                setValue(JSON.stringify(tempValue));
                setData("option", tempValue);
            }
            if (variation === "echart-scatter-plots") {
                if (firstColumn?.values) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        label: firstColumn?.values,
                        labelDataType: firstColumn?.dataType,
                    };

                    // Update the series label name
                    tempValue["series"][0]["label"]["name"] = firstColumn?.values;

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (secondColumn?.values) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        XAxis: secondColumn?.values,
                        XAxisDataType: secondColumn?.dataType,
                    };
                    // Update the series xAxis name
                    tempValue["xAxis"]["name"] = secondColumn?.values;
                    tempValue["xAxis"]["pixelName"] = secondColumn?.values;

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[2]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        YAxis: columnsDrop[2]?.values,
                        YAxisDataType: columnsDrop[2]?.dataType,
                    };

                    tempValue["yAxis"]["name"] = columnsDrop[2]?.values;
                    tempValue["yAxis"]["pixelName"] = columnsDrop[2]?.values;

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[3]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        size: columnsDrop[3]?.values,
                        sizeDataType: columnsDrop[3]?.dataType,
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[4]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        color: columnsDrop[4]?.values,
                        colorDataType: columnsDrop[4]?.dataType,
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[5]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        tooltip: columnsDrop[5]?.values,
                        tooltipDataType: columnsDrop[5]?.dataType,
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
            }
            if (variation === "echart-stack-chart") {
                if (firstColumn?.values) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        XAxis: firstColumn?.values,
                        XAxisDataType: firstColumn?.dataType,
                    };

                    tempValue["xAxis"]["name"] = firstColumn?.values;
                    tempValue["xAxis"]["pixelName"] = firstColumn?.values;
                    tempValue["xAxis"]["flipAxisName"] = firstColumn?.values;
                    tempValue["xAxis"]["axisName"] = firstColumn?.values;

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (secondColumn?.values) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        YAxis: secondColumn?.values,
                        YAxisDataType: secondColumn?.dataType,
                    };

                    tempValue["yAxis"]["name"] = secondColumn?.values;
                    tempValue["yAxis"]["pixelName"] = secondColumn?.values;
                    tempValue["yAxis"]["flipAxisName"] = secondColumn?.values;
                    tempValue["yAxis"]["axisName"] = secondColumn?.values;

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[2]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        category: columnsDrop[2]?.values,
                        categoryDataType: columnsDrop[2]?.dataType,
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[3]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        tooltip: columnsDrop[3]?.values,
                        tooltipDataType: columnsDrop[3]?.dataType,
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
            }
            if (variation === "echart-line-graph" && firstColumn !== null && secondColumn !== null) {
                const tempValue = JSON.parse(computedValue);

                tempValue["_state"] = {};
                tempValue["_state"]["fields"] = {};
                let tempSeries = tempValue['series'] || [];
                tempValue["_state"]["fields"] = {
                    ...tempValue["_state"]["fields"],
                    xAxis: firstColumn?.values,
                    yAxis: secondColumn?.values,
                    tooltip: columnsDrop[2]?.values ? columnsDrop[2]?.values : [],
                };
                if(secondColumn?.values.length > 1){
                    let seriesListToAdd = [];
                    //Adding newly added field to the state
                    for(let i=0;i<secondColumn.values.length;i++){
                        seriesListToAdd[i] = {
                            ...tempSeries[i],
                            name: secondColumn.values[i],
                            type: "line",
                            data: tempSeries[i]?.data ?? [],
                            lineStyle: {
                                ...tempSeries[i]?.lineStyle,
                                type: tempSeries[i]?.lineStyle?.type ?? "solid",
                                width: tempSeries[i]?.lineStyle?.width ?? 1,
                            },
                            label: {
                                ...tempSeries[i]?.label,
                                show: tempSeries[i]?.label?.show ?? true,
                                position: tempSeries[i]?.label?.position ?? "top",
                                rotate: tempSeries[i]?.label?.rotate ?? 45,
                                fontSize: tempSeries[i]?.label?.fontSize ?? 12,
                                color: tempSeries[i]?.label?.color ?? "#000000",
                            },
                        };
                    }
                    tempSeries = seriesListToAdd;
                }
                else{
                    //Removing the field from the state if it is not selected
                    tempSeries = tempSeries.slice(0,1);
                }
                tempValue["series"] = tempSeries;
                // set the value
                setValue(JSON.stringify(tempValue));
                setData("option", tempValue);
            }
            if (variation === "echart-world-map-chart") {
                if (firstColumn?.values) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        label: firstColumn?.values?.[0],
                        labelDataType: firstColumn?.dataType?.[0],
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (secondColumn?.values) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        Latitude: secondColumn?.values?.[0],
                        LatitudeDataType: secondColumn?.dataType?.[0],
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[2]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        Longitude: columnsDrop[2]?.values?.[0],
                        LongitudeDataType: columnsDrop[2]?.dataType?.[0],
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[3]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        size: columnsDrop[3]?.values?.[0],
                        sizeDataType: columnsDrop[3]?.dataType?.[0],
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[4]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        color: columnsDrop[4]?.values?.[0],
                        colorDataType: columnsDrop[4]?.dataType?.[0],
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[5]?.values.length > 0) {
                    const tempValue = JSON.parse(computedValue);

                    tempValue["_state"] =
                        tempValue["_state"] &&
                            Object.keys(tempValue["_state"]).length > 0
                            ? tempValue["_state"]
                            : {};
                    tempValue["_state"]["fields"] = {
                        ...tempValue["_state"]["fields"],
                        tooltip: columnsDrop[5]?.values?.[0],
                        tooltipDataType: columnsDrop[5]?.dataType?.[0],
                    };

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
            }
            if (variation == "echart-gantt-chart") {
                let columnsToSet = [];
                let columnsObject = {};
                const formattedArray = [];

                const tempValue = JSON.parse(computedValue);

                for (let i = 0; i < columnsValue.length; i++) {
                    if (columnsValue[i]?.values.length > 0) {
                        formattedArray.push({
                            name: columnsValue[i]?.values?.[0] || "",
                            selector: columnsValue[i]?.selectors?.[0] || "",
                            width: columnsValue[i]?.width?.[0] || undefined,
                        });
                    }
                }

                setData("columns", formattedArray);

                if (firstColumn?.values) {
                    columnsToSet.push(firstColumn?.values);
                    columnsObject["task"] = firstColumn?.values;

                    tempValue["customSettings"] =
                        tempValue["customSettings"] &&
                            Object.keys(tempValue["customSettings"]).length > 0
                            ? tempValue["customSettings"]
                            : {};

                    tempValue["customSettings"]["columnDetails"] = {
                        ...tempValue["customSettings"]["columnDetails"],
                        [firstColumn?.label]: {
                            name: firstColumn?.values?.[0],
                            selector: firstColumn?.selectors?.[0],
                        },
                    }

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (secondColumn?.values) {
                    columnsToSet.push(secondColumn?.values);
                    columnsObject["startdate"] = secondColumn?.values;

                    tempValue["customSettings"] =
                        tempValue["customSettings"] &&
                            Object.keys(tempValue["customSettings"]).length > 0
                            ? tempValue["customSettings"]
                            : {};

                    tempValue["customSettings"]["columnDetails"] = {
                        ...tempValue["customSettings"]["columnDetails"],
                        [secondColumn?.label]: {
                            name: secondColumn?.values?.[0],
                            selector: secondColumn?.selectors?.[0],
                        },
                    }

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[2]?.values.length > 0) {

                    columnsToSet.push(columnsDrop[2]?.values);
                    columnsObject["enddate"] = columnsDrop[2]?.values;

                    tempValue["customSettings"] =
                        tempValue["customSettings"] &&
                            Object.keys(tempValue["customSettings"]).length > 0
                            ? tempValue["customSettings"]
                            : {};

                    tempValue["customSettings"]["columnDetails"] = {
                        ...tempValue["customSettings"]["columnDetails"],
                        [columnsDrop[2]?.label]: {
                            name: columnsDrop[2]?.values?.[0],
                            selector: columnsDrop[2]?.selectors?.[0],
                        },
                    }

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[3]?.values.length > 0) {
                    columnsToSet.push(columnsDrop[3]?.values);
                    columnsObject["taskgroup"] = columnsDrop[3]?.values;

                    tempValue["customSettings"] =
                        tempValue["customSettings"] &&
                            Object.keys(tempValue["customSettings"]).length > 0
                            ? tempValue["customSettings"]
                            : {};

                    tempValue["customSettings"]["columnDetails"] = {
                        ...tempValue["customSettings"]["columnDetails"],
                        [columnsDrop[3]?.label]: {
                            name: columnsDrop[3]?.values?.[0],
                            selector: columnsDrop[3]?.selectors?.[0],
                        },
                    }

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[4]?.values.length > 0) {
                    columnsToSet.push(columnsDrop[4]?.values);
                    columnsObject["taskprogress"] = columnsDrop[4]?.values;

                    tempValue["customSettings"] =
                        tempValue["customSettings"] &&
                            Object.keys(tempValue["customSettings"]).length > 0
                            ? tempValue["customSettings"]
                            : {};

                    tempValue["customSettings"]["columnDetails"] = {
                        ...tempValue["customSettings"]["columnDetails"],
                        [columnsDrop[4]?.label]: {
                            name: columnsDrop[4]?.values?.[0],
                            selector: columnsDrop[4]?.selectors?.[0],
                        },
                    }

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[5]?.values.length > 0) {
                    columnsToSet.push(columnsDrop[5]?.values);
                    columnsObject["milestone"] = columnsDrop[5]?.values;

                    tempValue["customSettings"] =
                        tempValue["customSettings"] &&
                            Object.keys(tempValue["customSettings"]).length > 0
                            ? tempValue["customSettings"]
                            : {};

                    tempValue["customSettings"]["columnDetails"] = {
                        ...tempValue["customSettings"]["columnDetails"],
                        [columnsDrop[5]?.label]: {
                            name: columnsDrop[5]?.values?.[0],
                            selector: columnsDrop[5]?.selectors?.[0],
                        },
                    }

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
                if (columnsDrop[6]?.values.length > 0) {
                    columnsToSet.push(columnsDrop[6]?.values);
                    columnsObject["tooltip"] = columnsDrop[6]?.values;

                    tempValue["customSettings"] =
                        tempValue["customSettings"] &&
                            Object.keys(tempValue["customSettings"]).length > 0
                            ? tempValue["customSettings"]
                            : {};

                    tempValue["customSettings"]["columnDetails"] = {
                        ...tempValue["customSettings"]["columnDetails"],
                        [columnsDrop[6]?.label]: {
                            name: columnsDrop[6]?.values?.[0],
                            selector: columnsDrop[6]?.selectors?.[0],
                        },
                    }

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }

                let tempDataSet = new Set(columnsToSet);
                columnsToSet = Array.from(tempDataSet);
                let columnsIndexToSet = getColumnIndexToSetData(
                    columnsObject,
                    columnsToSet,
                );

                if (columnsIndexToSet) {

                    tempValue["customSettings"]["columnIndexDetails"] = {
                        ...tempValue["customSettings"]["columnIndexDetails"],
                        ...columnsIndexToSet,
                    }

                    setValue(JSON.stringify(tempValue));
                    setData("option", tempValue);
                }
            }
            if(variation == "echart-dendrogram-chart"){
                let columnsToPush = [];
                let dimensionElement = columnsValue.find((element) => element.label === 'dimensions');
                let facetElement = columnsValue.find((element) => element.label === 'facet');
                if(dimensionElement.label === 'dimensions' && dimensionElement.values.length){
                    dimensionElement.selectors.forEach((item, index)=>{
                        if(!item || !dimensionElement.values[index]) return;
                        columnsToPush = [
                            ...columnsToPush,
                            {
                                name: dimensionElement.values[index],
                                selector: item,
                            },
                        ];
                    });
                    setData("columns", columnsToPush);
                }
                else{
                    setData("columns", []);
                }
                if(facetElement.label === 'facet' && facetElement.values.length){
                    if(!facetElement.values[0] || !facetElement.selectors[0]) return;

                    setData("facet.facetSelected", [{
                        name: facetElement.values[0],
                        selector: facetElement.selectors[0],
                        value: 0,
                      }]);
                    
                    columnsToPush = [
                          ...columnsToPush,
                          {
                            name: facetElement.values[0],
                            selector: facetElement.selectors[0],
                            value: 0,
                            isFacet: true,
                          }   
                    ];
                    setData("columns", columnsToPush);
                }
                else{
                    setData("facet.facetSelected", []);
                }
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
        function getColumnIndexToSetData(columnsObject, columnsToSet) {
            let colIndex = {};
            Object.keys(columnsObject).forEach((key) => {
                if (
                    typeof columnsObject[key] === "object" &&
                    Array.isArray(columnsObject[key])
                ) {
                    // Find the index of the first matching value in columnsToSet
                    colIndex[key] = columnsToSet.findIndex(
                        (colSetItem) => colSetItem[0] === columnsObject[key][0]
                    );
                } else {
                    // Handle non-array values if needed (not applicable in your example)
                    colIndex[key] = -1; // Default to -1 if no match is found
                }
            });
            return colIndex;
        }
        const handleDragEnd = (result) => {
            if (!result.destination) return;

            const { source, destination, draggableId } = result;
            const dropId = destination.droppableId;

            setDroppedColumns((prev) => {
                const updated = { ...prev };
                if (!updated[dropId]) updated[dropId] = [];
                updated[dropId].push(draggableId);
                return updated;
            });
        };
        const deleteDroppedColumn = (columnName: string) => {
            setDroppedColumns((prev) => {
                const updated = { ...prev };
                for (const key in updated) {
                    updated[key] = updated[key].filter((col) => col !== columnName);
                }
                return updated;
            });
        }
        const onClickAdd = (value: boolean, id: any) => {
            setIsAdd(value);
            setAddedColumnName(id);
        }
        let renderElement = [...buildListener("preProcess")];

        const renderAccordion = (
            <>
                {
                    accordionSection.map((item,index)=>(
                        <Accordion
                        expanded={item[accordionList[index]].expanded}
                        onChange={(e) =>{
                            let accordionSectionToUp = accordionSection;
                            let indexToUpdate = accordionSectionToUp.findIndex((accordItem)=>accordItem.hasOwnProperty(accordionList[index]));
                            accordionSectionToUp[indexToUpdate][accordionList[index]] = {
                                ...accordionSectionToUp[indexToUpdate][accordionList[index]],
                                expanded: !accordionSectionToUp[indexToUpdate][accordionList[index]].expanded,
                            };
                            setAccordionSection((prevAccordionSection)=>{
                                return [...accordionSectionToUp];
                            })
                        }
                        }
                        sx={{
                            width:'100%',
                        }}
                        >
                            <Accordion.Trigger
                                expandIcon={<ExpandMore />}
                            >
                                <Typography variant="body2">
                                    {item[accordionList[index]].title}
                                </Typography>
                            </Accordion.Trigger>

                            <Accordion.Content>
                                    <Stack direction="column" spacing={1}>
                                        {renderElement.map((c, cIdx) => {
                                            return createElement(c.render, {
                                                key: cIdx,
                                                id: id,
                                            });
                                        })}
                                    </Stack>
                            </Accordion.Content>
                        </Accordion>
                    ))
                }
                 
            </>
        );

        return (
            <>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <StyledDropDownSection>
                        <StyledSubSection>
                            <StyledSpanDimension>
                                Dimension
                            </StyledSpanDimension>
                            <Stack paddingTop={2} width={"95%"}>
                                <TextField
                                    placeholder="Search"
                                    size="small"
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: "7px",
                                        },
                                    }}
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                // onClick={(e) =>
                                                //     setMenuAnchorEl(e.currentTarget)
                                                // }
                                                >
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Stack>
                            <Droppable droppableId="column-list">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {filteredColumns.map((col, index) => (
                                            <Draggable key={col.name} draggableId={col.name} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "12px",
                                                            padding: "8px",
                                                            marginBottom: "8px",
                                                            marginTop: "2px",
                                                            background: snapshot.isDragging ? "#f0f0f0" : "#fff",
                                                            borderRadius: "4px",
                                                            maxWidth: "100%",
                                                            boxShadow: snapshot.isDragging ? "0 2px 5px rgba(0,0,0,0.2)" : "none",
                                                            ...provided.draggableProps.style,
                                                        }}
                                                    >
                                                        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center" }}>
                                                            {col.dataType === "STRING" ? (
                                                                <StyledLabelIcon src={StringIcon.toString()} />
                                                            ) : (
                                                                <StyledLabelIcon src={NumberIcon.toString()} />
                                                            )}
                                                        </div>
                                                        <div style={{ flex: "1 1 auto", display: "flex", alignItems: "center" }}>
                                                            {col.name.length > 7 ? (
                                                                <Tooltip title={col.name}>
                                                                    <span style={{ lineHeight: "1.5" }}>{col.name.slice(0, 7)}...</span>
                                                                </Tooltip>
                                                            ) : (
                                                                <span style={{ lineHeight: "1.5" }}>{col.name}</span>
                                                            )}
                                                        </div>
                                                        {isAdd && (
                                                            <div style={{ flex: "1 1 auto", display: "flex", justifyContent: "flex-end" }}>
                                                                <Checkbox
                                                                    size="small"
                                                                    color="primary"
                                                                    onChange={(e) => {
                                                                        setDroppedColumns((prev) => {
                                                                            const updated = { ...prev };
                                                                            if (e.target.checked) {
                                                                                // Add the column name if checked
                                                                                if (!updated[addedColumnName]) updated[addedColumnName] = [];
                                                                                updated[addedColumnName].push(col.name);
                                                                            } else {
                                                                                // Remove the column name if unchecked
                                                                                if (updated[addedColumnName]) {
                                                                                    updated[addedColumnName] = updated[addedColumnName].filter(
                                                                                        (name) => name !== col.name
                                                                                    );
                                                                                    // If the array becomes empty, you can optionally delete the key
                                                                                    if (updated[addedColumnName].length === 0) {
                                                                                        delete updated[addedColumnName];
                                                                                    }
                                                                                }
                                                                            }
                                                                            return updated;
                                                                        });
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>

                        </StyledSubSection>
                        <StyledSubSection>
                            <DataTabStyling
                                id={id}
                                updateFrame={updateFrame}
                                syncHeader={syncHeaders}
                                path="option"
                                dragdropColumns={droppedColumns}
                                deleteColumns={deleteDroppedColumn}
                                formmattedColumns={formattedColumns}
                                isAdd={onClickAdd}
                                chart={chart}
                                storedColumns={selectedColumn}
                            >
                            </DataTabStyling>
                        </StyledSubSection>

                    </StyledDropDownSection>
                    <StyledDropDownSection>
                            {
                                renderAccordion
                            }
                    </StyledDropDownSection>
                </DragDropContext>
            </>
        );
    },
);
