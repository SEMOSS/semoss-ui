<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from "react";
import { TextField, styled } from "@semoss/ui";
import { observer } from "mobx-react-lite";
=======
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete, TextField, styled } from "@semoss/ui";
import { observer } from "mobx-react-lite";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { useBlockSettings, useBlocksPixel, useFrameHeaders } from "../../../../../hooks";
import { BlockDef } from "../../../../../store";
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Switch from '@mui/material/Switch';
<<<<<<< HEAD
import { Droppable } from "react-beautiful-dnd";
import { Autocomplete, Popover } from "@mui/material";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { useBlockSettings, useBlocksPixel, useFrameHeaders } from "../../../../../hooks";
import { BlockDef } from "../../../../../store";
import { VisualMapConstant } from "../../VisualMapConstant";
import { VisualMap } from "../../VisualMap";

//styled components for the data tab
=======
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
const StyledMain = styled("div")(() => ({
    width: "100%",
    height: "100%",
    marginTop: "1px",
}));
<<<<<<< HEAD
//styled span of frame for the frame and visual selection
=======
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
const StyledSpanFrame = styled("span")(() => ({
    fontSize: "1rem",
    color: "#808080",
    paddingLeft: "16px",
    position: "relative",
}));
<<<<<<< HEAD
//styled span of label for the frame and visual selection
=======
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
const StyledSpanLabel = styled("span")(() => ({
    fontSize: "1rem",
    paddingLeft: "16px",
    position: "relative",
}));
<<<<<<< HEAD
//styled section for the frame and visual selection
=======
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
const StyledSubSection = styled("div")(() => ({
    display: "flex",
    justifyContent: "center",
    padding: "0.5rem",
    width: "100%",
    marginTop: "5px",
}));
<<<<<<< HEAD
//styled droppable area of the frame and visual selection
const StyledDroppable = styled("div")(() => ({
    marginTop: "8px",
}));
//styled label area  of the frame and visual selection
=======
const StyledDroppable = styled("div")(() => ({
    marginTop: "8px",
}));
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
const StyledLabelSection = styled("div")(() => ({
    display: "flex",
    width: "100%",
}));
<<<<<<< HEAD
//styled section for the label of the frame and visual selection
=======
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
const StyledSwitchSection = styled("div")(() => ({
    display: "flex",
    marginTop: "15px",
    marginLeft: "8px",
    width: "100%",
}));
<<<<<<< HEAD
//styled label for the constants
=======
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
const StyledSpanSwitch = styled("span")(() => ({
    fontSize: "1rem",
    color: "#808080",
    marginTop: "5px",
    position: "relative",
}));
<<<<<<< HEAD
//droppable item styling
=======
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
const DropContainer = styled("div")(() => ({
    padding: "8px",
    minHeight: "50px",
    border: "1px dashed #ccc",
    display: "flex",
    alignItems: "center",
}));

