import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Autocomplete, Box, Typography, TextField, styled } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';

const StyledAutocomplete = styled(Autocomplete)(({ theme }) => ({
    width: '100%',
}));

const StyledBox = styled(Box)(({ theme }) => ({
    position: 'relative',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    position: 'absolute',
    opacity: 0.5,
    left: 14,
    top: 9,
}));

interface AutocompleteQuerySettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    /**
     * Settings label
     */
    label: string;
}

export const AutocompleteQuerySettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
    }: AutocompleteQuerySettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);
        const { state } = useBlocks();

        // track the value
        const [value, setValue] = useState('');

        const hint = useRef('');

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

        // available queries for autocomplete
        const queries = useMemo(() => {
            const queries = Object.keys(state.queries);
            return queries.map((q) => {
                return `{{${q}}}`;
            });
        }, [Object.keys(state.queries).length]);

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
            <BaseSettingSection label={label}>
                <StyledAutocomplete
                    open={false}
                    size={'small'}
                    inputValue={value}
                    onInputChange={(event, newInputValue, reason) => {
                        if (reason === 'input') {
                            onChange(newInputValue);

                            // Find a matching option or use the input value as the hint
                            const matchingOption = queries.find((option) =>
                                option
                                    .toLowerCase()
                                    .startsWith(newInputValue.toLowerCase()),
                            );

                            hint.current = matchingOption
                                ? matchingOption
                                : newInputValue;
                        }
                    }}
                    onBlur={() => {
                        hint.current = '';
                    }}
                    options={queries}
                    renderInput={(params) => (
                        <StyledBox>
                            <StyledTypography variant={'body1'}>
                                {hint.current}
                            </StyledTypography>
                            <TextField {...params} />
                        </StyledBox>
                    )}
                />
            </BaseSettingSection>
        );
    },
);
