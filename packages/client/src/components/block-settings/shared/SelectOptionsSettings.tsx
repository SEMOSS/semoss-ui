import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks, usePixel } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { BaseSettingSection } from '../BaseSettingSection';
import { copy, getValueByPath } from '@/utility';
import { TextField } from '@semoss/ui';
import { Autocomplete, TextField as MaterialTextField } from '@mui/material';
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

interface Engine {
    app_id: string;
    app_name: string;
    app_type: string;
    app_subtype: string;
}

const toCapitalCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const SelectOptionsSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        optionData,
    }: SelectOptionsSettings<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const { state } = useBlocks();

        const [optionSource, setOptionSource] = useState<'query' | 'engine'>(
            'query',
        );
        const [engineType, setEngineType] = useState<string>('');
        const [engines, setEngines] = useState<{ [key: string]: Engine[] }>({});

        // Fetch engines data
        const getEngines = usePixel<Engine[]>(`MyEngines();`);

        useEffect(() => {
            if (getEngines.status === 'SUCCESS') {
                const enginesByType = getEngines.data.reduce((acc, engine) => {
                    const type = engine.app_type.toLowerCase();
                    if (!acc[type]) {
                        acc[type] = [];
                    }
                    acc[type].push({
                        app_name: engine.app_name.replace(/_/g, ' '),
                        app_id: engine.app_id,
                        app_type: engine.app_type,
                        app_subtype: engine.app_subtype,
                    });
                    return acc;
                }, {});
                setEngines(enginesByType);
            }
        }, [getEngines.status, getEngines.data]);

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

        const handleOptionSourceChange = (newSource: 'query' | 'engine') => {
            setOptionSource(newSource);
            setEngineType('');
            setData(
                'options' as Paths<Block<D>['data'], 4>,
                [] as PathValue<D['data'], typeof path>,
            );
            setData(
                'value' as Paths<Block<D>['data'], 4>,
                parsedData.multiple
                    ? ([] as PathValue<D['data'], typeof path>)
                    : ('' as PathValue<D['data'], typeof path>),
            );
        };

        const handleEngineTypeChange = (newType: string) => {
            setEngineType(newType);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    const selectedEngines = engines[newType] || [];
                    setData(
                        'options' as Paths<Block<D>['data'], 4>,
                        selectedEngines as PathValue<D['data'], typeof path>,
                    );
                    if (selectedEngines.length > 0) {
                        // Set options for label and sublabel fields
                        const labelOptions = Object.keys(
                            selectedEngines[0] || {},
                        ).map((key) => ({
                            label: key,
                            value: key,
                        }));

                        optionData.forEach((d) => {
                            if (
                                d.label === 'Label Field' ||
                                d.label === 'Sublabel Field'
                            ) {
                                setData(
                                    d.path,
                                    labelOptions as PathValue<
                                        D['data'],
                                        typeof d.path
                                    >,
                                );
                            } else {
                                setData(
                                    d.path,
                                    '' as PathValue<D['data'], typeof d.path>,
                                );
                            }
                        });
                        setData(
                            'value' as Paths<Block<D>['data'], 4>,
                            parsedData.multiple
                                ? ([] as PathValue<D['data'], typeof path>)
                                : ('' as PathValue<D['data'], typeof path>),
                        );
                    }
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
                    <BaseSettingSection label="Option Source">
                        <Autocomplete
                            value={optionSource}
                            options={['Query', 'Engine']}
                            onChange={(_, newValue) =>
                                handleOptionSourceChange(
                                    newValue as 'query' | 'engine',
                                )
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            fullWidth
                        />
                    </BaseSettingSection>
                    {optionSource === 'query' ? (
                        <QuerySelectionSettings
                            id={id}
                            label="Options"
                            path="options"
                            queryPath="output"
                            __onChange={() => {
                                setData(
                                    'value' as Paths<Block<D>['data'], 4>,
                                    parsedData.multiple
                                        ? ([] as PathValue<
                                              D['data'],
                                              typeof path
                                          >)
                                        : ('' as PathValue<
                                              D['data'],
                                              typeof path
                                          >),
                                );

                                optionData.map((d) => {
                                    setData(
                                        d.path,
                                        '' as PathValue<D['data'], typeof path>,
                                    );
                                });
                            }}
                        />
                    ) : (
                        <BaseSettingSection label="Engine Type">
                            <Autocomplete
                                value={engineType}
                                options={Object.keys(engines)}
                                onChange={(_, newValue) =>
                                    handleEngineTypeChange(newValue)
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>{toCapitalCase(option)}</li>
                                )}
                                getOptionLabel={(option) =>
                                    toCapitalCase(option)
                                }
                                fullWidth
                            />
                        </BaseSettingSection>
                    )}
                </>
            );
        }

        return (
            <>
                <BaseSettingSection label="Option Source">
                    <Autocomplete
                        value={optionSource}
                        options={['Query', 'Engine']}
                        onChange={(_, newValue) =>
                            handleOptionSourceChange(
                                newValue as 'query' | 'engine',
                            )
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                variant="outlined"
                            />
                        )}
                        fullWidth
                    />
                </BaseSettingSection>
                {optionSource === 'query' ? (
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
                                parsedData.multiple
                                    ? ([] as PathValue<D['data'], typeof path>)
                                    : ('' as PathValue<D['data'], typeof path>),
                            );

                            optionData.map((d) => {
                                setData(
                                    d.path,
                                    '' as PathValue<D['data'], typeof path>,
                                );
                            });
                        }}
                    />
                ) : (
                    <BaseSettingSection label="Engine Type">
                        <Autocomplete
                            value={engineType}
                            options={Object.keys(engines)}
                            onChange={(_, newValue) =>
                                handleEngineTypeChange(newValue)
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props}>{toCapitalCase(option)}</li>
                            )}
                            getOptionLabel={(option) => toCapitalCase(option)}
                            fullWidth
                        />
                    </BaseSettingSection>
                )}
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
                                    }}
                                    renderInput={(params) => (
                                        <MaterialTextField
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
