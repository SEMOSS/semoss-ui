import { useEffect, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock, usePixel } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { Autocomplete, TextField } from '@mui/material';

//? UI Builder Queries
//? =================
//* MyEngines(engineTypes=["MODEL", "VECTOR"])
//? =================
//* Find the engine id as the value as:
//! (database_id || app_id)
//* VectorDatabaseQuery(engine=["{{SelectBlock.value}}"], command=["{{TextFieldBlock.value}}"], limit=[1])
//? =================
//* Update MarkdownBlock.markdown with {{"queryResult[0].content"}}
//? =================

//* Define the structure of data fetched from the pixel
export interface EngineData {
    database_type: string;
    app_name: string;
    app_type: string;
    app_id: string;
    app_sub_type: string;
}

export interface SelectBlockDef extends BlockDef<'select'> {
    widget: 'select';
    data: {
        style: CSSProperties;
        label: string;
        options: { label: string; value: string }[];
        value: string;
    };
}

export const SelectBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<SelectBlockDef>(id);

    //* Fetch engines data using the pixel
    const { data: enginesData, status: enginesStatus } = usePixel<EngineData[]>(
        `MyEngines(engineTypes=["MODEL", "VECTOR"]);`,
    );

    //* Effect to handle the fetched data
    useEffect(() => {
        if (enginesStatus === 'SUCCESS' && Array.isArray(enginesData)) {
            // TODO Make the value the app_id for proper querying later
            const options = enginesData.map((engine) => ({
                label: engine.app_name,
                value: engine.app_id,
            }));
            setData('options', options);

            //* Set the default value for the first option
            if (options.length > 0) {
                setData('value', options[0].value);
            }
        } else if (enginesStatus === 'ERROR') {
            console.error('Error fetching engines data');
        }
    }, [enginesData, enginesStatus, setData]);

    const handleChange = (_, newValue) => {
        setData('value', newValue?.value || '');
    };

    const isOptionEqualToValue = (option, value) =>
        option.value === value.value;

    //* Get selected option based on current value
    const selectedOption =
        data.options.find((option) => option.value === data.value) || null;

    return (
        <Autocomplete
            disableClearable
            options={data.options.map((option) => ({ ...option }))}
            value={selectedOption}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={isOptionEqualToValue}
            onChange={handleChange}
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
