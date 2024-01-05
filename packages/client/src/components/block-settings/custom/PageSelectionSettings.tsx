import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Autocomplete, TextField } from '@mui/material';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import { Checkbox } from '@semoss/ui';

interface PageSelectionSettingsProps<D extends BlockDef = BlockDef> {
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
export const PageSelectionSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
    }: PageSelectionSettingsProps<D>) => {
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

        // available pages for checklist
        const pages = useMemo(() => {
            // return Object.keys(state.queries).reduce((acc, queryKey) => {
            //     return { ...acc, [`{{${queryKey}.isLoading}}`]: queryKey };
            // }, {});
        }, [Object.keys(state.blocks).length]);

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
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection
                label={label}
                direction={'column'}
                alignItems={'flex-start'}
            >
                <div>p</div>
                <div>j</div>
                <Checkbox label={'P-1'} />
            </BaseSettingSection>
        );
    },
);
