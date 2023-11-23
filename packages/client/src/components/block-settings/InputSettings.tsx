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
} from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';

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

    /**
     //? Optional: A disabled prop to disable the input
     */
    disabled?: boolean;
}

const StyledLabel = styled(Typography)(({ theme }) => ({
    width: theme.spacing(7),
}));

export const InputSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        disabled,
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
            <Stack
                direction="row"
                alignItems={'center'}
                title={`Edit ${label}`}
            >
                <StyledLabel variant="body2" noWrap={true}>
                    {label}
                </StyledLabel>
                <Stack flex={'1'}>
                    <TextField
                        value={value}
                        onChange={(e) => {
                            // sync the data on change
                            onChange(e.target.value);
                        }}
                        placeholder={
                            data.hasOwnProperty('type') &&
                            data.type === 'date' &&
                            path === 'value'
                                ? 'YYYY-MM-DD'
                                : null
                        }
                        size="small"
                        variant="outlined"
                        fullWidth={true}
                        autoComplete="off"
                        disabled={disabled}
                    />
                </Stack>
            </Stack>
        );
    },
);

export const InputValuesSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
    }: InputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);

        // track the value
        const [value, setValue] = useState([]);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return [];
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return [];
                } else if (typeof v === 'string') {
                    return v.split(',');
                }

                return v as string[];
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string[]) => {
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
            <Stack
                direction="row"
                alignItems={'center'}
                title={`Edit ${label}`}
            >
                <StyledLabel variant="body2" noWrap={true}>
                    {label}
                </StyledLabel>
                <Stack flex={'1'}>
                    <TextField
                        value={value.join(',')}
                        onChange={(e) => {
                            // sync the data on change
                            onChange(e.target.value.split(','));
                        }}
                        placeholder="Comma-separated list"
                        size="small"
                        variant="outlined"
                        fullWidth={true}
                        autoComplete="off"
                    />
                </Stack>
            </Stack>
        );
    },
);

export const InputFromValuesSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
    }: InputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);

        // track the value
        const [value, setValue] = useState(null);

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
            <Stack
                direction="row"
                alignItems={'center'}
                title={`Edit ${label}`}
            >
                <StyledLabel variant="body2" noWrap={true}>
                    {label}
                </StyledLabel>
                <Stack flex={'1'}>
                    <Autocomplete
                        options={data.options as string[]}
                        value={value}
                        onChange={(_, newValue: string) => {
                            // sync the data on change
                            onChange(newValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                size="small"
                                variant="outlined"
                                fullWidth={true}
                            />
                        )}
                    />
                </Stack>
            </Stack>
        );
    },
);

export const InputTypeSettings = observer(
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
            <Stack
                direction="row"
                alignItems={'center'}
                title={`Edit ${label}`}
            >
                <StyledLabel variant="body2" noWrap={true}>
                    {label}
                </StyledLabel>
                <Stack flex={'1'}>
                    <Select
                        size="small"
                        value={value}
                        onChange={(e) => {
                            // sync the data on change
                            onChange(e.target.value);
                        }}
                    >
                        <MenuItem value={'text'}>Text</MenuItem>
                        <MenuItem value={'number'}>Number</MenuItem>
                        <MenuItem value={'date'}>Date</MenuItem>
                    </Select>
                </Stack>
            </Stack>
        );
    },
);
