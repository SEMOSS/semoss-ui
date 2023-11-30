import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Stack, Typography, ButtonGroup, IconButton } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';

/**
 * Used when buttons are thematically be grouped together and point to the same
 * underlying style path, ex text align
 */

interface ButtonGroupSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label for setting
     */
    label: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    /**
     * Button options
     */
    options: Array<{
        value: string;
        icon: any;
        title: string;
        isDefault: boolean;
    }>;
}

export const ButtonGroupSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
        options,
    }: ButtonGroupSettingsProps<D>) => {
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
                alignItems="center"
                justifyContent="space-between"
            >
                <Typography variant="body2">{label}</Typography>
                <Stack
                    direction="row"
                    flex={'1'}
                    justifyContent="end"
                    spacing={2}
                >
                    <ButtonGroup>
                        {Array.from(options, (option, i) => {
                            return (
                                <IconButton
                                    key={i}
                                    color={
                                        value == option.value ||
                                        (option.isDefault ? !value : false)
                                            ? 'primary'
                                            : undefined
                                    }
                                    size="small"
                                    onClick={() => onChange(option.value)}
                                    title={option.title}
                                >
                                    <option.icon />
                                </IconButton>
                            );
                        })}
                    </ButtonGroup>
                </Stack>
            </Stack>
        );
    },
);
