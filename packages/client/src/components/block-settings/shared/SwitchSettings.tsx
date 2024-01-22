import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Switch } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

interface SwitchSettingsProps<D extends BlockDef = BlockDef> {
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

export const SwitchSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
    }: SwitchSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState<boolean>(false);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return false;
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return false;
                } else if (typeof v === 'string') {
                    return v === 'true';
                } else if (typeof v === 'boolean') {
                    return v;
                }

                return JSON.stringify(v) === 'true';
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: boolean) => {
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
                <Switch
                    checked={value}
                    onChange={(e) => {
                        // sync the data on change
                        onChange(!value);
                    }}
                />
            </BaseSettingSection>
        );
    },
);
