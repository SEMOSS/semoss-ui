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
    id: string;
    label: string;
    path: Paths<Block<D>['data'], 4>;
    secondaryPath?: Paths<Block<D>['data'], 4>;
    type?: string;
    valueAsObject?: boolean;
    description?: string;
    limit?: number;
    min?: number;
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
        limit,
        min,
    }: InputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // Initialize state with defaultValue

        const [value, setValue] = useState<string | number>('');

        // Track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // Get the value of the input (wrapped in useMemo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string' || typeof v === 'number') {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        // Update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // Set the value
            if (
                limit &&
                ((Number(value) > limit && type === 'number') ||
                    (limit && min && Number(value) < min))
            ) {
                return;
            }

            setValue(value);

            // Clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    let valueToSet: string | number = value;

                    if (valueAsObject) {
                        try {
                            valueToSet = !!value
                                ? JSON.parse(value)
                                : undefined;
                        } catch (e) {
                            console.log(e);
                        }
                    } else if (type === 'number') {
                        valueToSet = Number(value);
                    }

                    // Set the value
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
                        // Sync the data on change
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
