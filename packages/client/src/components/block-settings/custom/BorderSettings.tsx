import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    MenuItem,
    Select,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

/**
 * BorderSettings is its own component because multiple inputs point to the same style path
 * This is done to easily turn on/off all the border properties at once for better UX
 */

interface BorderSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

const SIZE_VALUE_TYPES = ['em', 'px', '%'];

export const BorderSettings = observer(
    <D extends BlockDef = BlockDef>({ id, path }: BorderSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);

        // track the value
        const [borderSizeValue, setBorderSizeValue] = useState(null);
        const [borderStyleValue, setBorderStyleValue] = useState(null);
        const [borderColorValue, setBorderColorValue] = useState('#FFFFFF');
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
            const borderValues = computedValue.split(' ');
            if (borderValues.length === 3) {
                setBorderSizeValue(borderValues[0]);
                setBorderStyleValue(borderValues[1]);
                setBorderColorValue(borderValues[2]);
            } else {
                setBorderSizeValue(null);
                setBorderStyleValue(null);
                setBorderColorValue(null);
            }
            if (computedValue.includes('%')) {
                setValueType('%');
            } else if (computedValue.includes('px')) {
                setValueType('px');
            } else if (computedValue.includes('em')) {
                setValueType('em');
            }
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (
            borderSize: string,
            borderStyle: string,
            borderColor: string,
        ) => {
            // set the values
            setBorderSizeValue(borderSize ?? '0px');
            setBorderStyleValue(borderStyle ?? 'solid');
            setBorderColorValue(borderColor ?? '#FFFFFF');
            // clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(
                        path,
                        `${borderSize} ${borderStyle} ${borderColor}` as PathValue<
                            D['data'],
                            typeof path
                        >,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        // numeric value for the text field
        const numericSizeValue = useMemo(() => {
            if (borderSizeValue) {
                return borderSizeValue.replace(/\D+/g, '');
            }
        }, [borderSizeValue]);

        // update data when unit changes
        useMemo(() => {
            if (numericSizeValue) {
                onChange(
                    `${numericSizeValue}${valueType}`,
                    borderStyleValue ?? 'solid',
                    borderColorValue ?? '#FFFFFF',
                );
            }
        }, [valueType]);

        // default value type % if one is not set when the value is set
        // remove type when value is unset
        useMemo(() => {
            if (numericSizeValue && !valueType) {
                setValueType('px');
            } else if (!numericSizeValue) {
                setValueType('');
            }
        }, [numericSizeValue]);

        const getColorForButtonValue = (
            buttonValue: string,
        ): 'primary' | undefined => {
            return valueType === buttonValue ? 'primary' : undefined;
        };

        return (
            <>
                <BaseSettingSection label="Border Size">
                    <TextField
                        fullWidth
                        value={numericSizeValue ?? ''}
                        onChange={(e) => {
                            // sync the data on change
                            if (e.target.value) {
                                onChange(
                                    `${e.target.value}${valueType}`,
                                    borderStyleValue ?? 'solid',
                                    borderColorValue ?? '#FFFFFF',
                                );
                            } else {
                                onChange('', '', '');
                            }
                        }}
                        size="small"
                        variant="outlined"
                        autoComplete="off"
                    />
                    <ToggleButtonGroup value={valueType} exclusive size="small">
                        {Array.from(
                            SIZE_VALUE_TYPES,
                            (buttonValueType: string) => {
                                return (
                                    <ToggleButton
                                        key={buttonValueType}
                                        value={buttonValueType}
                                        color={getColorForButtonValue(
                                            buttonValueType,
                                        )}
                                        onClick={() =>
                                            setValueType(buttonValueType)
                                        }
                                    >
                                        {buttonValueType}
                                    </ToggleButton>
                                );
                            },
                        )}
                    </ToggleButtonGroup>
                </BaseSettingSection>
                <BaseSettingSection label="Border Style">
                    <Select
                        fullWidth
                        size="small"
                        value={borderStyleValue ?? ''}
                        onChange={(e) => {
                            if (e.target.value) {
                                onChange(
                                    borderSizeValue ?? '0.125rem',
                                    e.target.value,
                                    borderColorValue ?? '#FFFFFF',
                                );
                            } else {
                                onChange('', '', '');
                            }
                        }}
                    >
                        <MenuItem value={''}>
                            <em>None</em>
                        </MenuItem>
                        <MenuItem value={'solid'}>Solid</MenuItem>
                        <MenuItem value={'dashed'}>Dashed</MenuItem>
                        <MenuItem value={'dotted'}>Dotted</MenuItem>
                    </Select>
                </BaseSettingSection>
                <BaseSettingSection label="Border Color">
                    <TextField
                        fullWidth
                        type="color"
                        value={borderColorValue ?? '#FFFFFF'}
                        onChange={(e) => {
                            if (e.target.value) {
                                onChange(
                                    borderSizeValue ?? '0.125rem',
                                    borderStyleValue ?? 'solid',
                                    e.target.value,
                                );
                            } else {
                                onChange('', '', '');
                            }
                        }}
                        size="small"
                        variant="outlined"
                        autoComplete="off"
                    />
                </BaseSettingSection>
            </>
        );
    },
);
