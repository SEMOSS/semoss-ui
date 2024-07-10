import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { BaseSettingSection } from '../BaseSettingSection';
import { copy, getValueByPath } from '@/utility';
import { Autocomplete, TextField } from '@mui/material';
import { QuerySelectionSettings } from '../custom';

interface SelectOptionsSettings<D extends BlockDef = BlockDef> {
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

    /** fields to update */
    optionData: {
        label: string;
        path: Paths<Block<D>['data'], 4>;
        updateDataField?: Paths<Block<D>['data'], 4>;
    }[];
}

export const SelectOptionsSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        optionData,
    }: SelectOptionsSettings<D>) => {
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
                    if (
                        typeof parsedData.options[0] === 'object' &&
                        !Array.isArray(parsedData.options[0]) &&
                        parsedData.options[0] !== null
                    ) {
                        arr = Object.keys(parsedData.options[0]);
                    } else {
                        arr = [];
                    }
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
                    if (
                        typeof parsedData.options[0] === 'object' &&
                        !Array.isArray(parsedData.options[0]) &&
                        parsedData.options[0] !== null
                    ) {
                        return true;
                    } else {
                        return false;
                    }
                }
                return false;
            } catch {
                return false;
            }
        }, [parsedData.options]);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        /**
         * Sync the data on change
         * @param optPath - Select Box Options menu display label, Sub - Label
         */
        const onChange = (value: string, optPath) => {
            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        optPath,
                        value as PathValue<D['data'], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        if (!isJsonOpts) {
            if (parsedData[path]) {
                if (parsedData.options) {
                    optionData.map((d) => {
                        setData(
                            d.path,
                            '' as PathValue<D['data'], typeof path>,
                        );
                    });
                }
            }
            return (
                <>
                    <QuerySelectionSettings
                        id={id}
                        label="Options"
                        path="options"
                        queryPath="output"
                        __onChange={() => {
                            setData(
                                'value' as Paths<Block<D>['data'], 4>,
                                '' as PathValue<D['data'], typeof path>,
                            );

                            optionData.map((d) => {
                                setData(
                                    d.path,
                                    '' as PathValue<D['data'], typeof path>,
                                );
                            });
                        }}
                    />
                </>
            );
        }

        return (
            <>
                <QuerySelectionSettings
                    id={id}
                    label="Options"
                    path="options"
                    queryPath="output"
                    __onChange={() => {
                        console.log(
                            'go update the value that is dependent on this',
                        );
                        setData(
                            'value' as Paths<Block<D>['data'], 4>,
                            '' as PathValue<D['data'], typeof path>,
                        );

                        optionData.map((d) => {
                            setData(
                                d.path,
                                '' as PathValue<D['data'], typeof path>,
                            );
                        });
                    }}
                />
                {optionData.map((d, i) => {
                    return (
                        <div key={`${d.label}-${i}`}>
                            <BaseSettingSection
                                key={`${d.label}-${i}`}
                                label={''}
                            >
                                <Autocomplete
                                    fullWidth
                                    value={parsedData[d.path]}
                                    options={keys}
                                    onChange={(_, newValue) => {
                                        // sync the data on change
                                        onChange(newValue as string, d.path);

                                        // I need to update the Select Block Value
                                        // if (d.updateDataField) {
                                        //     const v = JSON.parse(
                                        //         parsedData.value as string,
                                        //     );
                                        //     const updateValue =
                                        //         v[d.updateDataField];

                                        //     if (parsedData.options && v) {
                                        //         setData(
                                        //             'value' as Paths<
                                        //                 Block<D>['data'],
                                        //                 4
                                        //             >,
                                        //             updateValue as PathValue<
                                        //                 D['data'],
                                        //                 typeof path
                                        //             >,
                                        //         );
                                        //     }
                                        // }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={d.label}
                                            size="small"
                                            variant="outlined"
                                        />
                                    )}
                                />
                            </BaseSettingSection>
                        </div>
                    );
                })}
            </>
        );
    },
);
