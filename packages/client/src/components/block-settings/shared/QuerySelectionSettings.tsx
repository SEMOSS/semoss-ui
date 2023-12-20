import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Autocomplete, TextField } from '@mui/material';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
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
}

/**
 * Specifically for selecting a query for to associate with loading/disabled/etc
 */
export const QuerySelectionSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
    }: QuerySelectionSettingsProps<D>) => {
        const { data, setBlockQueries } = useBlockSettings(id);
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

        // available queries for autocomplete
        const queries = useMemo(() => {
            return Object.keys(state.queries).reduce((acc, queryKey) => {
                return { ...acc, [`{{${queryKey}.isLoading}}`]: queryKey };
            }, {});
        }, [Object.keys(state.queries).length]);

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

            // TO-DO (John): Go change blocks to loading if that query is loading
            // State Action: SET_BLOCK_QUERIES
            timeoutRef.current = setTimeout(() => {
                try {
                    debugger;
                    // Go set the block dependencies in that blocks data
                    setBlockQueries(value);
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
                    options={Object.keys(queries)}
                    getOptionLabel={(queryLoadingInput: string) =>
                        queries[queryLoadingInput] ?? ''
                    }
                    onChange={(_, value) => {
                        onChange(value);
                    }}
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Query" />
                    )}
                />
            </BaseSettingSection>
        );
    },
);