<<<<<<< HEAD
//data tab right section of the echart visualization block
export const DataTabStyling = observer(
    <D extends BlockDef = BlockDef>({ id, updateFrame, path, dragdropColumns, deleteColumns, formmattedColumns, isAdd, syncHeader, chart, storedColumns, visual, selectedItem }) => {
        const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
=======
export const DataTabStyling = observer(
    <D extends BlockDef = BlockDef>({ id, updateFrame, path, dragdropColumns, deleteColumns, formmattedColumns,isAdd , syncHeader, chart, storedColumns}) => {
        const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
        const [columnsData, setColumnsData] = useState([]);
        const [droppedColumns, setDroppedColumns] = useState<string[]>([]);
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
        const [selectedColumns, setSelectedColumns] = useState<Record<string, string[]>>(() => {
            return storedColumns || {}; // Initialize with storedColumns if available
        });
        const [checkedInstruction, setCheckedInstruction] = useState(false);
        const [checkedVisual, setCheckedVisual] = useState(false);
<<<<<<< HEAD
        const [isAddIcon, setIsAddIcon] = useState(false);
        const getFrames = useBlocksPixel<string[]>("GetFrames();", { data: [] });
        const options = getFrames.status === "SUCCESS" ? getFrames.data : [];
        const [initialVisual, setInitialVisual] = useState(false);
        const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
=======
        const [isAddIcon, setIsAddIcon] =useState(false);
        const getFrames = useBlocksPixel<string[]>("GetFrames();", { data: [] });
        const options = getFrames.status === "SUCCESS" ? getFrames.data : [];
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548

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

<<<<<<< HEAD
        const matchedVisualMap = getMatchingVisualMapRow(data);

        function getMatchingVisualMapRow(data: any) {
            const matchingRow: any = {};

            // Iterate over each category in VisualMapConstant
            Object.keys(VisualMapConstant).forEach((category) => {
                const items = VisualMapConstant[category];

                // Find the row where the name matches data.option["title"]["text"]
                const foundItem = items.find((item: any) => {
                    return String(item.title) === String(data.variation);
                });

                if (foundItem) {
                    matchingRow[category] = foundItem;
                }
            });

            return matchingRow;
        }

        const handleSelectedItem = (item: any) => {
            selectedItem(item);
            setSelectedColumns({});
            storedColumns.length = 0; // Clear the storedColumns array
            Object.keys(dragdropColumns).forEach((key) => delete dragdropColumns[key]);
        };

=======
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
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
<<<<<<< HEAD
            const updatedColumns = { ...dragdropColumns, ...selectedColumns };
=======
            const updatedColumns = { ...dragdropColumns , ...selectedColumns };
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548

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
<<<<<<< HEAD
            if (!columnsSelector || columnsSelector.length === 0) {
                return;
            }
            const formattedArray = chart.map((item, index) => {
                let value ;
                if (data.variation === "echart-bar-graph") {
                    value = data.option[chart[index].label]?.name;
                }
                else if(data.variation === "echart-gantt-chart") {
                    value = data.option["customSettings"]?.["columnDetails"]?.[chart[index].label]?.name;
                }
                else {
                    value = data.option["_state"]?.["fields"]?.[chart[index].label];
                }
                const matchedColumns = columnsSelector.filter((column) =>
                    value?.includes(column.name)
                );
                return {
                    name: item.name,
                    label: item.label,
                    values: value ? (Array.isArray(value) ? value : [value]) : [],
                    selectors: matchedColumns.map((column) => column.selector),
                    dataType: matchedColumns.map((column) => column.dataType),
                };
            });
            formmattedColumns(formattedArray, data.variation);
        }, [columnsSelector.length]);

        useEffect(() => {
            if (!columnsSelector || columnsSelector.length === 0) {
                return;
            }
=======
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
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
<<<<<<< HEAD
            formmattedColumns(formattedArray, data.variation);
        }, [selectedColumns, columnsSelector.length]);

        const handleChangeVisual = (value: boolean, e: React.MouseEvent<HTMLElement>) => {
            visual(!value);
            setInitialVisual(!value);
            setMenuAnchorEl(e.currentTarget);
        };
        const handleCloseVisual = () => {
            setInitialVisual(false);
            setMenuAnchorEl(null);
        }
=======

            formmattedColumns(formattedArray,data.variation);
        }, [selectedColumns]);
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548

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
<<<<<<< HEAD
                <StyledSubSection onClick={(e: any) => handleChangeVisual(initialVisual, e)}>
=======
                <StyledSubSection>
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
                    <Autocomplete
                        fullWidth
                        id="Echart-Visuals"
                        multiple={false}
                        disabled={getFrames.status !== "SUCCESS"}
<<<<<<< HEAD
                        options={[]} // No options to display in the dropdown
                        disablePortal
                        PopperComponent={() => null}
                        freeSolo={false}
                        renderInput={(params) => {
                            // Extract the first matching item from matchedVisualMap
                            const matchedItem = Object.values(matchedVisualMap)[0] as { icon: React.ReactNode; label: string } | undefined; // Assuming only one match exists

                            return (
                                <TextField
                                    {...params}
                                    size="small"
                                    variant="outlined"
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: matchedItem ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                    {matchedItem.icon}
                                                </div>
                                                <span
                                                    style={{
                                                        marginLeft: "10px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    {matchedItem.label}
                                                </span>
                                            </div>
                                        ) : null,
                                    }}
                                />
                            );
                        }}
=======
                        options={options}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField {...params} size="small" variant="outlined" />
                        )}
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
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
<<<<<<< HEAD
                <div>
                    <Popover
                        id={'visual-popover'}
                        open={initialVisual}
                        onClose={() => {
                            setInitialVisual(false);
                        }}
                        anchorEl={menuAnchorEl}
                        anchorReference="anchorPosition" // <-- THIS is the key
                        anchorPosition={{ top: window.innerHeight * 0.14, left: window.innerWidth * 0.51 }}
                    >
                        <VisualMap
                            selectedItem={handleSelectedItem}
                            handleClose={handleCloseVisual}
                        />
                    </Popover>
                </div>
=======
>>>>>>> b826301a6a1ad7f1bdc3dbb0cdd72d98be5c9548
            </StyledMain>
        );
    }
);
