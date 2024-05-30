import { useMemo, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, useDebounce } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { Autocomplete, LinearProgress, TextField } from '@mui/material';
import { optimize } from 'webpack';

export interface SelectBlockDef extends BlockDef<'select'> {
    widget: 'select';
    data: {
        style: CSSProperties;
        label: string;
        value: string;
        options: string[];
        required: boolean;
        disabled: boolean;
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

    useDebounce(
        () => {
            listeners.onChange();
        },
        [listeners, data.value],
        200,
    );

    return (
        <Autocomplete
            fullWidth
            disableClearable
            options={stringifiedOptions}
            value={data.value || null}
            disabled={data?.disabled || data?.loading}
            onChange={(_, value) => {
                setData('value', value);
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
