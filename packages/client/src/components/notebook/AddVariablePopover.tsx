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
    STATE_VERSION,
    VariableType,
    VariableWithId,
} from '@/stores';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { DefaultBlocks, getIconForBlock } from '../block-defaults';
import {
    BLOCK_TYPE_COMPARE,
    BLOCK_TYPE_INPUT,
} from '../block-defaults/block-defaults.constants';
import { BlocksRenderer } from '../blocks-workspace';
import { VARIABLE_TYPES } from '@/stores';
import {
    capitalizeFirstLetter,
    getEngineImage,
    splitAtPeriod,
} from '@/utility';
import { MoreSharp, WarningRounded } from '@mui/icons-material';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
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

interface AddVariablePopoverProps {
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
export const AddVariablePopover = observer((props: AddVariablePopoverProps) => {
    const { open, anchorEl, onClose, variable, engines } = props;
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

    const [variableInputValue, setVariableInputValue] = useState(null);
    const inputVariableTypeList = ['string', 'number', 'JSON', 'date', 'array'];

    let alreadyAliased = false;

    if (variable) {
        if (variable.id !== variableName) {
            alreadyAliased = Boolean(state.variables[variableName]);
        }
    } else {
        alreadyAliased = Boolean(state.variables[variableName]);
    }

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

    // Get the LLM Comparison Blocks
    const comparisonBlocks = computed(() => {
        return Object.values(state.blocks)
            .filter(
                (block) =>
                    DefaultBlocks[block.widget].type === BLOCK_TYPE_COMPARE,
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

    /**
     * Select Box on different constants to tie to
     */
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
        } else if (variableType === 'LLM Comparison') {
            return comparisonBlocks.map((block) => {
                return (
                    <Select.Item key={block.id} value={block.id}>
                        <Typography variant="caption">{block.id}</Typography>
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

    const input = useMemo(() => {
        if (variableType === 'string') {
            return (
                <TextField
                    variant="outlined"
                    onChange={(e) =>
                        setVariableInputValue(e.target.value.toString())
                    }
                    value={variableInputValue}
                />
            );
        } else if (variableType === 'number') {
            return (
                <TextField
                    variant="outlined"
                    type="number"
                    onChange={(e) => {
                        setVariableInputValue(parseInt(e.target.value));
                    }}
                    value={variableInputValue}
                />
            );
        } else if (variableType === 'JSON' || variableType === 'array') {
            return (
                <Editor
                    width={'100%'}
                    height={'10vh'}
                    language={'json'}
                    onChange={(newValue, e) => {
                        setVariableInputValue(newValue);
                    }}
                    value={
                        typeof variableInputValue === 'object'
                            ? JSON.stringify(variableInputValue)
                            : variableInputValue
                    }
                ></Editor>
            );
        } else if (variableType === 'date') {
            return (
                <TextField
                    type="date"
                    variant="outlined"
                    onChange={(e) =>
                        setVariableInputValue(e.target.value.toString())
                    }
                    value={variableInputValue}
                />
            );
        } else {
            return (
                <Select
                    disabled={!variableType}
                    value={
                        (variableType === 'cell' ||
                        variableType === 'query' ||
                        variableType === 'block' ||
                        variableType === 'LLM Comparison'
                            ? variablePointer
                            : engine) ?? ''
                    }
                    onChange={(e) => {
                        const val = e.target.value as unknown;
                        if (
                            variableType === 'cell' ||
                            variableType === 'query' ||
                            variableType === 'block' ||
                            variableType === 'LLM Comparison'
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
            );
        }
    }, [variableType, variableInputValue, variablePointer, engine]);

    const preview = useMemo(() => {
        try {
            if (
                variableType &&
                (variablePointer || engine || variableInputValue)
            ) {
                if (
                    variableType === 'block' ||
                    variableType === 'LLM Comparison'
                ) {
                    const block = state.getBlock(variablePointer);
                    const s: SerializedState = {
                        version: STATE_VERSION,
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
                                    executed. Click &apos;Run All&apos; in order
                                    to preview output.
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
                                    has not been executed. Click &apos;Run
                                    All&apos; in order to preview output.
                                </Alert.Title>
                            </Alert>
                        );
                    }
                } else if (inputVariableTypeList.indexOf(variableType) > -1) {
                    return JSON.stringify(variableInputValue);
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
            } else if (
                variableType &&
                (!engine || variablePointer || variableInputValue)
            ) {
                return <StyledPlaceholder />;
            }
        } catch (e) {
            return (
                <Typography variant={'body2'}>Value is undefined</Typography>
            );
        }
    }, [variableType, variablePointer, engine, variableInputValue]);

    const addVariableDisabled = useMemo(() => {
        const hasRequiredFields = Boolean(
            variableType.length > 0 && variableName.length > 0,
        );

        const hasRequiredDependency = Boolean(
            engine || variablePointer.length > 0 || variableInputValue,
        );

        const isValid = hasRequiredFields && hasRequiredDependency;

        let v;

        if (variable) {
            v = state.getVariable(variable.to, variable.type);
        }

        const hasChanges = variable
            ? variable.id !== variableName ||
              variable.to !== variablePointer ||
              variable.type !== variableType ||
              variableInputValue !== v
            : true;

        return !isValid || !hasChanges || alreadyAliased;
    }, [
        variableType,
        variableName,
        engine,
        variablePointer,
        variableInputValue,
        alreadyAliased,
    ]);

    useEffect(() => {
        if (variable?.id) {
            setVariableName(variable.id);
            setVariableType(variable.type);
            setVariablePointer(
                variable.type === 'cell'
                    ? `${variable.to}.${variable.cellId}`
                    : variable.to,
            );

            if (
                variable.type !== 'query' &&
                variable.type !== 'block' &&
                variable.type !== 'cell'
            ) {
                const val = state.getVariable(variable.to, variable.type);
                if (inputVariableTypeList.includes(variable.type)) {
                    setVariableInputValue(val);
                } else {
                    const variableEngine = engines[`${variable.type}s`]
                        ? engines[`${variable.type}s`].find(
                              (engineValue) => engineValue.app_id === val,
                          )
                        : null;
                    if (variableEngine) {
                        setEngine(variableEngine);
                    }
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
                className="add-variable-popover__content"
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
                        error={alreadyAliased}
                        onChange={(e) => {
                            setVariableName(e.target.value);
                        }}
                        helperText={
                            alreadyAliased ? (
                                <Typography variant={'caption'} color={'error'}>
                                    This is not a unique alias
                                </Typography>
                            ) : (
                                ''
                            )
                        }
                    />
                    <Typography variant={'body1'}>Type</Typography>
                    <Select
                        value={variableType}
                        onChange={(e) => {
                            const val = e.target.value as VariableType;
                            setEngine(null);
                            setVariableInputValue(null);
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
                    {input}
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
                                        variableType === 'cell' ||
                                        variableType === 'LLM Comparison'
                                    ) {
                                        state.dispatch({
                                            message:
                                                ActionMessages.EDIT_VARIABLE,
                                            payload: {
                                                id: variableName,
                                                from: variable,
                                                to:
                                                    variableType === 'cell'
                                                        ? {
                                                              to: splitAtPeriod(
                                                                  variablePointer,
                                                                  'left',
                                                              ),
                                                              type: variableType,
                                                              cellId: splitAtPeriod(
                                                                  variablePointer,
                                                                  'right',
                                                              ),
                                                          }
                                                        : {
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
                                                id: engine
                                                    ? engine.app_id
                                                    : variableType ===
                                                          'array' ||
                                                      variableType === 'JSON'
                                                    ? JSON.parse(
                                                          variableInputValue,
                                                      )
                                                    : variableInputValue,
                                                type: variableType,
                                            },
                                        });

                                        state.dispatch({
                                            message:
                                                ActionMessages.EDIT_VARIABLE,
                                            payload: {
                                                id: variableName,
                                                from: variable,
                                                to: {
                                                    to: id,
                                                    type: variableType,
                                                },
                                            },
                                        });
                                    }

                                    notification.add({
                                        color: 'success',
                                        message: `Succesfully editted ${variable.id}, remember to save your app.`,
                                    });
                                    onClose();
                                } else {
                                    console.warn(
                                        `Adding variable ${variableName}`,
                                    );

                                    let success;
                                    if (
                                        variableType === 'block' ||
                                        variableType === 'query' ||
                                        variableType === 'cell'
                                    ) {
                                        success = state.dispatch({
                                            message:
                                                ActionMessages.ADD_VARIABLE,
                                            payload:
                                                variableType === 'cell'
                                                    ? {
                                                          id: variableName,
                                                          to: splitAtPeriod(
                                                              variablePointer,
                                                              'left',
                                                          ),
                                                          type: variableType,
                                                          cellId: splitAtPeriod(
                                                              variablePointer,
                                                              'right',
                                                          ),
                                                      }
                                                    : {
                                                          id: variableName,
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
                                                id: engine
                                                    ? engine.app_id
                                                    : variableType ===
                                                          'array' ||
                                                      variableType === 'JSON'
                                                    ? JSON.parse(
                                                          variableInputValue,
                                                      )
                                                    : variableInputValue,
                                                type: variableType,
                                            },
                                        });

                                        success = state.dispatch({
                                            message:
                                                ActionMessages.ADD_VARIABLE,
                                            payload: {
                                                id: variableName,
                                                to: id,
                                                type: variableType,
                                            },
                                        });

                                        if (!success) {
                                            state.dispatch({
                                                message:
                                                    ActionMessages.REMOVE_DEPENDENCY,
                                                payload: {
                                                    id: id,
                                                },
                                            });
                                        }
                                    }

                                    notification.add({
                                        color: success ? 'success' : 'error',
                                        message: success
                                            ? `Succesfully added ${variableName}, remember to save your app.`
                                            : `Unable to create ${variableName}`,
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
