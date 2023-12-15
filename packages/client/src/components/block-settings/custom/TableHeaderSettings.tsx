import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import {
    Button,
    IconButton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { Add, ArrowDownward, ArrowUpward, Delete } from '@mui/icons-material';

interface TableHeaderSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const TableHeaderSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
    }: TableHeaderSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [headers, setHeaders] = useState<
            Array<{ display: string; value: string }>
        >([{ display: '', value: '' }]);

        const [useCustomHeaders, setUseCustomHeaders] =
            useState<boolean>(false);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return [{ display: '', value: '' }];
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return [{ display: '', value: '' }];
                } else if (Array.isArray(v) && v.length) {
                    return v;
                }

                return [{ display: '', value: '' }];
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setHeaders(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChangeCustomHeader = (
            currentHeaders: Array<{ display: string; value: string }>,
            headerIndex: number,
            display: string,
            value: string,
        ) => {
            // set the value
            let newHeaders = [...currentHeaders];
            newHeaders[headerIndex] = {
                display: display,
                value: value,
            };
            setHeaders(newHeaders);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    if (display && value) {
                        // set the value
                        setData(
                            path,
                            newHeaders as PathValue<D['data'], typeof path>,
                        );
                    }
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const onRemoveCustomHeader = (index: number) => {
            // set the value
            let newHeaders = [
                ...headers.slice(0, index),
                ...headers.slice(index + 1),
            ];
            setHeaders(newHeaders);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        path,
                        newHeaders as PathValue<D['data'], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const onSetAutoHeaderType = () => {
            // set the value
            setHeaders([{ display: '', value: '' }]);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(path, [] as PathValue<D['data'], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <>
                <BaseSettingSection label="Columns">
                    <ToggleButtonGroup
                        value={useCustomHeaders}
                        exclusive
                        size="small"
                        fullWidth
                    >
                        <ToggleButton
                            value={true}
                            color={useCustomHeaders ? 'primary' : undefined}
                            onClick={() => setUseCustomHeaders(true)}
                        >
                            Custom
                        </ToggleButton>
                        <ToggleButton
                            value={false}
                            color={!useCustomHeaders ? 'primary' : undefined}
                            onClick={() => {
                                setUseCustomHeaders(false);
                                onSetAutoHeaderType();
                            }}
                        >
                            Auto
                        </ToggleButton>
                    </ToggleButtonGroup>
                </BaseSettingSection>
                {useCustomHeaders ? (
                    <Stack gap={1}>
                        {Array.from(
                            headers,
                            (header: { display: string; value: string }, i) => {
                                return (
                                    <Stack direction="row" gap={1} key={i}>
                                        <TextField
                                            fullWidth
                                            value={header.display}
                                            onChange={(e) => {
                                                // sync the data on change
                                                onChangeCustomHeader(
                                                    headers,
                                                    i,
                                                    e.target.value,
                                                    header.value,
                                                );
                                            }}
                                            placeholder="Display"
                                            size="small"
                                            variant="outlined"
                                            autoComplete="off"
                                        />
                                        <TextField
                                            fullWidth
                                            value={header.value}
                                            onChange={(e) => {
                                                // sync the data on change
                                                onChangeCustomHeader(
                                                    headers,
                                                    i,
                                                    header.display,
                                                    e.target.value,
                                                );
                                            }}
                                            placeholder="Value"
                                            size="small"
                                            variant="outlined"
                                            autoComplete="off"
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                onRemoveCustomHeader(i)
                                            }
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Stack>
                                );
                            },
                        )}
                        <Stack
                            alignItems="center"
                            justifyContent="center"
                            flex="1"
                            direction="row"
                        >
                            <Button
                                size="small"
                                onClick={() =>
                                    setHeaders([
                                        ...headers,
                                        { display: '', value: '' },
                                    ])
                                }
                                startIcon={<Add />}
                            >
                                Add Column
                            </Button>
                        </Stack>
                    </Stack>
                ) : (
                    <></>
                )}
            </>
        );
    },
);
