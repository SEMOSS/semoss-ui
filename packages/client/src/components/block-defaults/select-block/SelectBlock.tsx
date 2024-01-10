import { CSSProperties, useMemo, useCallback } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { Autocomplete, LinearProgress, TextField } from '@mui/material';

export interface SelectBlockDef extends BlockDef<'select'> {
    widget: 'select';
    data: {
        style: CSSProperties;
        label: string;
        value: string;
        options: object[] | string[] | number[];
        required: boolean;
        disabled: boolean;
        content?: object[] | string[] | number[] | string;
        hint?: string;
        loading?: boolean;
    };
}

/**
 * Calling this a "select" block because it's better semantically to explain what the block does
 * But using an autocomplete because it offers better UX when there are many options
 */
export const SelectBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<SelectBlockDef>(id);

    const content = useMemo(() => {
        if (!data?.content) {
            return [];
        }

        if (typeof data?.content === 'string') {
            // try to parse as an array, if not return empty array
            try {
                const jsonSafeString = data.content.replace(/'/g, '"');
                if (Array.isArray(JSON.parse(jsonSafeString))) {
                    return JSON.parse(jsonSafeString);
                }
            } catch (e) {
                return [];
            }
        }

        return Array.isArray(data.content) ? data.content : [];
    }, [data?.content]);

    // const getOptionLabel = useCallback(() => {
    //     return (opt) => {
    //         if (!data.content) {
    //             return '';
    //         } else if (!data.content.length) {
    //             return '';
    //         }

    //         const firstOption = data.content[0];

    //         if (typeof firstOption === 'object') {
    //             const keys = Object.keys(firstOption);
    //             if (!keys.length) {
    //                 return '';
    //             } else {
    //                 return firstOption[keys[0]];
    //             }
    //         } else if (typeof firstOption === 'string') {
    //             return firstOption;
    //         }

    //         // Default fallback if the type is not recognized
    //         return '';
    //     };
    // }, [data.content]);

    const getOptionLabel = useCallback(
        (option) => {
            if (typeof option === 'object' && option !== null) {
                return JSON.stringify(option);
            } else if (typeof option === 'string') {
                return option;
            }

            return '';
        },
        [data.content],
    );

    return (
        <Autocomplete
            disableClearable
            options={content}
            value={data.value}
            getOptionLabel={getOptionLabel}
            disabled={data?.disabled || data?.loading}
            sx={{
                ...data.style,
            }}
            onChange={(_, value) => {
                setData('value', value);
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
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            )}
            {...attrs}
        />
    );
});
