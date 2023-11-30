import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { MenuItem, Select, Stack, Typography } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';

/**
 * Used for discrete selection options tied to values, ex S/M/L
 */

interface SelectInputSettingsProps<D extends BlockDef = BlockDef> {
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
     * Options for select
     */
    options: Array<{ value: string; display: string }>;

    /**
     * Whether an empty 'None' option should be in the select
     */
    allowUnset: boolean;
}

export const SelectInputSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
        options,
        allowUnset,
    }: SelectInputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);

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
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
            >
                <Typography variant="body2">{label}</Typography>
                <Stack direction="row" justifyContent="end" width="50%">
                    <Select
                        fullWidth
                        size="small"
                        value={value}
                        onChange={(e) => {
                            // sync the data on change
                            onChange(e.target.value);
                        }}
                    >
                        {allowUnset ? (
                            <MenuItem value={''}>
                                <em>None</em>
                            </MenuItem>
                        ) : (
                            <></>
                        )}
                        {Array.from(options, (option, i) => {
                            return (
                                <MenuItem key={i} value={option.value}>
                                    {option.display}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </Stack>
            </Stack>
        );
    },
);
