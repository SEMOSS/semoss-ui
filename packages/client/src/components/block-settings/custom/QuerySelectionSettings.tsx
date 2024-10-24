import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef, Variable } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

interface QuerySelectionSettingsProps<D extends BlockDef = BlockDef> {
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

    /**
     * Query path to bind to
     */
    queryPath: 'isLoading' | 'output';

    /**
     * Callback
     */
    __onChange?: () => void;
}

/**
 * Specifically for selecting a query for to associate with loading/disabled/etc
 */
export const QuerySelectionSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
        queryPath,
        __onChange,
    }: QuerySelectionSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);
        const { state } = useBlocks();

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

        // available notebooks for autocomplete
        const notebooks = useMemo(() => {
            return Object.keys(state.variables).reduce((acc, queryKey) => {
                if (
                    state.variables[queryKey].type === 'query' ||
                    state.variables[queryKey].type === 'cell'
                ) {
                    return {
                        ...acc,
                        [`{{${queryKey}.${queryPath}}}`]: queryKey,
                    };
                } else {
                    return {
                        ...acc,
                    };
                }
            }, {});

            // return queryVariables
        }, [Object.keys(state.variables).length]);

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
                    __onChange();
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection label={label}>
                <Autocomplete
                    fullWidth
                    disableClearable={value === ''}
                    size="small"
                    value={value}
                    options={Object.keys(notebooks)}
                    getOptionLabel={(id: string) => {
                        return notebooks[id] ?? '';
                    }}
                    onChange={(_, value) => {
                        onChange(value);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder="Query"
                            size="small"
                            variant="outlined"
                        />
                    )}
                />
            </BaseSettingSection>
        );
    },
);
