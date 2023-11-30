import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

/**
 * Used to set the options for a select block
 * The options will bind to the SelectInputValueSettings
 */

interface SelectInputOptionsSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const SelectInputOptionsSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
    }: SelectInputOptionsSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);

        // track the value
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
            <BaseSettingSection label="Options">
                <TextField
                    value={value.join(',')}
                    onChange={(e) => {
                        // sync the data on change
                        onChange(e.target.value.split(','));
                    }}
                    placeholder="Comma-separated list"
                    size="small"
                    variant="outlined"
                    fullWidth={true}
                    autoComplete="off"
                />
            </BaseSettingSection>
        );
    },
);
