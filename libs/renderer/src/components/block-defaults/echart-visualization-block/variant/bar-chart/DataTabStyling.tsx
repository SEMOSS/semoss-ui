import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, TextField, styled } from "@semoss/ui";
import { observer } from "mobx-react-lite";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { useBlockSettings, useBlocksPixel, useFrameHeaders } from "../../../../../hooks";
import { BlockDef } from "../../../../../store";
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Switch from '@mui/material/Switch';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const StyledMain = styled("div")(() => ({
    width: "100%",
    height: "100%",
    marginTop: "1px",
}));
const StyledSpanFrame = styled("span")(() => ({
    fontSize: "1rem",
    color: "#808080",
    paddingLeft: "16px",
    position: "relative",
}));
const StyledSpanLabel = styled("span")(() => ({
    fontSize: "1rem",
    paddingLeft: "16px",
    position: "relative",
}));
const StyledSubSection = styled("div")(() => ({
    display: "flex",
    justifyContent: "center",
    padding: "0.5rem",
    width: "100%",
    marginTop: "5px",
}));
const StyledDroppable = styled("div")(() => ({
    marginTop: "8px",
}));
const StyledLabelSection = styled("div")(() => ({
    display: "flex",
    width: "100%",
}));
const StyledSwitchSection = styled("div")(() => ({
    display: "flex",
    marginTop: "15px",
    marginLeft: "8px",
    width: "100%",
}));
const StyledSpanSwitch = styled("span")(() => ({
    fontSize: "1rem",
    color: "#808080",
    marginTop: "5px",
    position: "relative",
}));
const DropContainer = styled("div")(() => ({
    padding: "8px",
    minHeight: "50px",
    border: "1px dashed #ccc",
    display: "flex",
    alignItems: "center",
}));

