import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

interface SelectSettingsProps<D extends BlockDef = BlockDef> {
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

    /**
     * Options
     */
    options: string[];
}

export const SelectSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        options,
    }: SelectSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const { state } = useBlocks();
        //  track the value
        const [value, setValue] = useState([]);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return [];
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return [];
                } else if (typeof v === 'string') {
                    return (v as string).split(',');
                }

                return v;
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue as string[]);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string[]) => {
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
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection label={label}>
                <Autocomplete
                    fullWidth
                    multiple
                    value={value}
                    options={options}
                    getOptionLabel={(option) => option}
                    onChange={(_, value) => {
                        onChange(value);
                    }}
                    freeSolo={false}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder="Select extensions"
                            size="small"
                            variant="outlined"
                        />
                    )}
                />
            </BaseSettingSection>
        );
    },
);
