import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { PathValue } from "react-hook-form";
import { Menu, MenuItem } from "@mui/material";

import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { useBlock, useFrame } from "../../../../../hooks";

export interface ChartContextMenuProps {
    id: string;
    frame: ReturnType<typeof useFrame>;
    contextMenu: {
        mouseX: number;
        mouseY: number;
        value: any;
    } | null;
    chartInstance: any;
    onClose: () => void;
}
//Open this contextmenu when right click event is triggered
export const ChartContextMenu: React.FC<ChartContextMenuProps> = observer(
    ({ id, frame, contextMenu, chartInstance, onClose }) => {
        const { data, setData } = useBlock<EchartVisualizationBlockDef>(id);
        const currentOperation = useRef({
            unfilterActive: false,
            filterActive: false,
            excludeActive: false,
        });
        //Checking the current action state for filtering and unfiltering to set and update the data to chart using setoption and setData
        useEffect(() => {
            if (frame.isLoading === false && frame.error === undefined) {
                //in contextmenu, when the unfilter is made active
                if (currentOperation.current.unfilterActive) {
                    try {
                        const optionDataProcessed = processReceivedData(
                            frame.data,
                        );
                        data.option["xAxis"]["data"] =
                            optionDataProcessed["xAxis"];
                        data.option["series"][0]["data"] =
                            optionDataProcessed["yAxis"];
                        setData("option", data.option as PathValue<any, any>);
                        if (chartInstance.setOption !== null) {
                            chartInstance.setOption(data.option);
                            currentOperation.current.unfilterActive = false;
                        }
                    } catch (e) {}
                }
                //in contextmenu, when the filter is made active
                if (currentOperation.current.filterActive) {
                    try {
                        const optionDataProcessed = processReceivedData(
                            frame.data,
                        );
                        data.option["xAxis"]["data"] =
                            optionDataProcessed["xAxis"];
                        data.option["series"][0]["data"] =
                            optionDataProcessed["yAxis"];
                        setData("option", data.option as PathValue<any, any>);
                        if (chartInstance.setOption !== null) {
                            chartInstance.setOption(data.option);
                            currentOperation.current.filterActive = false;
                            contextMenu = {
                                ...contextMenu,
                                ["value"]: null,
                            };
                            disableSelection();
                        }
                    } catch (e) {}
                }
                //in contextmenu, when the exclude is made active
                if (currentOperation.current.excludeActive) {
                    try {
                        const optionDataProcessed = processReceivedData(
                            frame.data,
                        );
                        data.option["xAxis"]["data"] =
                            optionDataProcessed["xAxis"];
                        data.option["series"][0]["data"] =
                            optionDataProcessed["yAxis"];
                        setData("option", data.option as PathValue<any, any>);
                        if (chartInstance.setOption !== null) {
                            chartInstance.setOption(data.option);
                            currentOperation.current.excludeActive = false;
                            contextMenu = {
                                ...contextMenu,
                                ["value"]: null,
                            };
                            disableSelection();
                        }
                    } catch (e) {}
                }
            }
        }, [frame.data]);
        //run disable selection in a delay after filter action is completed
        function disableSelection() {
            setTimeout(() => {
                chartInstance.dispatchAction({
                    type: "brush",
                    areas: [],
                });
            }, 500);
        }
        //convert the received data from frame and update the data in the format for setting to chart
        function processReceivedData(frameResult) {
            return {
                xAxis: frameResult.values.map((item) => {
                    return item[0];
                }),
                yAxis: frameResult.values.map((item) => {
                    return item[1];
                }),
            };
        }
        return (
            <Menu
                open={contextMenu !== null}
                onClose={() => onClose()}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? {
                              top: contextMenu.mouseY,
                              left: contextMenu.mouseX,
                          }
                        : undefined
                }
            >
                {contextMenu && !data.contextMenu?.hideUnfilter ? (
                    <MenuItem
                        dense={true}
                        value={"unfilter"}
                        onClick={() => {
                            frame.unfilter();
                            let optionUp = data.option;
                            const reUpdate = data.option["series"];
                            optionUp = {
                                ...optionUp,
                                ["series"]: null,
                            };
                            try {
                                setData(
                                    "option",
                                    optionUp as PathValue<any, any>,
                                );
                                currentOperation.current.unfilterActive = true;
                            } catch (e) {}

                            onClose();
                        }}
                    >
                        Unfilter
                    </MenuItem>
                ) : null}
                {contextMenu && !data.contextMenu?.hideFilter ? (
                    <MenuItem
                        dense={true}
                        value={"filter"}
                        onClick={() => {
                            frame.filter(
                                `SetFrameFilter(${
                                    contextMenu.value.name
                                }==${JSON.stringify(contextMenu.value.value)})`,
                            );
                            let optionUp = data.option;
                            const reUpdate = data.option["series"];
                            optionUp = {
                                ...optionUp,
                                ["series"]: null,
                            };
                            setData("option", optionUp as PathValue<any, any>);
                            currentOperation.current.filterActive = true;
                            onClose();
                        }}
                    >
                        Filter {contextMenu.value.name} ==
                        {typeof contextMenu.value === "string"
                            ? contextMenu.value
                            : JSON.stringify(contextMenu.value.value)}
                    </MenuItem>
                ) : null}
                {contextMenu && !data.contextMenu?.hideExclude ? (
                    <MenuItem
                        dense={true}
                        value={"exclude"}
                        onClick={() => {
                            frame.filter(
                                `SetFrameFilter(${contextMenu.value.name}!="${contextMenu.value.value}")`,
                            );
                            let optionUp = data.option;
                            const reUpdate = data.option["series"];
                            optionUp = {
                                ...optionUp,
                                ["series"]: null,
                            };
                            setData("option", optionUp as PathValue<any, any>);
                            currentOperation.current.excludeActive = true;
                            onClose();
                        }}
                    >
                        Exclude {contextMenu.value.name} !={" "}
                        {contextMenu?.value?.value}
                    </MenuItem>
                ) : null}
            </Menu>
        );
    },
);
