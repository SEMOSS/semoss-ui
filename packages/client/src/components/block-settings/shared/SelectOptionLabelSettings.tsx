import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { BaseSettingSection } from '../BaseSettingSection';
import { copy, getValueByPath } from '@/utility';
import { Autocomplete, TextField } from '@mui/material';

interface SelectOptionLabelSettings<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label to pass into the input
     */
    label: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const SelectOptionLabelSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
    }: SelectOptionLabelSettings<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const { state } = useBlocks();

        // get the block
        const block = state.getBlock(id);

        const parsedData = computed(() => {
            return copy(block.data, (instance) => {
                if (typeof instance === 'string') {
                    // try to extract the variable
                    return state.parseVariable(instance);
                }

                return instance;
            });
        }).get();

        const keys: string[] = useMemo(() => {
            try {
                let arr = [];
                if (!Array.isArray(parsedData?.options)) {
                    if (typeof parsedData.options === 'string') {
                        const opts: string = parsedData.options;
                        if (opts.startsWith('[') && opts.endsWith(']')) {
                            const parsedArr = JSON.parse(parsedData.options);
                            const first = parsedArr[0];
                            if (
                                typeof first === 'object' &&
                                !Array.isArray(first) &&
                                first !== null
                            ) {
                                arr = Object.keys(first);
                            } else {
                                arr = parsedArr;
                            }
                        }
                    }
                } else {
                    arr = parsedData.options;
                }
                return arr.map((option) => {
                    if (typeof option !== 'string') {
                        return JSON.stringify(option);
                    } else {
                        return option;
                    }
                });
            } catch {
                return [];
            }
        }, [parsedData.options]);

        const isJsonOpts = useMemo(() => {
            try {
                if (!Array.isArray(parsedData?.options)) {
                    if (typeof parsedData.options === 'string') {
                        const opts: string = parsedData.options;
                        if (opts.startsWith('[') && opts.endsWith(']')) {
                            const parsedArr = JSON.parse(parsedData.options);
                            const first = parsedArr[0];
                            if (
                                typeof first === 'object' &&
                                !Array.isArray(first) &&
                                first !== null
                            ) {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    }
                } else {
                    return false;
                }
                return false;
            } catch {
                return false;
            }
        }, [parsedData.options]);
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
                    setData(path, value as PathValue<D['data'], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        if (!isJsonOpts) {
            if (parsedData[path]) {
                setData(path, '' as PathValue<D['data'], typeof path>);
            }
            return <></>;
        }

        return (
            <BaseSettingSection label={label}>
                <Autocomplete
                    fullWidth
                    options={keys}
                    onChange={(_, newValue) => {
                        console.log('hello', newValue);
                        // sync the data on change
                        onChange(newValue as string);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            variant="outlined"
                        />
                    )}
                />
            </BaseSettingSection>
        );
    },
);
