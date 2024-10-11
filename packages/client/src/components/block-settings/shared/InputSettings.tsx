import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

interface InputSettingsProps<D extends BlockDef = BlockDef> {
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
     * Secondary to update
     */
    secondaryPath?: Paths<Block<D>['data'], 4>;

    /** Type of input to render for settings */
    type?: string;

    /**
     * Parse input as object to set value
     */
    valueAsObject?: boolean;

    /**
     * What to be displayed on the tooltip to explain setting
     */
    description?: string;
}

export const InputSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        secondaryPath = undefined,
        type = 'text',
        valueAsObject = false,
        description,
    }: InputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

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
                    let valueToSet = value;
                    if (valueAsObject) {
                        try {
                            valueToSet = !!value
                                ? JSON.parse(value)
                                : undefined;
                        } catch (e) {
                            console.log(e);
                        }
                    }
                    // set the value
                    setData(
                        path,
                        valueToSet as PathValue<D['data'], typeof path>,
                    );
                    if (!!secondaryPath) {
                        setData(
                            secondaryPath,
                            valueToSet as PathValue<
                                D['data'],
                                typeof secondaryPath
                            >,
                        );
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection label={label} description={description}>
                <TextField
                    fullWidth
                    value={value}
                    onChange={(e) => {
                        // sync the data on change
                        onChange(e.target.value);
                    }}
                    placeholder={
                        data.hasOwnProperty('type') &&
                        data.type === 'date' &&
                        path === 'value'
                            ? 'YYYY-MM-DD'
                            : null
                    }
                    type={type}
                    size="small"
                    variant="outlined"
                    autoComplete="off"
                />
            </BaseSettingSection>
        );
    },
);
