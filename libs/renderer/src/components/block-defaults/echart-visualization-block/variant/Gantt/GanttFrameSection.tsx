import { ChangeEvent, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Autocomplete } from "@mui/material";
import { Button, Select, TextField } from "@semoss/ui";
import {
    useBlockSettings,
    useBlocksPixel,
    useFrameHeaders,
} from "../../../../../hooks";
import styled from "@emotion/styled";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { BlockDef } from "../../../../../store";
import { PathValue } from "../../../../../types";

interface GanttFrameSectionProps {
    id: string;
}
//styled main container
const StyledMainContainer = styled("div")(() => ({}));
//styled frame section
const StyledFrameSection = styled("div")(() => ({}));
//dropdown section with custom styling
const StyledDataSection = styled("div")(() => ({
    display: "block",
    padding: "0.65rem",
}));
//select section with full width
const StyledSelect = styled(Select)(() => ({
    width: "100%",
}));
export const GanttFrameSection = observer(
    <D extends BlockDef = BlockDef>({ id, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id); //block data
        const [columnsData, setColumnsData] = useState([]); //column data to select for various fields
        const [framesData, setFramesData] = useState({
            task: "",
            startdate: "",
            enddate: "",
            taskgroup: "",
            taskprogress: "",
            milestone: "",
            tooltip: [],
        }); // frame component data
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get all of the frames
        const getFrames = useBlocksPixel<string[]>("GetFrames();", {
            data: [],
        });
        const options = getFrames.status === "SUCCESS" ? getFrames.data : [];
        // using frameheaders hook to get the header details for the selected frame
        const frameHeaders = useFrameHeaders(data.frame?.name);
        const columns = frameHeaders.data.list.map((item) => {
            return {
                name: item.alias,
                selector: item.header,
                width: undefined,
            };
        });
        const columnsSelected = data.columns;
        //retain the frame section component with state data
        useEffect(() => {
            const optionData = data.option;
            if (
                optionData.hasOwnProperty("customSettings") &&
                optionData["customSettings"].hasOwnProperty("columnDetails")
            ) {
                const columnDetails =
                    optionData["customSettings"]["columnDetails"] || {};
                const fieldsState = { ...framesData };
                Object.keys(columnDetails).forEach((item, index) => {
                    if (
                        typeof columnDetails[item] === "object" &&
                        Array.isArray(columnDetails[item])
                    ) {
                        fieldsState[item] = columnDetails[item].map(
                            (item) => item.selector,
                        );
                    } else {
                        fieldsState[item] = columnDetails[item]["selector"];
                    }
                });
                setFramesData((prevFramesData) => {
                    return {
                        ...prevFramesData,
                        ...fieldsState,
                    };
                });
            }
        }, []);
        //update the state when the frame section fields are changed
        useEffect(() => {
            if (
                framesData.task != "" &&
                framesData.startdate != "" &&
                framesData.enddate != "" &&
                columns.length
            ) {
                let columnsToSet = [];
                const columnsObject = {};

                const columnsTask = columns.find(
                    (item) => item.selector === framesData.task,
                );
                if (columnsTask.hasOwnProperty("name")) {
                    columnsToSet.push(columnsTask);
                    columnsObject["task"] = columnsTask;
                }
                const columnsStartDate = columns.find(
                    (item) => item.selector === framesData.startdate,
                );
                if (columnsStartDate.hasOwnProperty("name")) {
                    columnsToSet.push(columnsStartDate);
                    columnsObject["startdate"] = columnsStartDate;
                }
                const columnsEndDate = columns.find(
                    (item) => item.selector === framesData.enddate,
                );
                if (columnsEndDate.hasOwnProperty("name")) {
                    columnsToSet.push(columnsEndDate);
                    columnsObject["enddate"] = columnsEndDate;
                }
                if (framesData?.taskgroup !== "") {
                    const columnsTaskGroup = columns.find(
                        (item) => item.selector === framesData.taskgroup,
                    );
                    if (
                        columnsTaskGroup != undefined &&
                        columnsTaskGroup.hasOwnProperty("name")
                    ) {
                        columnsToSet.push(columnsTaskGroup);
                        columnsObject["taskgroup"] = columnsTaskGroup;
                    }
                }
                if (framesData?.taskprogress !== "") {
                    const columnsTaskProgress = columns.find(
                        (item) => item.selector === framesData.taskprogress,
                    );
                    if (
                        columnsTaskProgress != undefined &&
                        columnsTaskProgress.hasOwnProperty("name")
                    ) {
                        columnsToSet.push(columnsTaskProgress);
                        columnsObject["taskprogress"] = columnsTaskProgress;
                    }
                }
                if (framesData.milestone !== "") {
                    const columnsMileStone = columns.find(
                        (item) => item.selector === framesData.milestone,
                    );
                    if (
                        columnsMileStone != undefined &&
                        columnsMileStone.hasOwnProperty("name")
                    ) {
                        columnsToSet.push(columnsMileStone);
                        columnsObject["milestone"] = columnsMileStone;
                    }
                }
                if (framesData?.tooltip?.length) {
                    const columnsToolTip = columns.filter((item) =>
                        framesData.tooltip.includes(item.selector),
                    );
                    if (columnsToolTip.length) {
                        columnsToSet = [...columnsToSet, ...columnsToolTip];
                        columnsObject["tooltip"] = columnsToolTip;
                    }
                }
                const tempDataSet = new Set(columnsToSet);
                columnsToSet = Array.from(tempDataSet);
                const columnsIndexToSet = getColumnIndexToSetData(
                    columnsObject,
                    columnsToSet,
                );
                setData("columns", columnsToSet);
                if (
                    data.option.hasOwnProperty("customSettings") &&
                    data.option["customSettings"].hasOwnProperty(
                        "columnDetails",
                    )
                ) {
                    let option = data.option;
                    option = {
                        ...option,
                        ["customSettings"]: {
                            ...option["customSettings"],
                            ["columnDetails"]: {
                                ...columnsObject,
                            },
                            ["columnIndexDetails"]: {
                                ...columnsIndexToSet,
                            },
                        },
                    };
                    setData(
                        "option",
                        option as PathValue<D["data"], typeof path>,
                    );
                }
            }
        }, [framesData]);
        //get the columns index, to use in selector for fetching the records from backend
        function getColumnIndexToSetData(columnsObject, columnsToSet) {
            const colIndex = {};
            Object.keys(columnsObject).forEach((item, index) => {
                if (
                    typeof columnsObject[item] === "object" &&
                    Array.isArray(columnsObject[item])
                ) {
                    colIndex[item] = [];
                    columnsObject[item].forEach((colObjItem, colObjIndex) => {
                        const indexToUpdate = columnsToSet.findIndex(
                            (colSetItem, colSetIndex) =>
                                colSetItem.selector === colObjItem.selector,
                        );
                        colIndex[item].push(indexToUpdate);
                    });
                    colIndex[item].sort();
                } else {
                    colIndex[item] = columnsToSet.findIndex(
                        (colSetItem, colSetIndex) =>
                            colSetItem.selector ===
                            columnsObject[item].selector,
                    );
                }
            });
            return colIndex;
        }
        //update the fields when the frame section fields are changed
        function updateFields(fieldName, event) {
            setFramesData((prevFrameData) => {
                return {
                    ...prevFrameData,
                    [fieldName]: event.target.value,
                };
            });
            // setData('columns',);
        }

        return (
            <StyledMainContainer>
                <StyledFrameSection>
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
                </StyledFrameSection>
                <StyledDataSection>
                    <label htmlFor="task-field">Task</label>
                    <StyledSelect
                        id="task-field"
                        label="Select X Axis Field"
                        SelectProps={{
                            multiple: false,
                        }}
                        value={framesData.task}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields("task", e)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select X Axis Field
                        </Select.Item>
                        {columns?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDataSection>
                <StyledDataSection>
                    <label htmlFor="start-date-field">Start Date</label>
                    <StyledSelect
                        id="start-date-field"
                        label="Select Start Date"
                        SelectProps={{
                            multiple: false,
                        }}
                        value={framesData.startdate}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields("startdate", e)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select Start Date
                        </Select.Item>
                        {columns?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDataSection>
                <StyledDataSection>
                    <label htmlFor="end-date-field">End Date</label>
                    <StyledSelect
                        id="end-date-field"
                        label="Select End Date"
                        SelectProps={{
                            multiple: false,
                        }}
                        value={framesData.enddate}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields("enddate", e)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select End Date
                        </Select.Item>
                        {columns?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDataSection>
                <StyledDataSection>
                    <label htmlFor="task-group-field">Task Group</label>
                    <StyledSelect
                        id="task-group-field"
                        label="Select Task Group"
                        SelectProps={{
                            multiple: false,
                        }}
                        value={framesData.taskgroup}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields("taskgroup", e)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select Task Group
                        </Select.Item>
                        {columns?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDataSection>
                <StyledDataSection>
                    <label htmlFor="task-progress-field">Task Progress</label>
                    <StyledSelect
                        id="task-progress-field"
                        label="Select Task Progress"
                        SelectProps={{
                            multiple: false,
                        }}
                        value={framesData.taskprogress}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields("taskprogress", e)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select Task Progress
                        </Select.Item>
                        {columns?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDataSection>
                <StyledDataSection>
                    <label htmlFor="milestone-field">MileStone</label>
                    <StyledSelect
                        id="milestone-field"
                        label="Select MileStone"
                        SelectProps={{
                            multiple: false,
                        }}
                        value={framesData.milestone}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields("milestone", e)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select Milestone
                        </Select.Item>
                        {columns?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDataSection>
                <StyledDataSection>
                    <label htmlFor="tooltip-field">Tooltip</label>
                    <StyledSelect
                        id="tooltip-field"
                        label="Select Tooltip"
                        SelectProps={{
                            multiple: true,
                        }}
                        value={framesData.tooltip}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields("tooltip", e)
                        }
                    >
                        <Select.Item key="-1" value="">
                            Select Tooltip
                        </Select.Item>
                        {columns?.map((label, index) => {
                            return (
                                <Select.Item value={label.selector} key={index}>
                                    {label.name}
                                </Select.Item>
                            );
                        })}
                    </StyledSelect>
                </StyledDataSection>
            </StyledMainContainer>
        );
    },
);
