import React, { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import { Button, IconButton, Stack, Box } from '@mui/material';
import { Add, Delete, DragIndicator } from '@mui/icons-material';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';

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
            Array<{ display: string; value: string; id: string }>
        >([{ display: '', value: '', id: '' }]);

        // track the dragging state
        const [isDragging, setIsDragging] = useState<boolean>(false);

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
            // add unique id to the options
            let modifiedOptions = (computedValue || []).map(
                (option, index) => ({
                    ...option,
                    id: `drag-item-${index}`,
                }),
            );
            setOptions(modifiedOptions);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChangeCustomOption = (
            currentOptions: Array<{
                display: string;
                value: string;
                id: string;
            }>,
            optionIndex: number,
            display: string,
            value: string,
            id: string,
        ) => {
            // set the value
            const newOptions = [...currentOptions];
            newOptions[optionIndex] = {
                display: display,
                value: value,
                id: id,
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

        const reorder = ({ active, over }: { active: any; over: any }) => {
            setIsDragging(false);
            if (!options.length) {
                return;
            }

            if (active === over) {
                console.log('Invalid drop!');
                return;
            }

            // find the index of the active and over items in the options array
            const oldIndex = Number(
                options.findIndex((option) => option.id === active.id),
            );
            const newIndex = Number(
                options.findIndex((option) => option.id === over.id),
            );

            // Remove the item from the old index and add it to the new index
            const newOptions = Array.from(options);
            const [removed] = newOptions.splice(oldIndex, 1);
            newOptions.splice(newIndex, 0, removed);

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
                    <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={reorder}
                        onDragStart={() => setIsDragging(true)}
                        modifiers={[restrictToParentElement]}
                    >
                        <SortableContext
                            items={options.map((option) => option.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <Stack gap={1}>
                                {Array.from(
                                    options,
                                    (
                                        option: {
                                            display: string;
                                            value: string;
                                            id: string;
                                        },
                                        i,
                                    ) => {
                                        return (
                                            <SortableItems
                                                key={option.id}
                                                id={option.id}
                                            >
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    gap={1}
                                                    key={option.id}
                                                >
                                                    <TextField
                                                        disabled={isDragging}
                                                        fullWidth
                                                        value={option.display}
                                                        onChange={(e) => {
                                                            // sync the data on change
                                                            onChangeCustomOption(
                                                                options,
                                                                i,
                                                                e.target.value,
                                                                option.value,
                                                                option.id,
                                                            );
                                                        }}
                                                        placeholder="Display"
                                                        size="small"
                                                        variant="outlined"
                                                        autoComplete="off"
                                                    />
                                                    <TextField
                                                        disabled={isDragging}
                                                        fullWidth
                                                        value={option.value}
                                                        onChange={(e) => {
                                                            // sync the data on change
                                                            onChangeCustomOption(
                                                                options,
                                                                i,
                                                                option.display,
                                                                e.target.value,
                                                                option.id,
                                                            );
                                                        }}
                                                        placeholder="Value"
                                                        size="small"
                                                        variant="outlined"
                                                        autoComplete="off"
                                                    />
                                                    <IconButton
                                                        disabled={isDragging}
                                                        size="small"
                                                        onClick={() =>
                                                            onRemoveCustomOption(
                                                                i,
                                                            )
                                                        }
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Stack>
                                            </SortableItems>
                                        );
                                    },
                                )}
                            </Stack>
                        </SortableContext>
                    </DndContext>
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
                                    { display: '', value: '', id: '' },
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

const SortableItems = ({
    id,
    children,
}: {
    id: string;
    children: React.ReactNode;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
    };

    return (
        <Box
            ref={setNodeRef}
            sx={style}
            display={'flex'}
            gap={1}
            alignItems={'center'}
        >
            {children}
            <Box
                {...attributes}
                {...listeners}
                display={'flex'}
                alignItems={'center'}
            >
                <DragIndicator />
            </Box>
        </Box>
    );
};
