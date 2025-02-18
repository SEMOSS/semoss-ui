import { observer } from "mobx-react-lite";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Sync } from "@mui/icons-material";
import { Stack, Box } from "@mui/material";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
    Autocomplete,
    IconButton,
    List,
    TextField,
    useNotification,
} from "@semoss/ui";

import {
    useBlockSettings,
    useBlocksPixel,
    useFrameHeaders,
} from "../../../hooks";
import { BaseSettingSection } from "../../block-settings";
import { GridBlockDef } from "./GridBlock";
import { GridBlockColumnSettingsItem } from "./GridBlockColumnSettingsItem";
import { GridBlockColumn } from "./grid-block.types";

interface GridBlockColumnSettingsProps {
    /** Id of the block */
    id: string;
}

export const GridBlockColumnSettings = observer(
    ({ id }: GridBlockColumnSettingsProps) => {
        const notification = useNotification();
        const { data, setData } = useBlockSettings<GridBlockDef>(id);

        // get all of the frames
        const getFrames = useBlocksPixel<string[]>("GetFrames();", {
            data: [],
        });

        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data.frame.name);

        /**
         * Sync the columns with the frame headers
         */
        const syncFrameHeaders = () => {
            try {
                // get the columns by selector
                const columnMap: Record<string, GridBlockColumn> =
                    data.columns.reduce((acc, val) => {
                        acc[val.name] = acc;

                        return acc;
                    }, {});

                // get the frameHeaders as columns
                const columns: GridBlockColumn[] = frameHeaders.data.list.map(
                    (h) => {
                        return {
                            name: h.alias,
                            width: undefined,
                            // add the previous if it exists
                            ...JSON.parse(
                                JSON.stringify(columnMap[h.alias] || {}),
                            ),
                            selector: h.header,
                        };
                    },
                );

                // update the data
                setData("columns", columns);

                notification.add({
                    color: "success",
                    message: "Succesfully synchronized headers",
                });
            } catch (e) {
                notification.add({
                    color: "error",
                    message: e.message,
                });
            }
        };

        /**
         * Reorder columns
         * @param startDragIndex
         * @param stopDragIndex
         */
        const handleDragEnd = ({ active, over }) => {
            if (!active || !over) {
                console.error("Invalid item!");
                return;
            }

            // If the active item is over a different item, swap them
            if (over && active.id !== over.id) {
                const oldIndex = Number(
                    columns.findIndex(
                        (column) => column.selector === active.id,
                    ),
                );
                const newIndex = Number(
                    columns.findIndex((column) => column.selector === over.id),
                );
                // get the columns
                const gridColumns = [...data.columns];

                // remove it
                const [removed] = gridColumns.splice(oldIndex, 1);

                // add it at the new location
                gridColumns.splice(newIndex, 0, removed);

                // update the data
                setData("columns", gridColumns);
            }
        };

        // options for the autocomplete
        const options = getFrames.status === "SUCCESS" ? getFrames.data : [];

        // columns to render
        const columns = data.columns || [];

        return (
            <>
                <BaseSettingSection label="Frame">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={getFrames.status !== "SUCCESS"}
                        value={data.frame.name}
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

                    <IconButton size="small" onClick={() => syncFrameHeaders()}>
                        <Sync />
                    </IconButton>
                </BaseSettingSection>
                <Stack direction={"column"} width={"100%"} overflow={"hidden"}>
                    <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToParentElement]}
                    >
                        <SortableContext
                            items={columns?.map((item) => item.selector)}
                            strategy={verticalListSortingStrategy}
                        >
                            <List
                                sx={{
                                    width: "100%",
                                }}
                            >
                                {columns.map((c, cIdx) => {
                                    return (
                                        <SortableItems
                                            key={c.selector}
                                            id={c.selector}
                                        >
                                            <GridBlockColumnSettingsItem
                                                id={id}
                                                key={cIdx}
                                                column={c}
                                                index={cIdx}
                                            />
                                        </SortableItems>
                                    );
                                })}
                                {/* <List.Item
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        dense={true}
                                        divider
                                    >
                                        <List.ItemText primary={'Add Column'} />
                                    </List.Item> */}
                            </List>
                        </SortableContext>
                    </DndContext>
                </Stack>
            </>
        );
    },
);

const SortableItems = ({
    id,
    children,
}: {
    id: string;
    children: React.ReactNode;
}) => {
    // Use the sortable context
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    // Apply styles to the list items based on their state
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: "grab",
    };

    return (
        <Box
            key={`action-${id}`}
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            sx={style}
        >
            {children}
        </Box>
    );
};
