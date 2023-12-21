import { useEffect, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock, usePixel } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { Autocomplete, TextField } from '@mui/material';

export interface EngineData {
    database_type: string;
    database_id: string;
    app_name: string;
    app_type: string;
    app_id: string;
    app_sub_type: string;
}

export interface VectorsBlockDef extends BlockDef<'vectors'> {
    widget: 'vectors';
    data: {
        style: CSSProperties;
        label: string;
        options: { label: string; value: string; database?: string }[];
        value: string;
    };
}

export const VectorsBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<VectorsBlockDef>(id);

    const { data: enginesData, status: enginesStatus } = usePixel<EngineData[]>(
        `MyEngines(engineTypes=["VECTOR"]);`,
    );

    useEffect(() => {
        if (enginesStatus === 'SUCCESS' && Array.isArray(enginesData)) {
            const options = enginesData.map((engine) => ({
                label: engine.app_name,
                value: engine.app_id,
                database: engine.database_id,
            }));
            setData('options', options);

            if (!options.some((option) => option.database === data.value)) {
                setData('value', options.length > 0 ? options[0].database : '');
            }
        } else if (enginesStatus === 'ERROR') {
            console.error('Error fetching engines data');
        }
    }, [enginesData, enginesStatus, setData, data.value]);

    const handleChange = (_, newValue) => {
        setData('value', newValue?.database || '');
    };

    const isOptionEqualToValue = (option, value) =>
        option.database === value?.database;

    const selectedOption =
        data.options.find((option) => option.database === data.value) || null;

    return (
        <Autocomplete
            disableClearable
            options={data.options}
            value={selectedOption}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={handleChange}
            sx={{
                width: '100%',
                ...data.style,
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={data.label || 'Select Option'}
                    variant="outlined"
                />
            )}
            {...attrs}
        />
    );
});
