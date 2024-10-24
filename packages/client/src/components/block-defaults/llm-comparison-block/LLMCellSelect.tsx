import { BaseSettingSection } from '@/components/block-settings/BaseSettingSection';
import { useBlocks, useBlockSettings } from '@/hooks';
import { Autocomplete, TextField } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useRef, useState, useEffect } from 'react';

interface LLMCellSelectProps {
    // Id of the block
    id: string;
}

export const LLMCellSelect = observer(({ id }: LLMCellSelectProps) => {
    const { data, setData } = useBlockSettings(id);
    const { state } = useBlocks();
    const [llmCells, setLlmCells] = useState([]);
    const [value, setValue] = useState(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    // update the input value when the variableId is changed
    useEffect(() => {
        if (typeof data.variableId === 'string') {
            setValue(data.variableId);
        } else {
            setValue(null);
        }
    }, [data.variableId]);

    // Build input options by filtering variables to only be LLM cells
    useEffect(() => {
        const cellOptions = Object.keys(state.variables).filter((key) => {
            const isCell = state.variables[key].type === 'cell';
            if (isCell) {
                const query = state.getQuery(state.variables[key].to);
                const cell = query.cells[state.variables[key].cellId];
                return cell?.widget === 'llm';
            } else {
                return false;
            }
        });
        setLlmCells(cellOptions);
    }, [state.variables]);

    const onChange = (val: string) => {
        // clear out the old timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        timeoutRef.current = setTimeout(() => {
            try {
                setData('variableId', val);
            } catch (e) {
                console.log(e);
            }
        }, 300);
    };

    return (
        <BaseSettingSection label="Variable">
            <Autocomplete
                fullWidth
                disableClearable
                size="small"
                value={value}
                options={llmCells}
                getOptionLabel={(cell) => cell || ''}
                isOptionEqualToValue={(option, value) => option === value}
                onChange={(_, newValue) => onChange(newValue)}
                renderInput={(params) => (
                    <TextField {...params} placeholder="Variable" />
                )}
            />
            <div></div>
        </BaseSettingSection>
    );
});
