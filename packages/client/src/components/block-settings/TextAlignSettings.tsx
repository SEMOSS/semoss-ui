import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    styled,
    MenuItem,
    Select,
    Stack,
    Typography,
    TextField,
    ButtonGroup,
    IconButton,
} from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import {
    FormatAlignCenter,
    FormatAlignJustify,
    FormatAlignLeft,
    FormatAlignRight,
} from '@mui/icons-material';

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
}

export const TextAlignSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
    }: InputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);

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
                    // set the value
                    setData(path, value as PathValue<D['data'], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <Stack direction="row" alignItems={'center'}>
                <Typography variant="body2">{label}</Typography>
                <Stack flex={'1'} justifyContent="end" spacing={2}>
                    <ButtonGroup>
                        <IconButton
                            color={
                                value == 'left' || !!value
                                    ? 'primary'
                                    : undefined
                            }
                            size="small"
                            onClick={() => onChange('left')}
                            title="Left"
                        >
                            <FormatAlignLeft />
                        </IconButton>
                        <IconButton
                            color={value == 'right' ? 'primary' : undefined}
                            size="small"
                            onClick={() => onChange('right')}
                            title="Right"
                        >
                            <FormatAlignRight />
                        </IconButton>
                        <IconButton
                            color={value == 'center' ? 'primary' : undefined}
                            size="small"
                            onClick={() => onChange('center')}
                            title="Center"
                        >
                            <FormatAlignCenter />
                        </IconButton>
                        <IconButton
                            color={value == 'justify' ? 'primary' : undefined}
                            size="small"
                            onClick={() => onChange('justify')}
                            title="Justified"
                        >
                            <FormatAlignJustify />
                        </IconButton>
                    </ButtonGroup>
                </Stack>
            </Stack>
        );
    },
);
