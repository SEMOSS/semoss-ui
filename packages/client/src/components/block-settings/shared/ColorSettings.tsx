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
 * Use for color inputs
 * Default value for color input is non-nullable and black (#000000),
 * so should be customized with a value as necessary
 */

interface ColorSettingsProps<D extends BlockDef = BlockDef> {
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
     * Default color for picker
     */
    defaultColor?: string;
}

export const ColorSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        defaultColor = '#FFFFFF',
    }: ColorSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState(defaultColor);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return defaultColor;
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return defaultColor;
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
            <BaseSettingSection label={label}>
                <TextField
                    fullWidth
                    type="color"
                    value={value}
                    onChange={(e) => {
                        // sync the data on change
                        onChange(e.target.value);
                    }}
                    size="small"
                    variant="outlined"
                    autoComplete="off"
                />
            </BaseSettingSection>
        );
    },
);
