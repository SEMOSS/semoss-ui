import React, { createElement, useEffect, useState, useMemo } from 'react';
import {
    styled,
    Button,
    Divider,
    Icon,
    Modal,
    Stack,
    TextField,
    Select,
    Typography,
    Popover,
    useNotification,
} from '@semoss/ui';
import { useBlocks, usePixel } from '@/hooks';
import { ActionMessages, SerializedState, TokenType } from '@/stores';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { DefaultBlocks, getIconForBlock } from '../block-defaults';
import { BLOCK_TYPE_INPUT } from '../block-defaults/block-defaults.constants';
import { BlocksRenderer } from '../blocks-workspace';
import { Token, VARIABLE_TYPES } from '@/stores';
import { capitalizeFirstLetter, splitAtPeriod } from '@/utility';
import { MoreSharp } from '@mui/icons-material';

const StyledPlaceholder = styled('div')(({ theme }) => ({
    height: '10vh',
    width: '100%',
}));

const StyledPopover = styled(Popover)(({ theme }) => ({
    padding: theme.spacing(2),
    marginLeft: theme.spacing(2),
}));

interface AddTokenModalProps {
    /**
     * modal open
     */
    open: boolean;

    /**
     * closes modal
     */
    onClose: () => void;

    /**
     * El the popover is tied to
     */
    anchorEl: Element;

