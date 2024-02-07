import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { MenuItem, Select, Stack, Typography } from '@/component-library';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

/**
 * FontSizeSettings is its own component even though it is a simple select
 * Because we want to control both size and weight for certain typography types, ex headers
 */

interface FontSizeSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    sizePath: Paths<Block<D>['data'], 4>;
    weightPath: Paths<Block<D>['data'], 4>;
}

export const FontSizeSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        sizePath,
        weightPath,
    }: FontSizeSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);

        // track the value
        const [value, setValue] = useState('');

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '1rem';
                }

                const v = getValueByPath(data, sizePath);
                if (typeof v === 'undefined') {
                    return '1rem';
                } else if (typeof v === 'string') {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data, sizePath]).get();

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
                    setData(
                        sizePath,
                        value as PathValue<D['data'], typeof sizePath>,
                    );
                    if (['1rem', '1.125rem', '1.25rem'].includes(value)) {
                        setData(
                            weightPath,
                            'inherit' as PathValue<
                                D['data'],
                                typeof weightPath
                            >,
                        );
                    } else {
                        setData(
                            weightPath,
                            'bold' as PathValue<D['data'], typeof weightPath>,
                        );
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection label="Font Size">
                <Select
                    fullWidth
                    size="small"
                    value={value}
                    onChange={(e) => {
                        // sync the data on change
                        onChange(e.target.value);
                    }}
                >
                    <MenuItem value={'1rem'}>Body</MenuItem>
                    <MenuItem value={'1.125rem'}>
                        <span style={{ fontSize: '1.125rem' }}>Subtitle 2</span>
                    </MenuItem>
                    <MenuItem value={'1.25rem'}>
                        <span style={{ fontSize: '1.25rem' }}>Subtitle 1</span>
                    </MenuItem>
                    <MenuItem value={'1.5rem'}>
                        <span
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                            }}
                        >
                            Header 3
                        </span>
                    </MenuItem>
                    <MenuItem value={'1.875rem'}>
                        <span
                            style={{
                                fontSize: '1.875rem',
                                fontWeight: 'bold',
                                padding: '2px 0',
                            }}
                        >
                            Header 2
                        </span>
                    </MenuItem>
                    <MenuItem value={'2.125rem'}>
                        <span
                            style={{
                                fontSize: '2.125rem',
                                fontWeight: 'bold',
                                padding: '2px 0',
                            }}
                        >
                            Header 1
                        </span>
                    </MenuItem>
                </Select>
            </BaseSettingSection>
        );
    },
);
