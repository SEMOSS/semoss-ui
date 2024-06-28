import React, { createElement, useEffect, useState, useMemo } from 'react';
import {
    Alert,
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
import {
    ActionMessages,
    SerializedState,
    VariableType,
    VariableWithId,
} from '@/stores';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { DefaultBlocks, getIconForBlock } from '../block-defaults';
import { BLOCK_TYPE_INPUT } from '../block-defaults/block-defaults.constants';
import { BlocksRenderer } from '../blocks-workspace';
import { VARIABLE_TYPES } from '@/stores';
import {
    capitalizeFirstLetter,
    getEngineImage,
    splitAtPeriod,
} from '@/utility';
import { MoreSharp, WarningRounded } from '@mui/icons-material';
import { ENGINE_ROUTES } from '@/pages/engine';

const StyledPlaceholder = styled('div')(({ theme }) => ({
    height: '10vh',
    width: '100%',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    width: '500px',
}));

const StyledPopover = styled(Popover)(({ theme }) => ({
    padding: theme.spacing(2),
    marginLeft: theme.spacing(2),
}));

const QueryPreviewContainer = styled(Stack)(({ theme }) => ({
    maxHeight: '275px',
    width: '100%',
    overflow: 'auto',
}));

const StyledImg = styled('img')(({ theme }) => ({
    maxWidth: theme.spacing(5),
}));

interface AddVariableModalProps {
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
     * Do we want edit variable
     */
    variable?: VariableWithId;

    /**
     * Engines
     */
    engines: {
        models: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        databases: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        storages: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        functions: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        vectors: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
    };
}
export const AddVariableModal = observer((props: AddVariableModalProps) => {
    const {
        open,
        // tokenReference,
        anchorEl,
        onClose,
        variable,
        engines,
    } = props;
    const { state } = useBlocks();
    const notification = useNotification();

    const [variableName, setVariableName] = useState('');
    const [variableType, setVariableType] = useState<VariableType | ''>('');
    const [variablePointer, setVariablePointer] = useState('');
    const [engine, setEngine] = useState<{
        app_id: string;
        app_name: string;
        app_type: string;
        app_subtype;
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
        } else {
            return <Select.Item value="">No options</Select.Item>;
        }
    }, [variableType]);

    const preview = useMemo(() => {
        try {
            if (variableType && (variablePointer || engine)) {
                if (variableType === 'block') {
                    const block = state.getBlock(variablePointer);
                    const s: SerializedState = {
                        dependencies: {},
                        variables: {},
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
                    const query = state.getQuery(variablePointer);

                    if (query.output) {
                        return (
                            <QueryPreviewContainer>
                                <Typography variant={'body2'}>
                                    {JSON.stringify(query.output)}
                                </Typography>
                            </QueryPreviewContainer>
                        );
                    } else {
                        return (
                            <Alert severity="warning" icon={<WarningRounded />}>
                                <Alert.Title>
                                    Sheet {variablePointer} has not been
                                    executed. Click 'Run All' in order to
                                    preview output.
                                </Alert.Title>
                            </Alert>
                        );
                    }
                } else if (variableType === 'cell') {
                    const query = state.getQuery(
                        splitAtPeriod(variablePointer, 'left'),
                    );

                    const cell = query.getCell(
                        splitAtPeriod(variablePointer, 'right'),
                    );

                    if (cell.output) {
                        const rawOutput = state
                            .getQuery(splitAtPeriod(variablePointer, 'left'))
                            .getCell(
                                splitAtPeriod(variablePointer, 'right'),
                            ).output;
                        return (
                            <QueryPreviewContainer>
                                <Typography variant={'body2'}>
                                    {JSON.stringify(rawOutput)}
                                </Typography>
                            </QueryPreviewContainer>
                        );
                    } else {
                        return (
                            <Alert severity="warning" icon={<WarningRounded />}>
                                <Alert.Title>
                                    Cell{' '}
                                    {splitAtPeriod(variablePointer, 'right')}{' '}
                                    has not been executed. Click 'Run All' in
                                    order to preview output.
                                </Alert.Title>
                            </Alert>
                        );
                    }
                } else {
                    const image = getEngineImage(
                        engine.app_type,
                        engine.app_subtype,
                        true,
                    );
                    const engineDisplay = ENGINE_ROUTES.find(
                        (engineValue) => engineValue.type === engine.app_type,
                    );
                    return (
                        <Stack direction="row" alignItems="center">
                            {image ? (
                                <StyledImg src={image} />
                            ) : (
                                <Icon>
                                    {engineDisplay ? (
                                        createElement(engineDisplay.icon)
                                    ) : (
                                        <MoreSharp />
                                    )}
                                </Icon>
                            )}
                            <Stack direction="column">
                                <Typography variant="body2">
                                    {engine.app_name}
                                </Typography>
                                <Typography variant="caption">
                                    {engine.app_id}
                                </Typography>
                            </Stack>
                        </Stack>
                    );
                }
            } else if (variableType && (!engine || variablePointer)) {
                return <StyledPlaceholder />;
            }
        } catch (e) {
            return (
                <Typography variant={'body2'}>Value is undefined</Typography>
            );
        }
    }, [variableType, variablePointer, engine]);

    const addVariableDisabled = useMemo(() => {
        const hasRequiredFields = Boolean(
            variableType.length > 0 && variableName.length > 0,
        );
        const hasRequiredDependency = Boolean(
            engine || variablePointer.length > 0,
        );
        const isValid = hasRequiredFields && hasRequiredDependency;

        const hasChanges = variable
            ? variable.alias !== variableName ||
              variable.to !== variablePointer ||
              variable.type !== variableType
            : true;

        return !isValid || !hasChanges;
    }, [variableType, variableName, engine, variablePointer]);

    useEffect(() => {
        if (variable?.id) {
            setVariableName(variable.alias);
            setVariableType(variable.type);
            setVariablePointer(variable.to);

            if (
                variable.type !== 'query' &&
                variable.type !== 'block' &&
                variable.type !== 'cell'
            ) {
                const engineId = state.getVariable(variable.to, variable.type);
                const variableEngine = engines[`${variable.type}s`]
                    ? engines[`${variable.type}s`].find(
                          (engineValue) => engineValue.app_id === engineId,
                      )
                    : null;
                if (variableEngine) {
                    setEngine(variableEngine);
                }
            }
        }
    }, [variable]);

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
            <StyledStack
                direction={'column'}
                gap={1}
                padding={2}
                className="add-variable-modal__content"
            >
                <Typography variant={'h6'}>
                    {variable ? 'Edit' : 'Create'} Variable
                </Typography>
                {variable && (
                    <Alert icon={<WarningRounded />} severity={'warning'}>
                        <Alert.Title>
                            If this variable is actively being used, editing it
                            may result in errors throughout your sheets.
                        </Alert.Title>
                    </Alert>
                )}
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
                        value={variableType}
                        onChange={(e) => {
                            const val = e.target.value as VariableType;
                            setEngine(null);
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
                        value={
                            (variableType === 'cell' ||
                            variableType === 'query' ||
                            variableType === 'block'
                                ? variablePointer
                                : engine) ?? ''
                        }
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
                                    app_subtype: string;
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
                        disabled={addVariableDisabled}
                        onClick={async () => {
                            // Refactor this
                            if (variableType) {
                                if (variable) {
                                    if (
                                        variableType === 'block' ||
                                        variableType === 'query' ||
                                        variableType === 'cell'
                                    ) {
                                        state.dispatch({
                                            message:
                                                ActionMessages.EDIT_VARIABLE,
                                            payload: {
                                                from: variable,
                                                to: {
                                                    alias: variableName,
                                                    to: variablePointer,
                                                    type: variableType,
                                                },
                                            },
                                        });
                                    } else {
                                        const id = await state.dispatch({
                                            message:
                                                ActionMessages.ADD_DEPENDENCY,
                                            payload: {
                                                id: engine.app_id,
                                                type: variableType,
                                            },
                                        });

                                        state.dispatch({
                                            message:
                                                ActionMessages.EDIT_VARIABLE,
                                            payload: {
                                                from: variable,
                                                to: {
                                                    alias: variableName,
                                                    to: id,
                                                    type: variableType,
                                                },
                                            },
                                        });
                                    }

                                    notification.add({
                                        color: 'success',
                                        message: `Succesfully editted ${variable.alias}, remember to save your app.`,
                                    });
                                    onClose();
                                } else {
                                    console.warn(
                                        `Adding variable ${variableName}`,
                                    );
                                    if (
                                        variableType === 'block' ||
                                        variableType === 'query' ||
                                        variableType === 'cell'
                                    ) {
                                        state.dispatch({
                                            message:
                                                ActionMessages.ADD_VARIABLE,
                                            payload: {
                                                alias: variableName,
                                                to: variablePointer,
                                                type: variableType,
                                            },
                                        });
                                    } else {
                                        // Add dependency to reference
                                        const id = await state.dispatch({
                                            message:
                                                ActionMessages.ADD_DEPENDENCY,
                                            payload: {
                                                id: engine.app_id,
                                                type: variableType,
                                            },
                                        });

                                        state.dispatch({
                                            message:
                                                ActionMessages.ADD_VARIABLE,
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
                            }
                        }}
                    >
                        {variable ? 'Save' : 'Add'}
                    </Button>
                </Stack>
            </StyledStack>
        </StyledPopover>
    );
});
