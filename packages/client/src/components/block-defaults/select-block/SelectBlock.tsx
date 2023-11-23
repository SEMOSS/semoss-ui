import { useEffect, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock, usePixel } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';

import { Autocomplete } from '@mui/material';
import { TextField } from '@semoss/ui';

export interface SelectBlockDef extends BlockDef<'select'> {
    widget: 'select';
    data: {
        style: CSSProperties;
        type: string[];
        label: string;
        options: { label: string; value: string }[];
        value: string;
    };
}

/**
 * Calling this a "select" block because it's better semantically to explain what the block does
 * But using an autocomplete because it offers better UX when there are many options
 */
export const SelectBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<SelectBlockDef>(id);

    const { data: enginesData, status: enginesStatus } = usePixel<string[]>(
        `MyEngines( engineTypes=["MODEL", "VECTOR"]);`,
    );
    useEffect(() => {
        if (enginesStatus === 'SUCCESS' && Array.isArray(enginesData)) {
            const newOptions = enginesData.map((engine) => {
                return {
                    label: engine,
                    value: engine,
                };
            });
            setData('options', newOptions);

            /* if (newOptions.length > 0) {
                console.log('First Model:', newOptions[0].label);
                console.log('Model Type:', newOptions[0].label.app_type);
                console.log('Model Engine:', newOptions[0].label.app_name);
                if (newOptions.length > 1) {
                    console.log('First Vector:', newOptions[1].label);
                    console.log('Vector Type:', newOptions[1].label.app_type);
                    console.log(
                        'Vector Engine:',
                        newOptions[1].label.app_subtype,
                    );
                }
            } */
        }
    }, [enginesData, enginesStatus, setData]);

    // console.log('Users Models & Engines:', data);
    // console.log('Options JSON Object:', data.options);
    // console.log('Vector DB Labels:', data.options[1].label.app_type);
    // console.log('Vector DB Labels:', data.options[1].label.app_subtype);
    // console.log('Options - Model Type:', data.options[0].options.app_type);
    // console.log('Options - Model Engine:', data.options[0].options.app_name);
    // console.log('Options - Vector Type:', data.options[1].options.app_type);
    // console.log('Options - Vector Engine:', data.options[1].options.app_subtype,);

    const selectedOption =
        data.options.find((option) => option.value === data.value) || null;

    const modelType = data.options[0].label.app_type;
    const modelName = data.options[0].label.app_name;

    //  console.log(
    //      'Models Labels:',
    //      data.options[0],
    //      data.options[0].label.app_type,
    //      data.options[0].label.app_name,
    //  );

    return (
        <Autocomplete
            disableClearable
            options={modelType || []}
            value={selectedOption || null}
            isOptionEqualToValue={(option, value) =>
                option.value === value.value
            }
            onChange={(_, newValue) =>
                setData('value', newValue ? newValue.value : '')
            }
            renderInput={(params) => (
                <TextField {...params} label={modelName} variant="outlined" />
            )}
            {...attrs}
        />
    );
});
