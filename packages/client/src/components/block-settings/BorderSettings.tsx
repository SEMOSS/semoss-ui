import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { MenuItem, Select, Stack, TextField, Typography } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';

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
export const BorderSettings = observer(
    <D extends BlockDef = BlockDef>({ id, path }: BorderSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);

        // track the value
        const [borderSizeValue, setBorderSizeValue] = useState('');
        const [borderStyleValue, setBorderStyleValue] = useState('');
        const [borderColorValue, setBorderColorValue] = useState('#FFFFFF');

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
                setBorderSizeValue('');
                setBorderStyleValue('');
                setBorderColorValue('#FFFFFF');
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
            setBorderSizeValue(borderSize);
            setBorderStyleValue(borderStyle);
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
        return (
            <>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="body2">Border Size</Typography>
                    <Stack direction="row" justifyContent="end" width="50%">
                        <Select
                            fullWidth
                            size="small"
                            value={borderSizeValue}
                            onChange={(e) => {
                                if (e.target.value) {
                                    onChange(
                                        e.target.value,
                                        borderStyleValue ?? 'solid',
                                        borderColorValue ?? '#000000',
                                    );
                                } else {
                                    onChange('', '', '');
                                }
                            }}
                        >
                            <MenuItem value={''}>
                                <em>None</em>
                            </MenuItem>
                            <MenuItem value={'0.125rem'}>Small</MenuItem>
                            <MenuItem value={'0.25rem'}>Medium</MenuItem>
                            <MenuItem value={'0.5rem'}>Large</MenuItem>
                        </Select>
                    </Stack>
                </Stack>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="body2">Border Style</Typography>
                    <Stack direction="row" justifyContent="end" width="50%">
                        <Select
                            fullWidth
                            size="small"
                            value={borderStyleValue}
                            onChange={(e) => {
                                if (e.target.value) {
                                    onChange(
                                        borderSizeValue ?? '0.125rem',
                                        e.target.value,
                                        borderColorValue ?? '#000000',
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
                    </Stack>
                </Stack>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Typography variant="body2">Border Color</Typography>
                    <Stack direction="row" width="50%">
                        <TextField
                            fullWidth
                            type="color"
                            value={borderColorValue}
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
                    </Stack>
                </Stack>
            </>
        );
    },
);
