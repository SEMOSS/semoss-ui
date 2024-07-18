import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef, CellState, QueryState, Variable } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import {
    Stack,
    Typography,
    TextField,
    Icon,
    Modal,
    IconButton,
    Divider,
    styled,
} from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import {
    CalendarMonth,
    Close,
    DataArray,
    DataObject,
    Gesture,
    Inventory2Outlined,
    Layers,
    OpenInNew,
    SwitchAccessShortcutOutlined,
    TokenOutlined,
} from '@mui/icons-material';
import { ModelBrain } from '@/assets/img/ModelBrain';
import { Database } from '@/assets/img/Database';

interface QueryInputSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    /**
     * Settings label
     */
    label: string;
}

interface Option {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * node path
     */
    path: string;
    /**
     * node value type
     */
    type: string;
    /**
     * option display
     */
    display: string;
    /**
     * type of block
     */
    blockType: 'block' | 'query' | 'cell' | 'query-prop' | 'cell-prop';
}

const StyledModalHeader = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

/**
 * Specifically for selecting a query for to associate with a UI block
 */
export const QueryInputSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
    }: QueryInputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);
        const { state, notebook } = useBlocks();

        // track the value
        const [value, setValue] = useState('');
        // internal state of the input component
        const [inputValue, setInputValue] = useState('');
        // track the modal
        const [open, setOpen] = useState(false);
        // Track the input ref to grab the cursor position
        const inputRef = useRef(null);
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }

                const v = getValueByPath(data, path);

                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
            setInputValue(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value
            setValue(value);

            // clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(path, value as PathValue<D['data'], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const optionMap = useMemo<Record<string, Option>>(() => {
            const pathMap = {};

            Object.entries(state.variables).forEach(
                (keyValue: [string, Variable]) => {
                    console.log(keyValue[0]);
                    const alias = keyValue[0];
                    const variable = keyValue[1];

                    const ref = state.getVariable(variable.to, variable.type);

                    pathMap[alias] = {
                        id: alias,
                        path: alias,
                        type: typeof ref,
                        display: alias,
                        blockType: variable.type,
                    };

                    if (variable.type === 'query') {
                        const q = state.getQuery(variable.to);
                        for (const f in q._exposed) {
                            pathMap[`${alias}.${f}`] = {
                                id: `${alias}.${f}`,
                                path: `${alias}.${f}`,
                                type: typeof q[f], // TODO: get value
                                display: `${alias}.${f}`,
                                blockType: 'query-prop',
                            };
                        }
                    }

                    if (variable.type === 'cell') {
                        const q = state.getQuery(variable.to);
                        const c = q.getCell(variable.cellId);

                        for (const f in c._exposed) {
                            pathMap[`${alias}.${f}`] = {
                                id: `${alias}.${f}`,
                                path: `${alias}.${f}`,
                                type: typeof c[f], // TODO: get value
                                display: `${alias}.${f}`,
                                blockType: 'cell-prop',
                            };
                        }
                    }
                },
            );
            return pathMap;
        }, [state, notebook]);

        // handle 'input' changes vs 'selections'
        const handleInputChange = (event, newInputValue, reason) => {
            if (reason === 'input') {
                setInputValue(newInputValue);
            } else if (newInputValue?.path && reason === 'selectOption') {
                setInputValue((currentInputValue) => {
                    const cursorPosition = inputRef?.current
                        ? inputRef.current?.selectionStart
                        : null;
                    const leftText = value.substring(0, cursorPosition);
                    const rightText = value.substring(cursorPosition);

                    return leftText + ' {{' + newInputValue + '}} ' + rightText;
                });
            }
        };

        const getIndent = (type: Option['blockType']) => {
            switch (type) {
                case 'cell-prop':
                    return 2;
                case 'query-prop':
                    return 2;
                case 'cell':
                    return 1;
                case 'query':
                    return 1;
                default:
                    return 0;
            }
        };

        /**
         * @name getIcon
         * Used for the Select Dropdown
         * TODO: Add the icons for other data types
         */
        const getIcon = (type: string) => {
            switch (type) {
                case 'cell-prop':
                    return <DataObject />;
                case 'query-prop':
                    return <DataObject />;
                case 'cell':
                    return <DataObject />;
                case 'query':
                    return <DataObject />;
                case 'array':
                    return <DataArray />;
                case 'string':
                    return <Gesture />;
                case 'date':
                    return <CalendarMonth />;
                case 'JSON':
                    return <DataObject />;
                case 'vector':
                    return <TokenOutlined />;
                case 'database':
                    return <Database color="black" />;
                case 'model':
                    return <ModelBrain color="black" />;
                case 'function':
                    return <SwitchAccessShortcutOutlined />;
                case 'storage':
                    return <Inventory2Outlined />;
                default:
                    return <DataObject />;
            }
        };

        return (
            <>
                <BaseSettingSection label={label}>
                    <Autocomplete
                        fullWidth
                        disableClearable={value === ''}
                        size="small"
                        freeSolo
                        value={value}
                        inputValue={inputValue}
                        onInputChange={handleInputChange}
                        options={Object.keys(optionMap).sort()}
                        getOptionLabel={(o: string) => {
                            return optionMap?.[o]?.path as string;
                        }}
                        onChange={(e, val) => {
                            // Reset
                            if (!val) {
                                onChange('');
                            } else {
                                // current cursor
                                const cursorPosition = inputRef?.current
                                    ? inputRef.current?.selectionStart
                                    : null;
                                // text to left of cursor
                                const leftText = value.substring(
                                    0,
                                    cursorPosition,
                                );
                                //text to right of cursor
                                const rightText =
                                    value.substring(cursorPosition);
                                const valf = optionMap?.[val]?.path || '';

                                // reform and submit
                                onChange(
                                    leftText + ' {{' + valf + '}} ' + rightText,
                                );
                            }
                        }}
                        filterOptions={(options) => {
                            return options.sort();
                        }}
                        renderOption={(props, o) => {
                            const option = optionMap[o];
                            return (
                                <li {...props} key={option.path}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        sx={{
                                            width: '100%',
                                            pl: getIndent(option.blockType),
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {option.display}
                                        </Typography>
                                        {/* TODO: Icon should actually reflect value data type */}
                                        <Icon>{getIcon(option.blockType)}</Icon>
                                    </Stack>
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                inputRef={inputRef}
                                fullWidth
                                placeholder="Query"
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    setInputValue(newValue);
                                    onChange(newValue);
                                }}
                            />
                        )}
                    />
                    <IconButton size="small" onClick={() => setOpen(true)}>
                        <OpenInNew />
                    </IconButton>
                </BaseSettingSection>
                <Modal
                    open={open}
                    fullWidth
                    maxWidth={
                        data.hasOwnProperty('type') && data.type === 'date'
                            ? 'sm'
                            : 'lg'
                    }
                >
                    <StyledModalHeader>
                        <Typography variant="h5">{`Edit ${label}`}</Typography>
                        <IconButton onClick={() => setOpen(false)}>
                            <Close />
                        </IconButton>
                    </StyledModalHeader>
                    <Divider />
                    <Modal.Content>
                        <TextField
                            fullWidth
                            placeholder="Enter Text..."
                            multiline
                            rows={
                                data.hasOwnProperty('type') &&
                                data.type === 'date'
                                    ? 1
                                    : 15
                            }
                            value={value}
                            onChange={(e) => {
                                // sync the data on change
                                onChange(e.target.value);
                            }}
                            type={
                                data.hasOwnProperty('type') && path === 'value'
                                    ? (data.type as string)
                                    : undefined
                            }
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                        />
                    </Modal.Content>
                </Modal>
            </>
        );
    },
);
