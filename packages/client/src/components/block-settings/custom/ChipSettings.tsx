/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '../../../types';
import { useBlocks, useBlockSettings } from '../../../hooks';
import { ActionMessages, Block, BlockDef } from '@/stores';
import { getValueByPath } from '../../../utility';
import { BaseSettingSection } from '../BaseSettingSection';
import { Autocomplete, Chip, Stack, TextField } from '@mui/material';

interface ChipSettingsProps<D extends BlockDef = BlockDef> {
    id: string;
    path: Paths<Block<D>['data'], 4>;
    label: string;
    options: Array<{ value: string; display: string }>;
    resizeOnSet?: boolean;
}

const labelMap: { [key: string]: string } = {};

export const inputOptions = Object.keys(labelMap).map((key) => ({
    value: key,
    display: key,
}));

export const ChipSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
        options,
        resizeOnSet = false,
    }: ChipSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);
        const { state } = useBlocks();

        const [autocompleteOptions, setAutocompleteOptions] = useState<
            Array<string>
        >([]);

        useEffect(() => {
            setAutocompleteOptions(options.map((option) => option.value));
        }, [options]);

        // track the value
        const [value, setValue] = useState('');

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
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value
            setValue(value);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(path, value as PathValue<D['data'], typeof path>);
                    if (resizeOnSet) {
                        // emit event to resize the block on the screen
                        state.dispatch({
                            message: ActionMessages.DISPATCH_EVENT,
                            payload: {
                                name: 'blockResized',
                            },
                        });
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const [chipVisible, setChipVisible] = useState(true);

        const handleDelete = () => {
            setChipVisible(false);
        };

        return (
            <BaseSettingSection label={label}>
                <Autocomplete
                    fullWidth
                    size="small"
                    value={value}
                    onChange={(_, newValue) => {
                        onChange(newValue);
                    }}
                    options={options.map((option) => option.value)}
                    renderOption={(props, option) => (
                        <li {...props}>
                            <Stack
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                {(() => {
                                    switch (option) {
                                        case 'Chip':
                                            return <Chip />;
                                        case 'Delete':
                                            return (
                                                <Chip onDelete={handleDelete} />
                                            );
                                        // case 'Link':
                                        //     return <Chip componet = "a" href=""/>;
                                        case 'outlined':
                                            return <Chip variant="outlined" />;
                                        case 'filled':
                                            return <Chip />;
                                    }
                                })()}
                            </Stack>
                        </li>
                    )}
                    renderInput={(params) => <TextField {...params} />}
                    disablePortal
                    disableClearable
                />
            </BaseSettingSection>
        );
    },
);
