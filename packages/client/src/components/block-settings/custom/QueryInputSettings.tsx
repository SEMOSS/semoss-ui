import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef, CellState, QueryState } from '@/stores';
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
} from '@/component-library';
import { Autocomplete } from '@mui/material';
import { Close, DataObject, Layers, OpenInNew } from '@mui/icons-material';

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
    blockType: 'block' | 'query' | 'cell' | 'cell-prop';
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

            Object.values(state.blocks).forEach((block: Block) => {
                // only input block types will have values
                // FixMe: Error importing default blocks here, hardcoding for now
                const inputBlockWidgets = [
                    'input',
                    'checkbox',
                    'select',
                    'upload',
                ];
                if (inputBlockWidgets.includes(block.widget)) {
                    pathMap[`block.${block.id}.value`] = {
                        id: block.id,
                        path: `block.${block.id}.value`,
                        type: typeof block.data?.value,
                        display: `${block.id}`,
                        blockType: 'block',
                    };
                }
            });
            notebook.queriesList.forEach((query: QueryState) => {
                pathMap[`query.${query.id}`] = {
                    id: query.id,
                    path: `query.${query.id}.output`,
                    type: typeof query.output,
                    display: `${query.id}`,
                    blockType: 'query',
                };
                query.list.forEach((subQ: string) => {
                    const cell: CellState = query.cells[subQ];
                    pathMap[`query.${query.id}.${cell.id}`] = {
                        id: cell.id,
                        path: `query.${query.id}.cell.${cell.id}`,
                        query: `${query.id}`,
                        type: typeof cell._exposed,
                        display: `${cell.id}`,
                        blockType: 'cell',
                    };

                    for (const f in cell._exposed) {
                        pathMap[`query.${query.id}.${cell.id}.${f}`] = {
                            id: cell.id + f,
                            path: `query.${query.id}.cell.${cell.id}.${f}`,
                            query: `${query.id}`,
                            type: typeof cell._exposed[f],
                            display: `${cell.id}-${f}`,
                            blockType: 'cell-prop',
                        };
                    }
                });
            });

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
                case 'cell':
                    return 1;
                case 'query':
                    return 0;
                default:
                    return 0;
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
                                            // paddingTop: '2px',
                                            // paddingLeft: '16px',
                                            // paddingRight: '16px',
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {option.display}
                                        </Typography>
                                        {option.blockType === 'block' ? (
                                            <Icon>
                                                <Layers fontSize="small" />
                                            </Icon>
                                        ) : (
                                            <Icon>
                                                <DataObject fontSize="small" />
                                            </Icon>
                                        )}
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
