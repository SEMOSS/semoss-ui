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
import { capitalizeFirstLetter, splitAtPeriod } from '@/utility';
import { MoreSharp, WarningRounded } from '@mui/icons-material';

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
}
export const AddVariableModal = observer((props: AddVariableModalProps) => {
    const {
        open,
        // tokenReference,
        anchorEl,
        onClose,
        variable,
    } = props;
    const { state } = useBlocks();
    const notification = useNotification();

    const getEngines = usePixel<
        { app_id: string; app_name: string; app_type: string }[]
    >(`
    MyEngines();
    `);

    const [engines, setEngines] = useState({
        models: [],
        databases: [],
        storages: [],
        functions: [],
        vectors: [],
    });

    const [variableName, setVariableName] = useState('');
    const [variableType, setVariableType] = useState<VariableType | ''>('');
    const [variablePointer, setVariablePointer] = useState('');
    const [engine, setEngine] = useState<{
        app_id: string;
        app_name: string;
        app_type: string;
    } | null>(null);

    /** To disable add button */
    const tN = Boolean(variableType.length > 0 && variableName.length > 0);
    const eP = Boolean(engine || variablePointer.length > 0);
    const isTypeAlias = tN;
    const isPointer = eP;

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

        if (variable) {
            // debugger;
            if (
                variable.type !== 'cell' &&
                variable.type !== 'query' &&
                variable.type !== 'block'
            ) {
                const val = state.getVariable(variable.to, variable.type);
                const eng = newEngines[`${variable.type}s`].find(
                    (e) => e.app_id === val,
                );
                // console.log('Set Engine Preview', val);
                // console.log(eng);
                setEngine(eng);
            }
            setVariableType(variable.type);
            setVariableName(variable.alias);
            setVariablePointer(variable.to);
        }

        setEngines(newEngines);
    }, [getEngines.status, getEngines.data]);

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
        }
    }, [variableType]);

    const preview = useMemo(() => {
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
                        <Typography variant={'body2'}>
                            {query.output}
                        </Typography>
                    );
                } else {
                    return (
                        <Alert severity="warning" icon={<WarningRounded />}>
                            <Alert.Title>
                                Sheet {variablePointer} has not been executed.
                                Would you like to execute?
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
                        <Alert severity="warning" icon={<WarningRounded />}>
                            <Alert.Title>
                                Cell {splitAtPeriod(variablePointer, 'right')}{' '}
                                has not been executed. Would you like to
                                execute?
                            </Alert.Title>
                        </Alert>
                    );
                }
            } else {
                return (
                    <Stack direction="row" alignItems="center">
                        <Icon>
                            <MoreSharp />
                        </Icon>
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
    }, [variableType, variablePointer, engine]);

    const disabled = useMemo(() => {
        if (isTypeAlias && isPointer) {
            return false;
        } else {
            return true;
        }
    }, [isTypeAlias, isPointer]);

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
            <StyledStack direction={'column'} gap={1} padding={2}>
                <Typography variant={'h6'}>
                    {variable ? 'Edit' : 'Create'} Variable
                </Typography>
                {variable && (
                    <Alert icon={<WarningRounded />} severity={'warning'}>
                        <Alert.Title>
                            Editing this variable may result in errors
                            throughout your sheets.
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
                            variableType === 'cell' ||
                            variableType === 'query' ||
                            variableType === 'block'
                                ? variablePointer
                                : engine
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
                        disabled={disabled}
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
                                        console.log('add engine');
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
                        {variable ? 'Edit' : 'Add'}
                    </Button>
                </Stack>
            </StyledStack>
        </StyledPopover>
    );
});
