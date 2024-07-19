import { useMemo, CSSProperties, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useDebounce } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { debounce } from '@/utility';

import {
    Autocomplete,
    LinearProgress,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { optimize } from 'webpack';

export interface SelectBlockDef extends BlockDef<'select'> {
    widget: 'select';
    data: {
        style: CSSProperties;
        label: string;
        value: string;
        required: boolean;
        disabled: boolean;
        options: string[];
        optionLabel?: string;
        optionSublabel?: string;
        optionValue?: string;
        hint?: string;
        loading?: boolean;
    };
}

/**
 * Calling this a "select" block because it's better semantically to explain what the block does
 * But using an autocomplete because it offers better UX when there are many options
 */
export const SelectBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } = useBlock<SelectBlockDef>(id);
    const [changedValue, setChangedValue] = useState('');

    const stringifiedOptions: string[] = useMemo(() => {
        let arr = [];
        if (!data.options) {
            // NOOP
        } else if (!Array.isArray(data?.options)) {
            if (typeof data.options === 'string') {
                const opts: string = data.options;
                if (opts.startsWith('[') && opts.endsWith(']')) {
                    arr = JSON.parse(data.options);
                }
            }
        } else {
            arr = data.options;
        }
        return arr.map((option) => {
            if (typeof option !== 'string') {
                return JSON.stringify(option);
            } else {
                return option;
            }
        });
    }, [data.options]);

    // useDebounce(
    //     () => {
    //         listeners.onChange();
    //     },
    //     [changedValue],
    //     200,
    // );

    return (
        <Autocomplete
            fullWidth
            disableClearable
            options={stringifiedOptions}
            value={data.value || null}
            disabled={data?.disabled || data?.loading}
            renderOption={(props, option: string) => {
                try {
                    // Parse the option string into an object
                    const parsedOption = JSON.parse(option);

                    // Extract optionLabel and optionSublabel from the parsed object
                    const optionLabel = parsedOption[data?.optionLabel];
                    const optionSublabel = parsedOption[data?.optionSublabel];

                    if (optionLabel && optionSublabel) {
                        // Both labels are present, render them in a structured format
                        return (
                            <li {...props} style={{ whiteSpace: 'pre-wrap' }}>
                                <Stack direction={'column'}>
                                    <>{optionLabel}</>
                                    <Typography variant="caption">
                                        {optionSublabel}
                                    </Typography>
                                </Stack>
                            </li>
                        );
                    } else {
                        // If one or both labels are missing, fall back to the whole option or a default message
                        return <li {...props}>{optionLabel || option}</li>;
                    }
                } catch (error) {
                    return <li {...props}>{option}</li>;
                }
            }}
            getOptionLabel={(option: string) => {
                try {
                    // More error handling and testing
                    const isObj = JSON.parse(option)[data.optionLabel];

                    if (isObj) {
                        return isObj;
                    }

                    return option;
                } catch {
                    return option;
                }
            }}
            onChange={(_, value) => {
                const parsedVal = value;

                debugger;
                setData('value', value);
                debounce(() => {
                    listeners.onChange();
                }, 500);
                //setChangedValue(value);
            }}
            sx={{
                ...data.style,
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    size="small"
                    label={data.label}
                    variant="outlined"
                    required={data.required}
                    disabled={data?.disabled || data?.loading}
                    helperText={
                        data?.loading ? (
                            <LinearProgress color="primary" />
                        ) : (
                            data?.hint
                        )
                    }
                />
            )}
            {...attrs}
        />
    );
});