    /**
     * Do we want to create token on the designer screen
     */
    tokenReference?: string;
}
export const AddTokenModal = observer((props: AddTokenModalProps) => {
    const { open, tokenReference, anchorEl, onClose } = props;
    const { state } = useBlocks();
    const notification = useNotification();

    const getEngines = usePixel<
        { app_id: string; app_name: string; app_type: string }[]
    >(`
    MyEngines();
    `);

    const [tokenRef, setTokenRef] = useState('');
    const [previewState, setPreviewState] = useState<SerializedState>({
        dependencies: {},
        tokens: {},
        blocks: {},
        queries: {},
    });

    const [engines, setEngines] = useState({
        models: [],
        databases: [],
        storages: [],
        functions: [],
        vectors: [],
    });

    const [variableName, setVariableName] = useState('');
    const [variableType, setVariableType] = useState<TokenType | ''>('');
    const [variablePointer, setVariablePointer] = useState('');
    const [engine, setEngine] = useState<{
        app_id: string;
        app_name: string;
        app_type: string;
    } | null>(null);

    // get the input type blocks as an array
    const inputBlocks = computed(() => {
        return Object.values(state.blocks)
            .filter(
                (block) =>
                    DefaultBlocks[block.widget].type === BLOCK_TYPE_INPUT,
            )
            .sort((a, b) => {
                const aId = a.id.toLowerCase(),
                    bId = b.id.toLowerCase();

                if (aId < bId) {
                    return -1;
                }
                if (aId > bId) {
                    return 1;
                }
                return 0;
            });
    }).get();

    const queries = useMemo(() => {
        return Object.values(state.queries);
    }, [state.queries]);

    const cells = useMemo(() => {
        const cells = [];

        Object.values(state.queries).forEach((query) => {
            Object.values(query.cells).forEach((cell) => {
                cells.push(cell);
            });
        });

        return cells;
    }, [state.queries]);

    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }
        const cleanedEngines = getEngines.data.map((d) => ({
            app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            app_id: d.app_id,
            app_type: d.app_type,
        }));

        const newEngines = {
            models: cleanedEngines.filter((e) => e.app_type === 'MODEL'),
            databases: cleanedEngines.filter((e) => e.app_type === 'DATABASE'),
            storages: cleanedEngines.filter((e) => e.app_type === 'STORAGE'),
            functions: cleanedEngines.filter((e) => e.app_type === 'FUNCTION'),
            vectors: cleanedEngines.filter((e) => e.app_type === 'VECTOR'),
        };
        setEngines(newEngines);
    }, [getEngines.status, getEngines.data]);

    /**
     * For Block Preview
     * go through state, keep our queries
     * just isolate the block we need
     */
    useEffect(() => {
        if (variablePointer && variableType === 'block') {
            const block = state.getBlock(variablePointer);
            const s: SerializedState = {
                dependencies: {},
                tokens: {},
                queries: {},
                blocks: {
                    'page-1': {
                        id: 'page-1',
                        widget: 'page',
                        parent: null,
                        data: {
                            style: {
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            },
                        },
                        listeners: {
                            onPageLoad: [],
                        },
                        slots: {
                            content: {
                                name: 'content',
                                children: [variablePointer],
                            },
                        },
                    },
                    [variablePointer]: {
                        id: block.id,
                        widget: block.widget,
                        data: block.data,
                        parent: null,
                        listeners: block.listeners,
                        slots: block.slots,
                    },
                },
            };

            setPreviewState(s);
        }
    }, [variablePointer]);

    const values = useMemo(() => {
        if (variableType === 'block') {
            return inputBlocks.map((block) => {
                return (
                    <Select.Item key={block.id} value={block.id}>
                        <Typography variant="caption">{block.id}</Typography>
                    </Select.Item>
                );
            });
        } else if (variableType === 'query') {
            debugger;
            return queries.map((q) => {
                return (
                    <Select.Item key={q.id} value={q.id}>
                        <Typography variant="caption">{q.id}</Typography>
                    </Select.Item>
                );
            });
        } else if (variableType === 'cell') {
            return cells.map((cell) => {
                return (
                    <Select.Item
                        key={cell.id}
                        value={`${cell.query.id}.${cell.id}`}
                    >
                        <Typography variant="caption">
                            {cell.query.id} - {cell.id}
                        </Typography>
                    </Select.Item>
                );
            });
        } else if (variableType === 'model') {
            return engines.models.map((model) => {
                return (
                    <Select.Item key={model.app_id} value={model}>
                        <Typography variant="caption">
                            {model.app_name}
                        </Typography>
                    </Select.Item>
                );
            });
        } else if (variableType === 'database') {
            return engines.databases.map((model) => {
                return (
                    <Select.Item key={model.app_id} value={model}>
                        <Typography variant="caption">
                            {model.app_name}
                        </Typography>
                    </Select.Item>
                );
            });
        } else if (variableType === 'storage') {
            return engines.storages.map((model) => {
                return (
                    <Select.Item key={model.app_id} value={model}>
                        <Typography variant="caption">
                            {model.app_name}
                        </Typography>
                    </Select.Item>
                );
            });
        } else if (variableType === 'function') {
            return engines.functions.map((model) => {
                return (
                    <Select.Item key={model.app_id} value={model}>
                        <Typography variant="caption">
                            {model.app_name}
                        </Typography>
                    </Select.Item>
                );
            });
        } else if (variableType === 'vector') {
            return engines.vectors.map((model) => {
                return (
                    <Select.Item key={model.app_id} value={model}>
                        <Typography variant="caption">
                            {model.app_name}
                        </Typography>
                    </Select.Item>
                );
            });
        }
    }, [variableType]);

    const preview = useMemo(() => {
        if (variableType && variablePointer) {
            if (variableType === 'block') {
                const block = state.getBlock(variablePointer);
                const s: SerializedState = {
                    dependencies: {},
                    tokens: {},
                    queries: {},
                    blocks: {
                        'page-1': {
                            id: 'page-1',
                            widget: 'page',
                            parent: null,
                            data: {
                                style: {
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                },
                            },
                            listeners: {
                                onPageLoad: [],
                            },
                            slots: {
                                content: {
                                    name: 'content',
                                    children: [variablePointer],
                                },
                            },
                        },
                        [variablePointer]: {
                            id: block.id,
                            widget: block.widget,
                            data: block.data,
                            parent: null,
                            listeners: block.listeners,
                            slots: block.slots,
                        },
                    },
                };

                return <BlocksRenderer state={s} />;
            } else if (variableType === 'query') {
                return (
                    <Typography variant="body2">
                        {state.getQuery(variablePointer).output}{' '}
                    </Typography>
                );
            } else if (variableType === 'cell') {
                return (
                    <Typography variant={'body2'}>
                        {
                            state
                                .getQuery(
                                    splitAtPeriod(variablePointer, 'left'),
                                )
                                .getCell(
                                    splitAtPeriod(variablePointer, 'right'),
                                ).output
                        }
                    </Typography>
                );
            } else {
                return (
                    <Stack>
                        <Icon>
                            <MoreSharp />
                        </Icon>
                        <Typography variant="body2">
                            {engine.app_name}
                        </Typography>
                        <Typography variant="caption">
                            {engine.app_id}
                        </Typography>
                    </Stack>
                );
            }
        }
    }, [variableType, variablePointer]);

    return (
        <StyledPopover
            id={'variable-popover'}
            open={open}
            onClose={() => {
                setVariablePointer('');
                setVariableName('');
                setEngine(null);
                setVariableType('');

                onClose();
            }}
            anchorEl={anchorEl}
        >
            <Stack
                direction={'column'}
                gap={1}
                padding={2}
                sx={{ width: '500px' }}
            >
                <Typography variant={'h6'}>Create Variable</Typography>
                <Stack direction="column" mt={1} gap={1}>
                    <Typography variant={'body1'}>Variable Name</Typography>
                    <TextField
                        placeholder={'Name'}
                        value={variableName}
                        onChange={(e) => {
                            setVariableName(e.target.value);
                        }}
                    />
                    <Typography variant={'body1'}>Type</Typography>
                    <Select
                        onChange={(e) => {
                            const val = e.target.value as TokenType;
                            setVariablePointer('');
                            setVariableType(val);
                        }}
                    >
                        {VARIABLE_TYPES.map((val, i) => {
                            return (
                                <Select.Item key={i} value={val}>
                                    {capitalizeFirstLetter(val)}
                                </Select.Item>
                            );
                        })}
                    </Select>
                    <Typography variant={'body1'}>Value</Typography>
                    <Select
                        disabled={!variableType}
                        onChange={(e) => {
                            const val = e.target.value as unknown;
                            if (
                                variableType === 'cell' ||
                                variableType === 'query' ||
                                variableType === 'block'
                            ) {
                                const p = val as string;
                                setVariablePointer(p);
                            } else {
                                const p = val as {
                                    app_id: string;
                                    app_name: string;
                                    app_type: string;
                                };
                                setEngine(p);
                            }
                        }}
                    >
                        {values}
                    </Select>

                    <Typography variant={'h6'}>Preview</Typography>
                    {preview}
                </Stack>
                <Stack direction={'row'} justifyContent={'flex-end'}>
                    <Button
                        variant={'text'}
                        color={'primary'}
                        onClick={() => {
                            onClose();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        variant={'contained'}
                        disabled={!variableType || !variableName}
                        onClick={async () => {
                            debugger;
                            if (variableType) {
                                // Dependency is already in struct
                                if (
                                    variableType === 'block' ||
                                    variableType === 'query' ||
                                    variableType === 'cell'
                                ) {
                                    state.dispatch({
                                        message: ActionMessages.ADD_TOKEN,
                                        payload: {
                                            alias: variableName,
                                            to: variablePointer,
                                            type: variableType,
                                        },
                                    });
                                } else {
                                    // Need to add dependency

                                    debugger;
                                    const id = await state.dispatch({
                                        message: ActionMessages.ADD_DEPENDENCY,
                                        payload: {
                                            id: engine.app_id,
                                            type: variableType,
                                        },
                                    });

                                    state.dispatch({
                                        message: ActionMessages.ADD_TOKEN,
                                        payload: {
                                            alias: variableName,
                                            to: id,
                                            type: variableType,
                                        },
                                    });
                                }

                                notification.add({
                                    color: 'success',
                                    message: `Succesfully added ${variableName}, remember to save your app.`,
                                });
                                onClose();
                            }
                        }}
                    >
                        Add
                    </Button>
                </Stack>
            </Stack>
        </StyledPopover>
    );
});
