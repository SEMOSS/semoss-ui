import { BaseSettingSection } from '@/components/block-settings/BaseSettingSection';
import { useBlocks, useBlockSettings } from '@/hooks';
import { Autocomplete, TextField } from '@mui/material';
import { styled } from '@semoss/ui';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect, useMemo } from 'react';
import { getValueByPath } from '@/utility';

const GroupHeader = styled('div')(({ theme }) => ({
    position: 'sticky',
    top: '-8px',
    padding: '4px 10px',
    backgroundColor: theme.palette.background.default,
}));

const GroupItems = styled('ul')(({ theme }) => ({
    padding: 0,
}));

interface LLMCellSelectProps {
    // Id of the block
    id: string;
}

export const LLMCellSelect = observer(({ id }: LLMCellSelectProps) => {
    const { data, setData } = useBlockSettings(id);
    const { state } = useBlocks();
    const [llmCells, setLlmCells] = useState([]);
    const [value, setValue] = useState('');
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    // Get the value of the input
    const computedValue = useMemo(() => {
        return computed(() => {
            if (!data) {
                return '';
            }

            const v = getValueByPath(data, 'cellId');
            if (typeof v === 'undefined') {
                return '';
            } else if (typeof v === 'string') {
                return v;
            }

            return JSON.stringify(v);
        });
    }, [data.cellId]).get();

    // Update the value whenever the computed one changes
    useEffect(() => {
        setValue(computedValue);
    }, [computedValue]);

    // Filter cells that are not an LLM Cell
    useEffect(() => {
        let options = [];
        Object.keys(state.queries).forEach((name) => {
            const query = state.queries[name];
            const filteredCells = Object.values(query.cells).filter(
                (cell) => cell.widget === 'llm',
            );
            const modelledCells = filteredCells.map((cell) => {
                return {
                    queryId: query.id,
                    cellId: cell.id,
                };
            });
            options = [...options, ...modelledCells];
        });
        setLlmCells(options);
    }, [state.queries]);

    const onChange = (val) => {
        setValue(val.cellId);

        // clear out the old timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        timeoutRef.current = setTimeout(() => {
            try {
                setData('queryId', val.queryId);
                setData('cellId', val.cellId);
            } catch (e) {
                console.log(e);
            }
        }, 300);
    };

    return (
        <BaseSettingSection label="LLM Cell">
            <Autocomplete
                fullWidth
                disableClearable
                size="small"
                value={value}
                options={llmCells}
                getOptionLabel={(cell) => cell || ''}
                isOptionEqualToValue={(option, val) => {
                    return option.cellId === val;
                }}
                groupBy={(cell) => cell.queryId}
                onChange={(_, newValue) => onChange(newValue)}
                renderInput={(params) => (
                    <TextField {...params} placeholder="Cell" />
                )}
                renderGroup={(params) => (
                    <li key={params.key}>
                        <GroupHeader>{params.group}</GroupHeader>
                        <GroupItems>{params.children}</GroupItems>
                    </li>
                )}
            />
        </BaseSettingSection>
    );
});
