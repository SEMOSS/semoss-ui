import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef, CellState, QueryState } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import {
    Autocomplete,
    Stack,
    Typography,
    TextField,
    Icon,
    Modal,
    IconButton,
    Divider,
    styled,
} from '@semoss/ui';

import { Close, DataObject, Layers, OpenInNew } from '@mui/icons-material';
import { DefaultBlocks } from '@/components/block-defaults';
import { BLOCK_TYPE_INPUT } from '@/components/block-defaults/block-defaults.constants';

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

        const optionMap = useMemo(() => {
            const pathMap = {};

            Object.values(state.blocks).forEach((block: Block) => {
                // only input block types will have values
                const inputBlockWidgets = Object.keys(DefaultBlocks).filter(
                    (block) => DefaultBlocks[block].type === BLOCK_TYPE_INPUT,
                );
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
                pathMap[`query.${query.id}.output`] = {
                    id: query.id,
                    path: `query.${query.id}.output`,
                    type: typeof query.output,
                    display: `${query.id}`,
                    blockType: 'query',
                };
                query.list.forEach((subQ: string) => {
                    const cell: CellState = query.cells[subQ];
                    const output = cell.output;
                    const path = cell.id;

                    for (const f in cell._exposed) {
                        pathMap[`query.${query.id}.${cell.id}.${f}`] = {
                            id: f + cell.id,
                            path: `query.${query.id}.${cell.id}.${f}`,
                            type: typeof cell._exposed[f],
                            display: `${cell.id}-${f}`,
                            blockType: 'cell',
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

        return (
            <>
                <BaseSettingSection label={label}>
                    <Autocomplete
                        fullWidth
                        disableClearable={value === ''}
                        size="small"
                        freeSolo
                        value={value}
                        ref={inputRef}
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
                            return options;
                        }}
                        renderOption={(props, o) => {
                            const option = optionMap[o];
                            return (
                                <Stack
                                    {...props}
                                    sx={{ width: '100%' }}
                                    key={option.path}
                                    direction="row"
                                    fullWidth
                                    justifyContent={'space-between'}
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
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Query"
                                onChange={(e, ...args) => {
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
