import { useState, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import {
    Add,
    Delete,
    Edit,
    PlayCircleOutlineRounded,
} from "@mui/icons-material";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { Box } from "@mui/material";

import {
    Typography,
    IconButton,
    Button,
    List,
    useNotification,
    styled,
    Modal,
    ToggleButtonGroup,
    ToggleButton,
    Stack,
} from "@semoss/ui";

import { useBlockSettings, useBlocks } from "../../hooks";
import { ACTIONS_DISPLAY, BlockDef, ListenerActions } from "../../store";
import { ListenerActionOverlay } from "./ListenerActionOverlay";

const StyledStatusIconContainer = styled("div")(() => ({
    height: "100%",
    width: "1.5em",
    display: "flex",
}));

const StyledRedDot = styled("div")(({ theme }) => ({
    width: ".50em",
    height: ".50em",
    backgroundColor: theme.palette.error.main,
    borderRadius: "50%",
}));

const StyledGreenDot = styled("div")(({ theme }) => ({
    width: ".50em",
    height: ".50em",
    backgroundColor: theme.palette.success.main,
    borderRadius: "50%",
}));

/**
 * TODO: reorganize and update the styling once app/blocks is up and working
 */
interface ListenerSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Lisetner to update
     */
    listener: Extract<keyof D["listeners"], string>;
}

export const ListenerSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        listener,
    }: ListenerSettingsProps<D>) => {
        const { state } = useBlocks();
        const { listeners, setListener } = useBlockSettings(id);
        const notification = useNotification();
        const blockListeners: ListenerActions[] = toJS(listeners)[listener].order;
        const type = toJS(listeners)[listener].type

        const [actionIndex, setActionIndex] = useState(-1);
        const [openModal, setOpenModal] = useState(false);

        /**
         * Open the overlay to create a edit action
         *
         * @param action - index of the action to edit. Will create a new one if -1
         */
        const runAction = (action: ListenerActions) => {
            try {
                // dispatch it
                state.dispatch(action);
            } catch (e) {
                notification.add({
                    color: "error",
                    message: e.message,
                });

                console.error(e);
            }
        };

        /**
         * Get the status of the query to display icon
         *
         */
        const getQueryStatusIcon = (a) => {
            if (a.message === "RUN_QUERY") {
                const query = state.getQuery(a.payload.queryId);
                if (query && query.isSuccessful) {
                    return <StyledGreenDot />;
                } else if (query && query.isError) {
                    return <StyledRedDot />;
                } else {
                    return;
                }
            } else {
                return;
            }
        };

        /**
         * Open the overlay to create a edit action
         *
         * @param actionIdx - index of the action to edit. Will create a new one if -1
         */
        const openActionOverlay = (actionIdx = -1) => {
            setActionIndex(actionIdx);
            setOpenModal(true);
        };

        /**
         * Open the overlay to create a edit action
         *
         * @param actionIdx - index of the action to edit. Will create a new one if -1
         */
        const deleteListener = (actionIdx: number) => {
            // copy it
            const updated = [...listeners[listener].order];

            debugger

            // remove it
            updated.splice(actionIdx, 1);

            setListener(listener, updated, type);
        };

        /**
         * Handle drag end
         * @param event - event object from dnd context
         */
        const handleDragEnd = ({ active, over }) => {
            if (!active || !over) {
                console.error("Invalid item!");
                return;
            }

            // If the active item is over a different item, swap them
            if (over && active.id !== over.id) {
                const oldIndex = Number(active.id);
                const newIndex = Number(over.id);

                // copy it
                const updated = [...listeners[listener].order];
                // remove it
                const [removed] = updated.splice(oldIndex, 1);
                // add it at the new location
                updated.splice(newIndex, 0, removed);
                // update the data
                setListener(listener, updated, type);
            }
        };

        /**
         * Handle drag end
         * @param event - event object from dnd context
         */
        const updateExecutionType = (t: "sync" | "async") => {
            setListener(listener, listeners[listener].order, t);
        };

        // Sortable encapsulation elements based on the sortable context
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

        // Transform items for sortable list
        const transformedItems = useMemo(() => {
            return (blockListeners ? blockListeners : []).map(
                (item, index) => ({
                    id: index.toString(),
                    content: item.payload["queryId"]
                        ? item.payload["queryId"]
                        : item.payload["name"],
                    original: item, // Keep reference to the original item
                }),
            );
        }, [blockListeners]);

        return (
            <>
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToParentElement]}
                >
                    <SortableContext
                        items={transformedItems?.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <List>
                            {transformedItems?.map(
                                ({ id, content, original: a }, aIdx) => (
                                    <SortableItems key={id} id={id}>
                                        <List.Item
                                            dense={true}
                                            secondaryAction={
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() =>
                                                            runAction(a)
                                                        }
                                                        onPointerDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <PlayCircleOutlineRounded
                                                            fontSize="medium"
                                                            color={"inherit"}
                                                        />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            openActionOverlay(
                                                                aIdx,
                                                            )
                                                        }
                                                        onPointerDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            deleteListener(aIdx)
                                                        }
                                                        onPointerDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </>
                                            }
                                        >
                                            <StyledStatusIconContainer>
                                                {getQueryStatusIcon(a)}
                                            </StyledStatusIconContainer>
                                            <List.ItemText
                                                disableTypography={true}
                                                primary={
                                                    <Typography
                                                        variant="body2"
                                                        noWrap={true}
                                                        title={
                                                            ACTIONS_DISPLAY[
                                                                a.message
                                                            ]
                                                        }
                                                    >
                                                        {
                                                            ACTIONS_DISPLAY[
                                                                a.message
                                                            ]
                                                        }
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography
                                                        variant="caption"
                                                        noWrap={true}
                                                        title={content}
                                                    >
                                                        {content}
                                                    </Typography>
                                                }
                                            />
                                        </List.Item>
                                    </SortableItems>
                                ),
                            )}
                        </List>
                    </SortableContext>
                </DndContext>
                <Stack direction="row" gap={1}>
                    <Button
                        fullWidth={true}
                        variant={"outlined"}
                        size="small"
                        onClick={() => openActionOverlay(-1)}
                        startIcon={<Add />}
                    >
                        New Action
                    </Button>
                    <ToggleButtonGroup size={"small"} value={type}>
                        <ToggleButton
                            value="async"
                            onClick={() => {
                                updateExecutionType("async")
                            }}
                        >
                            Async
                        </ToggleButton>
                        <ToggleButton
                            value="sync"
                            onClick={() => {
                                updateExecutionType("sync")
                            }}
                        >
                            Sync
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
                <Modal open={openModal} fullWidth={true}>
                    <ListenerActionOverlay
                        id={id}
                        type={type}
                        listener={listener}
                        actionIdx={actionIndex}
                        onClose={() => setOpenModal(false)}
                    />
                </Modal>
            </>
        );
    },
);