export const DataTabStyling = observer(
    <D extends BlockDef = BlockDef>({ id, updateFrame, path, dragdropColumns, deleteColumns, formmattedColumns,isAdd , syncHeader, chart, storedColumns}) => {
        const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
        const [columnsData, setColumnsData] = useState([]);
        const [droppedColumns, setDroppedColumns] = useState<string[]>([]);
        const [selectedColumns, setSelectedColumns] = useState<Record<string, string[]>>(() => {
            return storedColumns || {}; // Initialize with storedColumns if available
        });
        const [checkedInstruction, setCheckedInstruction] = useState(false);
        const [checkedVisual, setCheckedVisual] = useState(false);
        const [isAddIcon, setIsAddIcon] =useState(false);
        const getFrames = useBlocksPixel<string[]>("GetFrames();", { data: [] });
        const options = getFrames.status === "SUCCESS" ? getFrames.data : [];

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
            const updatedColumns = { ...selectedColumns };
            storedColumns.forEach((item, index) => {
                const key = `data-tab-drop-area-${index}`;
                if (item.values && item.values.length > 0) {
                    updatedColumns[key] = item.values;
                }
            });
            if (JSON.stringify(updatedColumns) !== JSON.stringify(selectedColumns)) {
                setSelectedColumns(updatedColumns);
            }
        }, [JSON.stringify(storedColumns)]);

        useEffect(() => {
            const updatedColumns = { ...dragdropColumns , ...selectedColumns };

            chart.forEach((item, index) => {
                const key = `data-tab-drop-area-${index}`;
                if (!item.multiLabel && updatedColumns[key]?.length > 1) {
                    // Restrict to only one value if multiLabel is false
                    updatedColumns[key] = [updatedColumns[key][0]];
                }
            });

            setSelectedColumns(updatedColumns);
        }, [dragdropColumns]);

        useEffect(() => {
            const formattedArray = chart.map((item, index) => {
                const key = `data-tab-drop-area-${index}`;
                const matchedColumns = columnsSelector.filter((column) =>
                    selectedColumns[key]?.includes(column.name)
                );
                return {
                    name: item.name,
                    label: item.label,
                    values: selectedColumns[key] || [],
                    selectors: matchedColumns.map((column) => column.selector),
                    dataType: matchedColumns.map((column) => column.dataType),
                };
            });

            formmattedColumns(formattedArray,data.variation);
        }, [selectedColumns]);

        return (
            <StyledMain>
                <StyledSpanFrame>Selected Frame</StyledSpanFrame>
                <StyledSubSection>
                    <Autocomplete
                        fullWidth
                        id="Echart-Frame"
                        multiple={false}
                        disabled={getFrames.status !== "SUCCESS"}
                        value={data.frame?.name}
                        options={options}
                        getOptionLabel={(option) => option}
                        onChange={(_, value) => {
                            setData("frame.name", value);
                            syncHeader(value);
                        }}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField {...params} placeholder="Select frame" size="small" variant="outlined" />
                        )}
                    />
                </StyledSubSection>
                <StyledSpanFrame>Selected Visual</StyledSpanFrame>
                <StyledSubSection>
                    <Autocomplete
                        fullWidth
                        id="Echart-Visuals"
                        multiple={false}
                        disabled={getFrames.status !== "SUCCESS"}
                        options={options}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField {...params} size="small" variant="outlined" />
                        )}
                    />
                </StyledSubSection>

                {/* Drag and Drop Input Field */}
                {chart.map((item, index) => (
                    <StyledDroppable key={index}>
                        <StyledLabelSection>
                            <StyledSpanLabel>Select {item.name}</StyledSpanLabel>
                            <InfoOutlinedIcon
                                style={{
                                    color: "#888",
                                    marginLeft: "8px",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                    marginTop: "2px",
                                }}
                            />
                        </StyledLabelSection>

                        <Droppable droppableId={`data-tab-drop-area-${index}`}>
                            {(provided) => (
                                <DropContainer
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    style={{
                                        padding: "8px",
                                        minHeight: "50px",
                                        border: "1px dashed #ccc",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "95%",
                                        borderRadius: "10px",
                                        marginLeft: "12px",
                                        marginTop: "8px",
                                    }}
                                >
                                    <span style={{
                                        color: "#aaa", fontSize: "0.9rem", textAlign: "left",
                                        paddingRight: !item.multiLabel ? "28%" : "46%",
                                    }}>
                                        {item.multiLabel ? "Drag/add one or more dimensions" : "Drag one dimension"}
                                    </span>
                                    {item.multiLabel && (
                                        <AddOutlinedIcon
                                            style={{
                                                color: "#888",
                                                marginLeft: "8px",
                                                cursor: "pointer",
                                                fontSize: "18px",
                                            }}
                                            onClick={() => {
                                                isAdd(!isAddIcon, `data-tab-drop-area-${index}`);
                                                setIsAddIcon(!isAddIcon);
                                            }}
                                        />
                                    )}
                                    {provided.placeholder}
                                </DropContainer>
                            )}
                        </Droppable>

                        {Object.entries(selectedColumns)
                            .filter(([key]) => key === `data-tab-drop-area-${index}`)
                            .map(([key, columns]) =>
                                columns.map((column, colIndex) => (
                                    <div
                                        key={colIndex}
                                        style={{
                                            padding: "4px 8px",
                                            margin: "4px 0",
                                            backgroundColor: "#f0f0f0",
                                            height: "4%",
                                            width: "95%",
                                            borderRadius: "34px",
                                            marginLeft: "13px",
                                            marginTop: "8px",
                                            textAlign: "left",
                                            paddingLeft: "16px",
                                            paddingTop: "8px",
                                            fontSize: "1rem",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>{column}</span>
                                        <CloseOutlinedIcon
                                            style={{
                                                cursor: "pointer",
                                                color: "#888",
                                            }}
                                            onClick={() => {
                                                // Remove the column from dragdropColumns
                                                const updatedColumns = { ...selectedColumns };
                                                updatedColumns[key] = updatedColumns[key].filter((_, i) => i !== colIndex);
                                                if (updatedColumns[key].length === 0) {
                                                    delete updatedColumns[key];
                                                }
                                                setSelectedColumns(updatedColumns);
                                                deleteColumns(column);
                                            }}
                                        />
                                    </div>
                                ))
                            )}
                    </StyledDroppable>
                ))}
                <StyledSwitchSection>
                    <Switch
                        checked={checkedInstruction}
                        onChange={(event) => setCheckedInstruction(event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                    <StyledSpanSwitch>Show All Instruction</StyledSpanSwitch>
                </StyledSwitchSection>
                <StyledSwitchSection>
                    <Switch
                        checked={checkedVisual}
                        onChange={(event) => setCheckedVisual(event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                    <StyledSpanSwitch>Auto Visualize</StyledSpanSwitch>
                </StyledSwitchSection>
            </StyledMain>
        );
    }
);
