import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    Stack,
    Typography,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';

/**
 * Used for any style settings that utilize a size number, ex width and height
 * Supports % and px units for size
 */

interface SizeSettingsProps<D extends BlockDef = BlockDef> {
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

export const SizeSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
    }: SizeSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState('');

        // track the value type
        const [valueType, setValueType] = useState(null);

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

        // numeric value for the text field
        const numericValue = useMemo(() => {
            return value.replace(/\D+/g, '');
        }, [value]);

        useEffect(() => {
            if (numericValue && !valueType) {
                setValueType('%');
            } else if (!numericValue) {
                setValueType('');
            }
        }, [numericValue]);

        useEffect(() => {
            if (numericValue) {
                onChange(value);
            }
        }, [valueType]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            const valueWithUnit = value ? value + valueType : value;
            // set the value
            setValue(valueWithUnit);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(
                        path,
                        valueWithUnit as PathValue<D['data'], typeof path>,
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
                title={`Edit ${label}`}
            >
                <Typography variant="body2">{label}</Typography>
                <Stack direction="row" width="50%">
                    <TextField
                        fullWidth
                        value={numericValue}
                        onChange={(e) => {
                            // sync the data on change
                            onChange(e.target.value);
                        }}
                        size="small"
                        variant="outlined"
                        autoComplete="off"
                    />
                    <ToggleButtonGroup value={valueType} exclusive size="small">
                        <ToggleButton
                            value="%"
                            color={valueType === '%' ? 'primary' : undefined}
                            onClick={() => setValueType('%')}
                        >
                            %
                        </ToggleButton>
                        <ToggleButton
                            value="px"
                            color={valueType === 'px' ? 'primary' : undefined}
                            onClick={() => setValueType('px')}
                        >
                            px
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Stack>
        );
    },
);
