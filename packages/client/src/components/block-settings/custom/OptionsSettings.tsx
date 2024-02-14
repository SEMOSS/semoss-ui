import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import { Button, IconButton, Stack } from '@mui/material';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface OptionsSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const OptionsSettings = observer(
    <D extends BlockDef = BlockDef>({ id, path }: OptionsSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [options, setOptions] = useState<
            Array<{ display: string; value: string }>
        >([{ display: '', value: '' }]);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return [{ display: '', value: '' }];
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return [{ display: '', value: '' }];
                } else if (Array.isArray(v) && v.length) {
                    return v;
                }

                return [{ display: '', value: '' }];
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setOptions(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChangeCustomOption = (
            currentOptions: Array<{ display: string; value: string }>,
            optionIndex: number,
            display: string,
            value: string,
        ) => {
            // set the value
            const newOptions = [...currentOptions];
            newOptions[optionIndex] = {
                display: display,
                value: value,
            };
            setOptions(newOptions);

            // clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    if (display && value) {
                        // set the value
                        setData(
                            path,
                            newOptions as PathValue<D['data'], typeof path>,
                        );
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const onRemoveCustomOption = (index: number) => {
            // set the value
            const newOptions = [
                ...options.slice(0, index),
                ...options.slice(index + 1),
            ];
            setOptions(newOptions);

            // clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        path,
                        newOptions as PathValue<D['data'], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const reorder = (startIndex: number, endIndex: number) => {
            if (!options.length) {
                return;
            }
            const newOptions = Array.from(options);
            const [removed] = newOptions.splice(startIndex, 1);
            newOptions.splice(endIndex, 0, removed);

            setOptions(newOptions);

            // clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        path,
                        newOptions as PathValue<D['data'], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection label="Options">
                <Stack spacing={1}>
                    <DragDropContext
                        onDragEnd={(result) => {
                            if (!result.destination) {
                                return;
                            }
                            reorder(
                                result.source.index,
                                result.destination.index,
                            );
                        }}
                    >
                        <Droppable droppableId="droppable">
                            {(provided) => (
                                <Stack
                                    gap={1}
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                >
                                    {Array.from(
                                        options,
                                        (
                                            option: {
                                                display: string;
                                                value: string;
                                            },
                                            i,
                                        ) => {
                                            return (
                                                <Draggable
                                                    key={`draggable-${i}`}
                                                    draggableId={`draggable-${i}`}
                                                    index={i}
                                                >
                                                    {(provided, snapshot) => (
                                                        <Stack
                                                            direction="row"
                                                            alignItems="center"
                                                            gap={1}
                                                            key={i}
                                                            ref={
                                                                provided.innerRef
                                                            }
                                                            {...provided.dragHandleProps}
                                                            {...provided.draggableProps}
                                                        >
                                                            <TextField
                                                                disabled={
                                                                    snapshot.isDragging
                                                                }
                                                                fullWidth
                                                                value={
                                                                    option.display
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    // sync the data on change
                                                                    onChangeCustomOption(
                                                                        options,
                                                                        i,
                                                                        e.target
                                                                            .value,
                                                                        option.value,
                                                                    );
                                                                }}
                                                                placeholder="Display"
                                                                size="small"
                                                                variant="outlined"
                                                                autoComplete="off"
                                                            />
                                                            <TextField
                                                                disabled={
                                                                    snapshot.isDragging
                                                                }
                                                                fullWidth
                                                                value={
                                                                    option.value
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    // sync the data on change
                                                                    onChangeCustomOption(
                                                                        options,
                                                                        i,
                                                                        option.display,
                                                                        e.target
                                                                            .value,
                                                                    );
                                                                }}
                                                                placeholder="Value"
                                                                size="small"
                                                                variant="outlined"
                                                                autoComplete="off"
                                                            />
                                                            <IconButton
                                                                disabled={
                                                                    snapshot.isDragging
                                                                }
                                                                size="small"
                                                                onClick={() =>
                                                                    onRemoveCustomOption(
                                                                        i,
                                                                    )
                                                                }
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                            <DragIndicator />
                                                        </Stack>
                                                    )}
                                                </Draggable>
                                            );
                                        },
                                    )}
                                    {provided.placeholder}
                                </Stack>
                            )}
                        </Droppable>
                    </DragDropContext>
                    <Stack
                        alignItems="center"
                        justifyContent="center"
                        flex="1"
                        direction="row"
                    >
                        <Button
                            size="small"
                            onClick={() =>
                                setOptions([
                                    ...options,
                                    { display: '', value: '' },
                                ])
                            }
                            startIcon={<Add />}
                        >
                            Add Option
                        </Button>
                    </Stack>
                </Stack>
            </BaseSettingSection>
        );
    },
);
