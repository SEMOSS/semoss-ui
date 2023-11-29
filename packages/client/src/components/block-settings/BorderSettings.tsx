import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { MenuItem, Select, Stack, Typography } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
interface BorderSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * Path to update
     */
    borderPath: Paths<Block<D>['data'], 4>;
    borderStylePath: Paths<Block<D>['data'], 4>;
    borderColorPath: Paths<Block<D>['data'], 4>;
}
export const BorderSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        borderPath,
        borderStylePath,
        borderColorPath,
    }: BorderSettingsProps<D>) => {
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
                const v = getValueByPath(data, borderPath);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }
                return JSON.stringify(v);
            });
        }, [data, borderPath]).get();
        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        useEffect(() => {
            if (value) {
                // set other border related values
                if (!getValueByPath(data, borderStylePath)) {
                    setData(
                        borderStylePath,
                        'solid' as PathValue<D['data'], typeof borderStylePath>,
                    );
                }
                if (!getValueByPath(data, borderColorPath)) {
                    setData(
                        borderColorPath,
                        '#000000' as PathValue<
                            D['data'],
                            typeof borderColorPath
                        >,
                    );
                }
            } else {
                // clear other border related values
                if (!getValueByPath(data, borderStylePath)) {
                    setData(
                        borderStylePath,
                        '' as PathValue<D['data'], typeof borderStylePath>,
                    );
                }
                if (!getValueByPath(data, borderColorPath)) {
                    setData(
                        borderColorPath,
                        '' as PathValue<D['data'], typeof borderColorPath>,
                    );
                }
            }
        }, [value]);
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
                    // set the value
                    setData(
                        borderPath,
                        value as PathValue<D['data'], typeof borderPath>,
                    );
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
                <Typography variant="body2">Border Size</Typography>
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
                        <MenuItem value={''}>
                            <em>None</em>
                        </MenuItem>
                        <MenuItem value={'0.125rem'}>Small</MenuItem>
                        <MenuItem value={'0.25rem'}>Medium</MenuItem>
                        <MenuItem value={'0.5rem'}>Large</MenuItem>
                    </Select>
                </Stack>
            </Stack>
        );
    },
);
