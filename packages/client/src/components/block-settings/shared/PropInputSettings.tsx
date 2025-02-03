import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import { Stack, Typography } from '@mui/material';

// Utility function to convert camelCase to Camel Case
const camelCaseToWords = (input: string): string => {
    return input
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add a space before uppercase letters
        .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
};

interface PropInputSettingsProps<D extends BlockDef = BlockDef> {
    id: string;
    label: string;
    path: Paths<Block<D>['data'], 4>;
    propType?: string;
    defaultValue?: any;
    description?: string;
}

export const PropInputSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        propType = 'string',
        defaultValue = '',
        description,
    }: PropInputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState('');
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return defaultValue;
                }
                const rawProps = getValueByPath(data, path);
                let currentProps = {};

                if (typeof rawProps === 'string') {
                    try {
                        currentProps = JSON.parse(rawProps);
                    } catch (e) {
                        console.error('Error parsing props string:', e);
                    }
                } else if (typeof rawProps === 'object' && rawProps !== null) {
                    currentProps = rawProps;
                }

                const propValue = currentProps[label];
                if (typeof propValue === 'undefined') {
                    return defaultValue;
                }

                return propType === 'number' ? propValue.toString() : propValue;
            });
        }, [data, path, label, defaultValue]).get();

        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        const onChange = (newValue: string) => {
            setValue(newValue);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    const rawProps = getValueByPath(data, path);
                    let currentProps = {};
                    if (typeof rawProps === 'string') {
                        try {
                            currentProps = JSON.parse(rawProps);
                        } catch (e) {
                            console.error('Error parsing props string:', e);
                        }
                    } else if (
                        typeof rawProps === 'object' &&
                        rawProps !== null
                    ) {
                        currentProps = rawProps;
                    }
                    const processedValue =
                        propType === 'number' ? Number(newValue) : newValue;
                    const updatedProps = {
                        ...currentProps,
                        [label]: processedValue,
                    };

                    setData(
                        path,
                        JSON.stringify(updatedProps) as PathValue<
                            D['data'],
                            typeof path
                        >,
                    );
                } catch (e) {
                    console.log('Error updating props:', e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection
                label={camelCaseToWords(label)}
                description={description}
            >
                <Stack spacing={1}>
                    <TextField
                        fullWidth
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        type={propType === 'number' ? 'number' : 'text'}
                        size="small"
                        variant="outlined"
                        autoComplete="off"
                    />
                </Stack>
            </BaseSettingSection>
        );
    },
);
