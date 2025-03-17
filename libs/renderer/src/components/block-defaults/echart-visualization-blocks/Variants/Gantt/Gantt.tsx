import ReactECharts from "echarts-for-react";
import { observer } from "mobx-react-lite";
import { useBlock, useBlockSettings, useFrame } from "../../../../../hooks";
import { styled, TableContainer } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { getValueByPath } from "@/utility";
import { Paper, Table } from "@mui/material";
import { TableHead } from "@mui/material";
import { TableRow, TableCell, TableBody } from "@mui/material";
import { VizBlockContextMenu } from "../../VizBlockContextMenu";
import { GANTT_CHART } from "../../Visualization.constants";
import { BlockDef } from "../../../../../store";

const StyledMainContainer = styled("div")(({ theme }) => ({}));

const StyledSubContainer = styled("div")(({ theme }) => ({
    padding: "0.5rem",
}));

const StyledContainer = styled("div")(() => ({
    display: "flex",
    justifyContent: "flex-start",
}));

const StyledDataSpan = styled("span")(({}) => ({}));

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

export const Gantt = observer(
    <D extends BlockDef = BlockDef>({ id, updateChart }: GanttProps) => {
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
        const [contextMenu, setContextMenu] = useState<{
            mouseX: number; //x axis position for the click/brush event
            mouseY: number; //y axis position for the click/brush event
            value: unknown; //value can be of object or string or number type
        } | null>(null);
        const tableRef = useRef(null);
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

        let dataOption = useMemo(() => {
            let option = JSON.parse(computedValue);
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
            let mileStoneProperties = {
                symbol: GANTT_CHART.MILESTONE_SYMBOL,
                color: GANTT_CHART.MILESTONE_COLOR,
                symbolSize: GANTT_CHART.MILESTONE_SYMBOL_SIZE,
            };
            let symbolValue = [];
            let symbolSize = [];
            let symbolColor = [];
            let legendShow = false;
            let groupViewShow = false;
            let columnIndexDetails =
                option["customSettings"]["columnIndexDetails"];

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

                    let ganttToolsDimensionValues =
                        ganttToolsSelected?.dimensionValues?.map(
                            (item, index) => new Date(item).getTime(),
                        ) || [];

                    if (
                        ganttToolsSelected?.dimensionSelected === "milestone" &&
                        ganttToolsDimensionValues?.includes(mileStoneDate)
                    ) {
                        symbolValue.push(ganttToolsSelected.symbol);
                        symbolSize.push(ganttToolsSelected.symbolSize);
                        symbolColor.push(ganttToolsSelected.symbolColor);
                    } else {
                        symbolValue.push(mileStoneProperties.symbol);
                        symbolSize.push(mileStoneProperties.symbolSize);
                        symbolColor.push(mileStoneProperties.color);
                    }
                });
            }
            if (frame.data.values.length) {
                // Step 1: Group tasks by resource
                var groupedData = {};
                let dataGrouped = Object.keys(
                    option["customSettings"]["columnDetails"],
                ).some((item) => item === "taskgroup");
                let taskGroupIndex =
                    option["customSettings"]["columnIndexDetails"][
                        "taskgroup"
                    ] || -1;
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
                    option["customSettings"]?.["gantttools"]?.[
                        "showGroupView"
                    ] || false;
                toolTipSelectedIndex =
                    option["customSettings"]["columnIndexDetails"]["tooltip"] ||
                    [];

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

                    Object.keys(groupedData).forEach((resource) => {
                        let tasks = groupedData[resource];
                        tasks.sort(
                            (a: any, b: any) =>
                                new Date(a[1]).getTime() -
                                new Date(b[1]).getTime(),
                        ); // Sort by start date

                        let rowIndexes = []; // Tracks task end times per row
                        resourceRows.push(resource); // First row for the resource

                        tasks.forEach((task) => {
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
                } else {
                    yAxisName =
                        option["customSettings"]["columnDetails"]["task"][
                            "name"
                        ];
                    // Convert data to proper format
                    seriesData = frame.data.values.map((d, index) => ({
                        name: d[columnIndexDetails["task"]],
                        taskprogress: d[columnIndexDetails["taskprogress"]],
                        value: [
                            new Date(
                                d[columnIndexDetails["startdate"]],
                            ).getTime(),
                            index,
                            new Date(
                                d[columnIndexDetails["enddate"]],
                            ).getTime(),
                            ...toolTipSelectedIndex.map((item) => d[item]),
                        ],
                    }));
                    resourceRows = frame.data.values.map((d, index) => d[0]);
                }
                if (
                    columnIndexDetails.hasOwnProperty("milestone") &&
                    columnIndexDetails["milestone"]
                ) {
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
                            mileStoneOriginalDate:
                                d[columnIndexDetails["milestone"]],
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
            let mainSeriesName =
                option["customSettings"]?.["columnDetails"]?.["task"]?.["name"];
            let mainSeriesFrameName =
                option["customSettings"]?.["columnDetails"]?.["task"]?.[
                    "selector"
                ];
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
                    // name: targetDateSegment[0]?.["data"]?.length
                    //     ? "Target Data Segment"
                    //     : "",
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
                        const yBottom =
                            params.coordSys.y + params.coordSys.height;
                        const yTop = params.coordSys.y;
                        return {
                            type: "group",
                            children: [
                                {
                                    type: "line",
                                    originX: 0,
                                    originY: 0,
                                    shape: {
                                        x1: x,
                                        y1: yBottom,
                                        x2: x,
                                        y2: yTop,
                                    },
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
                if (
                    option["customSettings"]?.["gantttools"]?.["targetDate"] !=
                    ""
                ) {
                    lineData = targetDateSegment;
                } else {
                    lineData = [];
                }
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
                        formatter: (value) =>
                            new Date(value).toLocaleDateString(),
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
                        name: mainSeriesName,
                        frameName: mainSeriesFrameName,
                        renderItem: function (params, api) {
                            var categoryIndex = api.value(1);
                            var start = api.coord([
                                api.value(0),
                                categoryIndex,
                            ]);
                            var end = api.coord([api.value(2), categoryIndex]);
                            var height = api.size([0, 1])[1] * 0.6;
                            let tooltipName = seriesData[params.dataIndex].name
                                ? seriesData[params.dataIndex].name
                                : "";
                            if (taskProgressSelected) {
                                let partialWidth = seriesData[params.dataIndex]
                                    .taskprogress
                                    ? (end[0] - start[0]) *
                                      (seriesData[params.dataIndex]
                                          .taskprogress /
                                          100)
                                    : end[0] - start[0];

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
                                            opacity: showDisplayValueLabels
                                                ? 1
                                                : 0,
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
                            show: showDisplayValueLabels ? true : false,
                            position: "top",
                            formatter: "{b}",
                        },
                        data: milestoneData,
                    },
                ],
            };
            return option;
        }, [frame.data.values, data.columns, computedValue]);

        function getQuarterAndMonthList(startFiscalMonth) {
            let startMonth = startFiscalMonth;
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
            let monthBasedQuarter = [];
            let lastMonthInQuarter = "";
            month.forEach((item, index) => {
                let monthExistsInQuarter = "";
                for (let i = 0; i < 4; i++) {
                    if (
                        quarterObject["Q" + (i + 1)].some(
                            (qoItem) => item === qoItem,
                        )
                    ) {
                        monthExistsInQuarter = "Q" + (i + 1);
                    }
                }
                let quarterExistsInArray = monthBasedQuarter
                    .reverse()
                    .findIndex(
                        (mbitem, mbindex) =>
                            monthExistsInQuarter === mbitem.name,
                    );
                if (
                    quarterExistsInArray >= 0 &&
                    lastMonthInQuarter == monthExistsInQuarter
                ) {
                    monthBasedQuarter[quarterExistsInArray]["month"] = [
                        ...monthBasedQuarter[quarterExistsInArray]["month"],
                        item,
                    ];
                } else {
                    monthBasedQuarter = [
                        ...monthBasedQuarter,
                        {
                            name: monthExistsInQuarter,
                            month: [item],
                            order: monthBasedQuarter.length + 1,
                        },
                    ];
                }
                lastMonthInQuarter = monthExistsInQuarter;
            });
            let FYYear =
                parseInt(
                    dataOption["customSettings"]?.["gantttools"]?.[
                        "fiscalYearValue"
                    ]?.substring(2),
                ) + 1;
            monthBasedQuarter = monthBasedQuarter.map((item, index) => {
                return {
                    ...item,
                    ["colSpan"]: item.month.length,
                };
            });
            monthBasedQuarter = monthBasedQuarter.sort(
                (item, item1) => item.order - item1.order,
            );
            let monthSelected =
                dataOption["customSettings"]?.["gantttools"]?.[
                    "fiscalYearStart"
                ];
            let yearQuarterIndex = monthBasedQuarter.findIndex((item) =>
                item.month.includes(monthSelected),
            );
            monthBasedQuarter = monthBasedQuarter.map((item, index) => {
                return {
                    ...item,
                    ["fiscalYear"]: isNaN(FYYear)
                        ? ""
                        : index < yearQuarterIndex
                        ? "FY" + (FYYear - 1)
                        : "FY" + FYYear,
                };
            });
            return monthBasedQuarter;
        }

        useEffect(() => {
            if (!frame.isLoading && frame.data.values.length > 0) {
                updateChart(dataOption, "option");
            }
        }, [frame.data.values]);

        function chartFormatter(
            params,
            tooltipData,
            frameHeaders,
            frameValues,
        ) {
            let chartToolTip = `<b>${params.name}</b><br>
            Start: ${new Date(params.value[0]).toLocaleDateString()}<br>
            End: ${new Date(params.value[2]).toLocaleDateString()}<br>`;
            tooltipData.forEach((item, index) => {
                chartToolTip += `${frameHeaders[item]}: ${
                    frameValues[params.dataIndex][item]
                }<br>`;
            });
            return chartToolTip;
        }

        const enableFiscalAxis =
            dataOption["customSettings"]?.["gantttools"]?.[
                "enableFiscalAxis"
            ] || false;
        const fiscalStartMonth =
            dataOption["customSettings"]?.["gantttools"]?.["fiscalYearStart"] ||
            "Jan";
        const fiscalAxisBackgroundColor =
            dataOption["customSettings"]?.["gantttools"]?.[
                "fiscalAxisBackgroundColor"
            ] || "#0471f0";
        const quarterAndMonth = getQuarterAndMonthList(fiscalStartMonth);
        const tableHeight = tableRef.current?.getBoundingClientRect()?.height
            ? tableRef.current?.getBoundingClientRect()?.height
            : 70;
        let seriesName =
            dataOption["customSettings"]?.["columnDetails"]?.["task"]?.name ||
            "";
        const onClickChart = {
            //when contextmenu event is raised, default context menu made hidden, and custom component is shown
            contextmenu: (params) => {
                if (params.data) {
                    let taskColumn = params.data.name;
                    let parsedJson = JSON.parse(computedValue);
                    let taskName =
                        parsedJson["series"][params.seriesIndex]["frameName"];
                    setContextMenu(
                        contextMenu === null
                            ? {
                                  mouseX: params.event.event.clientX,
                                  mouseY: params.event.event.clientY,
                                  value: {
                                      label: taskName,
                                      value: taskColumn,
                                  },
                              }
                            : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                              // Other native context menus might behave different.
                              // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                              null,
                    );
                    params.event.event.preventDefault();
                } else {
                    params.event.event.preventDefault();
                }
            },
        };
        return (
            <>
                <StyledMainContainer id={id}>
                    {enableFiscalAxis && (
                        <StyledContainer>
                            <StyledDataSpan
                                style={{
                                    backgroundColor: fiscalAxisBackgroundColor,
                                    height: tableHeight + "px",
                                    width: "50px",
                                    textAlign: "center",
                                    display: "flex",
                                    margin: "auto",
                                    alignContent: "space-around",
                                    flexWrap: "wrap",
                                    borderRadius: "5px",
                                    justifyContent: "center",
                                }}
                            >
                                {seriesName}
                            </StyledDataSpan>
                            <Table aria-label="simple table" ref={tableRef}>
                                <TableHead>
                                    <TableRow>
                                        {quarterAndMonth.length &&
                                            quarterAndMonth.map((item) => (
                                                <StyledTableCell
                                                    backgroundColor={
                                                        fiscalAxisBackgroundColor
                                                    }
                                                    size="small"
                                                    colSpan={item?.colSpan}
                                                    align="center"
                                                >
                                                    {item.name}{" "}
                                                    {item.hasOwnProperty(
                                                        "fiscalYear",
                                                    ) &&
                                                    item["fiscalYear"] != ""
                                                        ? `(${item["fiscalYear"]})`
                                                        : ""}
                                                </StyledTableCell>
                                            ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow
                                        sx={{
                                            "&:last-child td, &:last-child th":
                                                {
                                                    border: "1px solid grey",
                                                },
                                        }}
                                    >
                                        {quarterAndMonth.length &&
                                            quarterAndMonth.map((item) =>
                                                item["month"].map(
                                                    (monthItem) => (
                                                        <StyledTableCell
                                                            component={"td"}
                                                            scope="row"
                                                            size="small"
                                                        >
                                                            {monthItem}
                                                        </StyledTableCell>
                                                    ),
                                                ),
                                            )}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </StyledContainer>
                    )}

                    <ReactECharts option={dataOption} onEvents={onClickChart} />
                    <VizBlockContextMenu
                        id={id}
                        frame={frame}
                        contextMenu={contextMenu}
                        onClose={() => setContextMenu(null)}
                    />
                </StyledMainContainer>
            </>
        );
    },
);
