import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField, ToggleButton, ToggleButtonGroup } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useDesigner } from '@/hooks';
import { ActionMessages, Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

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
        const { designer } = useDesigner();

        // track the value
        const [value, setValue] = useState('');

        // track the unit of the value, ex % or px
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
            if (computedValue.includes('%')) {
                setValueType('%');
            } else if (computedValue.includes('px')) {
                setValueType('px');
            }
            setValue(computedValue);
        }, [computedValue]);

        // numeric value for the text field
        const numericValue = useMemo(() => {
            return value.replace(/\D+/g, '');
        }, [value]);

        // default value type % if one is not set when the value is set
        // remove type when value is unset
        useMemo(() => {
            if (numericValue && !valueType) {
                setValueType('%');
            } else if (!numericValue) {
                setValueType('');
            }
        }, [numericValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value - this is a number string
            setValue(value);

            // get value with unit for setting data
            const valueWithUnit = value ? value + valueType : value;

            // clear the old timeout
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
                    // emit event to resize the block on the screen
                    designer.blocks.dispatch({
                        message: ActionMessages.DISPATCH_EVENT,
                        payload: {
                            name: 'blockResized',
                        },
                    });
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        // update data when unit changes
        useMemo(() => {
            if (numericValue) {
                onChange(numericValue);
            }
        }, [valueType]);

        return (
            <BaseSettingSection label={label}>
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
            </BaseSettingSection>
        );
    },
);
