import ReactECharts from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { useBlock, useBlockSettings, useFrame } from "../../../../../hooks";
import { styled, TableContainer } from "@mui/material";
import { useEffect, useMemo } from "react";
import { computed } from "mobx";
import { getValueByPath } from "@/utility";
import { Paper, Table } from "@mui/material";
import { TableHead } from "@mui/material";
import { TableRow, TableCell, TableBody } from "@mui/material";
// import { TableCell } from "@semoss/ui/dist/components/Table/TableCell";
// import { TableBody } from "@semoss/ui/dist/components/Table/TableBody";

const StyledMainContainer = styled("div")(({ theme }) => ({}));

const StyledSubContainer = styled("div")(({ theme }) => ({
    padding: "0.5rem",
}));

const StyledTableCell = styled(TableCell)<{ backgroundColor?: string }>(
    ({ backgroundColor }) => ({
        backgroundColor: backgroundColor ?? "#fff",
        border: "1px solid #e6e6e6",
    }),
);

interface GanttProps {
    id: string;
    updateChart: (dataOption, path) => void;
}

export const Gantt = observer(({ id, updateChart }: GanttProps) => {
    const { data, setData } = useBlockSettings<any>(id);
    const computedValue = useMemo(() => {
        return computed(() => {
            if (!data) {
                return "";
            }
            const v = getValueByPath(data, "option");
            if (typeof v === "undefined") {
                return "";
            } else if (typeof v === "string") {
                return v;
            }
            return JSON.stringify(v, null, 2);
        });
    }, [data, "option"]).get();
    let selector = "";
    if (data.columns !== undefined) {
        selector = `Select(${data.columns
            .map((item, index) => {
                return item.selector;
            })
            .join(",")}).as([${data.columns
            .map((item, index) => {
                return item.name;
            })
            .join(",")}])`;
    }

    const frame = useFrame(data.frame?.name, {
        selector: selector,
    });
    console.log(
        frame,
        "frame",
        data.columns,
        "columns",
        JSON.parse(computedValue),
    );

    let dataOption = useMemo(() => {
        let option = JSON.parse(computedValue);
        console.log("optionToUpdate", option);
        // Step 2: Sort and stack overlapping tasks
        var resourceRows = []; // Stores y-axis labels
        var seriesData = []; // Stores processed task data
        let yAxisName = "";
        let xAxisName = "";
        let toolTipSelected = [];
        let toolTipSelectedIndex = [];
        let mileStoneIndex = "";
        let milestoneData = [];
        let showTarget = false;
        let taskProgressSelected = Object.keys(
            option["customSettings"]["columnDetails"],
        ).some((item) => item === "taskprogress");
        // let mileStoneSymbol = option['customSettings']['']
        let mileStoneProperties = {
            symbol: "triangle",
            color: "#80af6c",
            symbolSize: 16,
        };
        let symbolValue = [];
        let symbolSize = [];
        let symbolColor = [];
        let legendShow = false;
        let groupViewShow = false;
        let columnIndexDetails = option["customSettings"]["columnIndexDetails"];

        if (frame.data.values.length) {
            frame.data.values.forEach((item, index) => {
                let mileStoneDate = new Date(
                    item[columnIndexDetails["milestone"]],
                ).getTime();
                let ganttToolsLength =
                    option["customSettings"]?.["gantttools"]?.[
                        "customizeSymbol"
                    ]?.length;
                let ganttToolsSelected =
                    ganttToolsLength > -1
                        ? option["customSettings"]?.["gantttools"]?.[
                              "customizeSymbol"
                          ]?.[ganttToolsLength - 1]
                        : {};
                console.log(
                    item[columnIndexDetails["milestone"]],
                    ganttToolsSelected?.dimensionValues,
                    "value comparision",
                );
                let ganttToolsDimensionValues =
                    ganttToolsSelected?.dimensionValues?.map((item, index) =>
                        new Date(item).getTime(),
                    ) || [];
                console.log(
                    "milestone",
                    mileStoneDate,
                    ganttToolsSelected?.dimensionValues,
                    ganttToolsDimensionValues,
                );
                if (
                    ganttToolsSelected?.dimensionSelected === "milestone" &&
                    ganttToolsDimensionValues?.includes(mileStoneDate)
                ) {
                    symbolValue.push(ganttToolsSelected.symbol);
                    symbolSize.push(ganttToolsSelected.symbolSize);
                    symbolColor.push(ganttToolsSelected.symbolColor);
                    console.log("comestoif", "milestonecheck");
                } else {
                    symbolValue.push(mileStoneProperties.symbol);
                    symbolSize.push(mileStoneProperties.symbolSize);
                    symbolColor.push(mileStoneProperties.color);
                    console.log("comestoelse", "milestonecheck");
                }
            });
        }
        console.log(symbolValue, symbolSize, symbolColor, "symbol");
        if (frame.data.values.length) {
            // Step 1: Group tasks by resource
            var groupedData = {};
            let dataGrouped = Object.keys(
                option["customSettings"]["columnDetails"],
            ).some((item) => item === "taskgroup");
            let taskGroupIndex =
                option["customSettings"]["columnIndexDetails"]["taskgroup"] ||
                -1;
            let toolTipData = Object.keys(
                option["customSettings"]["columnDetails"],
            ).filter((item) => item === "tooltip");
            toolTipData.forEach((item, index) => {
                option["customSettings"]["columnDetails"][item].forEach(
                    (item) => {
                        toolTipSelected.push(item.name);
                    },
                );
            });
            legendShow =
                option["customSettings"]?.["gantttools"]?.["showLegend"] ||
                false;
            groupViewShow =
                option["customSettings"]?.["gantttools"]?.["showGroupView"] ||
                false;
            toolTipSelectedIndex =
                option["customSettings"]["columnIndexDetails"]["tooltip"] || [];
            console.log(
                dataGrouped,
                "dataGrouped",
                taskGroupIndex,
                "taskGroupIndex",
                toolTipSelectedIndex,
                "tooltipSelectedIndex",
            );
            if (dataGrouped && groupViewShow) {
                yAxisName =
                    taskGroupIndex > -1
                        ? option["customSettings"]["columnDetails"][
                              "taskgroup"
                          ]["name"]
                        : "";
                frame.data.values.forEach((d, index) => {
                    if (!groupedData[d[taskGroupIndex]])
                        groupedData[d[taskGroupIndex]] = [];
                    groupedData[d[taskGroupIndex]].push(d);
                });
                console.log("groupedData", groupedData);
                Object.keys(groupedData).forEach((resource) => {
                    let tasks = groupedData[resource];
                    tasks.sort(
                        (a: any, b: any) =>
                            new Date(a[1]).getTime() - new Date(b[1]).getTime(),
                    ); // Sort by start date

                    let rowIndexes = []; // Tracks task end times per row
                    resourceRows.push(resource); // First row for the resource

                    tasks.forEach((task) => {
                        console.log(task, "task");
                        let taskStart = new Date(task[1]).getTime();
                        let taskEnd = new Date(task[2]).getTime();
                        // Find an available row (avoid overlap)
                        let rowIndex = rowIndexes.findIndex(
                            (endTime) => taskStart >= endTime,
                        );
                        if (rowIndex === -1) {
                            rowIndex = rowIndexes.length;
                            resourceRows.push(""); // Add an empty row for stacking
                        }
                        rowIndexes[rowIndex] = taskEnd; // Update row availability
                        console.log(
                            "seriesValue",
                            [
                                taskStart,
                                resourceRows.length - 1,
                                taskEnd,
                                ...toolTipSelectedIndex.map(
                                    (item) => task[item],
                                ),
                            ],
                            toolTipSelectedIndex,
                        );
                        // Push formatted task data
                        seriesData.push({
                            name: task[0],
                            resource: resource,
                            taskprogress:
                                task[columnIndexDetails["taskprogress"]],
                            value: [
                                taskStart,
                                resourceRows.length - 1,
                                taskEnd,
                                ...toolTipSelectedIndex.map(
                                    (item) => task[item],
                                ),
                            ],
                        });
                    });
                });
                console.log("seriesData", seriesData);
            } else {
                yAxisName =
                    option["customSettings"]["columnDetails"]["task"]["name"];
                // Convert data to proper format
                seriesData = frame.data.values.map((d, index) => ({
                    name: d[columnIndexDetails["task"]],
                    taskprogress: d[columnIndexDetails["taskprogress"]],
                    value: [
                        new Date(d[columnIndexDetails["startdate"]]).getTime(),
                        index,
                        new Date(d[columnIndexDetails["enddate"]]).getTime(),
                        ...toolTipSelectedIndex.map((item) => d[item]),
                    ],
                }));
                resourceRows = frame.data.values.map((d, index) => d[0]);
            }
            if (
                columnIndexDetails.hasOwnProperty("milestone") &&
                columnIndexDetails["milestone"]
            ) {
                console.log(
                    "gantttools",
                    option["customSettings"]["gantttools"],
                );
                let gantttools = option["customSettings"]["gantttools"];
                milestoneData = frame.data.values.map((d, index) => {
                    let mileStoneSymbol = mileStoneProperties.symbol;
                    let symbolSize = mileStoneProperties.symbolSize;
                    let mileStoneDate = new Date(
                        d[columnIndexDetails["milestone"]],
                    ).getTime();
                    let endDate = new Date(
                        d[columnIndexDetails["enddate"]],
                    ).getTime();
                    return {
                        name: `MileStone ${index + 1}`,
                        value: [
                            mileStoneDate,
                            d[columnIndexDetails["task"]],
                            endDate,
                        ],
                        symbol: symbolValue[index],
                        symbolSize: symbolSize[index],
                        itemStyle: {
                            color: symbolColor[index],
                        },
                    };
                });
            }
        }

        let lineData = [];
        let showDisplayValueLabels =
            option["customSettings"]?.["gantttools"]?.[
                "showDisplayValueLabels"
            ] || false;
        if (
            option["series"].some(
                (series) => series.name === "targetDateSegment",
            )
        ) {
            let targetDateSegment = option["series"].filter(
                (item) => item.name === "targetDateSegment",
            );
            targetDateSegment[0] = {
                ...targetDateSegment[0],
                targetDateSegment: true,
                name: targetDateSegment[0]?.["data"]?.length
                    ? "Target Data Segment"
                    : "",
                renderItem: (params, api) => {
                    const x = api.coord([api.value(0), 0])[0];
                    const targetText =
                        option["customSettings"]?.["gantttools"]?.[
                            "targetLineName"
                        ] || "";
                    const targetColor =
                        option["customSettings"]?.["gantttools"]?.[
                            "targetLineColor"
                        ] || "#FF0000";
                    // Convert date to x-axis position
                    const height = params.coordSys.height; // Full chart height return
                    const yBottom = params.coordSys.y + params.coordSys.height;
                    const yTop = params.coordSys.y;
                    console.log(
                        "api",
                        api.value(0),
                        api.value(1),
                        api.value(2),
                        targetText,
                    );
                    return {
                        type: "group",
                        children: [
                            {
                                type: "line",
                                originX: 0,
                                originY: 0,
                                shape: { x1: x, y1: yBottom, x2: x, y2: yTop },
                                style: {
                                    stroke: targetColor, // Line color
                                    lineWidth: 2, // Line thickness
                                    type: "dashed", // Line style
                                },
                            },
                            {
                                type: "text",
                                style: {
                                    x: x,
                                    y: yTop - 10,
                                    text: targetText,
                                    textAlign: "center",
                                    textVerticalAlign: "bottom",
                                },
                            },
                        ],
                    };
                },
            };
            lineData = targetDateSegment;
        }
        option = {
            ...option,
            tooltip: {
                trigger: "item",
                formatter: (params: any) =>
                    chartFormatter(
                        params,
                        toolTipSelectedIndex,
                        frame.data.headers,
                        frame.data.values,
                    ),
            },
            xAxis: {
                type: "time",
                // name: 'Date',
                axisLabel: {
                    formatter: (value) => new Date(value).toLocaleDateString(),
                },
                splitLine: { show: true },
                axisLine: {
                    show: true,
                },
                axisTick: {
                    show: true,
                },
            },
            yAxis: {
                type: "category",
                // name: 'Resource',
                data: resourceRows,
                inverse: true,
            },
            legend: {
                show: legendShow,
            },
            series: [
                ...lineData,
                {
                    type: "custom",
                    chartrendered: true,
                    name: seriesData.length ? "Gannt Chart" : "",
                    renderItem: function (params, api) {
                        console.log(params, api, "api");
                        console.log(
                            seriesData[params.dataIndex].taskprogress,
                            "taskprogress",
                        );
                        var categoryIndex = api.value(1);
                        var start = api.coord([api.value(0), categoryIndex]);
                        var end = api.coord([api.value(2), categoryIndex]);
                        var height = api.size([0, 1])[1] * 0.6;
                        console.log(
                            start,
                            end,
                            height,
                            categoryIndex,
                            api.value(0),
                            api.value(1),
                            api.value(2),
                            api.style(),
                            seriesData[params.dataIndex].name,
                        );
                        let tooltipName = seriesData[params.dataIndex].name
                            ? seriesData[params.dataIndex].name
                            : "";
                        if (taskProgressSelected) {
                            let partialWidth = seriesData[params.dataIndex]
                                .taskprogress
                                ? (end[0] - start[0]) *
                                  (seriesData[params.dataIndex].taskprogress /
                                      100)
                                : end[0] - start[0];
                            console.log(
                                partialWidth,
                                seriesData[params.dataIndex].taskprogress,
                                end[0] - start[0],
                            );
                            return {
                                type: "group",
                                children: [
                                    {
                                        type: "rect",
                                        shape: {
                                            x: start[0],
                                            y: start[1] - height / 2,
                                            width: end[0] - start[0],
                                            height: height,
                                        },
                                        style: {
                                            fill: "lightgrey",
                                            stroke: "#333",
                                        },
                                    },
                                    {
                                        type: "rect",
                                        shape: {
                                            x: start[0],
                                            y: start[1] - height / 2,
                                            width: partialWidth,
                                            height: height,
                                        },
                                        style: {
                                            fill: "#6495ED",
                                            stroke: "#333",
                                        },
                                    },
                                    {
                                        type: "text",
                                        style: {
                                            text: tooltipName,
                                            x: start[0],
                                            y: start[1] - height / 2,
                                            textVerticalAlign: "middle",
                                            textAlign: "center",
                                            fontSize: 15,
                                            opacity: showDisplayValueLabels
                                                ? 1
                                                : 0,
                                        },
                                    },
                                ],
                            };
                        }
                        return {
                            type: "group",
                            children: [
                                {
                                    type: "rect",
                                    chartrendered: true,
                                    shape: {
                                        x: start[0],
                                        y: start[1] - height / 2,
                                        width: end[0] - start[0],
                                        height: height,
                                    },
                                    style: {
                                        fill: "#6495ED",
                                        stroke: "#333",
                                    },
                                },
                                {
                                    type: "text",
                                    style: {
                                        text: tooltipName,
                                        x: start[0],
                                        y: start[1] - height / 2,
                                        textVerticalAlign: "middle",
                                        textAlign: "center",
                                        fontSize: 15,
                                        opacity: showDisplayValueLabels ? 1 : 0,
                                    },
                                },
                            ],
                        };
                    },
                    encode: { x: [0, 2], y: 1 },
                    data: seriesData,
                },
                {
                    type: "scatter",
                    name: milestoneData.length ? "Milestones" : "",
                    milestonerendered: true,
                    label: {
                        show: true,
                        position: "top",
                        formatter: "{b}",
                    },
                    data: milestoneData,
                },
            ],
        };
        return option;
    }, [frame.data.values, data.columns, computedValue]);

    function getQuarterAndMonthList() {
        let startMonth = "Oct";
        let month = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        let startIndex = month.indexOf(startMonth);
        let startIndexTemp = startIndex;
        let quarterObject = {};
        [1, 2, 3, 4].forEach((item) => {
            quarterObject["Q" + item] = [];
            let countsPerQuarter = 3;
            for (let i = 0; i < countsPerQuarter; i++) {
                if (startIndexTemp == month.length) {
                    startIndexTemp = month.length % 12;
                }
                quarterObject["Q" + item][i] = month[startIndexTemp];
                startIndexTemp++;
            }
        });
        let monthBasedQuarter = {};

        console.log(quarterObject, "QuarterObject");
    }

    useEffect(() => {
        if (!frame.isLoading && frame.data.values.length > 0) {
            updateChart(dataOption, "option");
        }
    }, [frame.data.values]);

    function chartFormatter(params, tooltipData, frameHeaders, frameValues) {
        console.log("params", params);
        let chartToolTip = `<b>${params.name}</b><br>
            Start: ${new Date(params.value[0]).toLocaleDateString()}<br>
            End: ${new Date(params.value[2]).toLocaleDateString()}<br>`;
        tooltipData.forEach((item, index) => {
            console.log("item", item, frameValues);
            chartToolTip += `${frameHeaders[item]}: ${
                frameValues[params.dataIndex][item]
            }<br>`;
        });
        return chartToolTip;
    }
    console.log(dataOption, "dataOptionEcharts");
    const rows = [
        {
            month1: "Jan",
            month2: "Feb",
            month3: "Mar",
        },
        {
            month1: "Apr",
            month2: "May",
            month3: "Jun",
        },
        {
            month1: "Jul",
            month2: "Aug",
            month3: "Sep",
        },
        {
            month1: "Oct",
            month2: "Nov",
            month3: "Dec",
        },
    ];
    let rows1 = [
        {
            name: "Frozen yoghurt",
            calories: 159,
            fat: 6.0,
            carbs: 24,
            protein: 4.0,
        },
    ];
    getQuarterAndMonthList();
    return (
        <>
            <StyledMainContainer id={id}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <StyledTableCell
                                backgroundColor="#0471f0"
                                size="small"
                                colSpan={3}
                                align="center"
                            >
                                Q1
                            </StyledTableCell>
                            {/* <StyledTableCell backgroundColor="#0471f0" size='small' align="right">Calories</StyledTableCell> */}
                            <StyledTableCell
                                backgroundColor="#0471f0"
                                size="small"
                                colSpan={3}
                                align="center"
                            >
                                Q2
                            </StyledTableCell>
                            <StyledTableCell
                                backgroundColor="#0471f0"
                                size="small"
                                colSpan={3}
                                align="center"
                            >
                                Q3
                            </StyledTableCell>
                            <StyledTableCell
                                backgroundColor="#0471f0"
                                size="small"
                                colSpan={3}
                                align="center"
                            >
                                Q4
                            </StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow
                            sx={{
                                "&:last-child td, &:last-child th": {
                                    border: "1px solid grey",
                                },
                            }}
                        >
                            {rows.map((row, index) => (
                                <>
                                    <StyledTableCell
                                        component="th"
                                        scope="row"
                                        size="small"
                                    >
                                        {row.month1}
                                    </StyledTableCell>
                                    <StyledTableCell size="small" align="right">
                                        {row.month2}
                                    </StyledTableCell>
                                    <StyledTableCell size="small" align="right">
                                        {row.month3}
                                    </StyledTableCell>
                                </>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>

                <ReactECharts option={dataOption} />
            </StyledMainContainer>
        </>
    );
});
