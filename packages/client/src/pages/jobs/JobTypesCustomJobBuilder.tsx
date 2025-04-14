import {
    createFilterOptions,
    AutocompleteTwo,
    Stack,
    TextField,
} from '@semoss/ui';

import { JobBuilder } from './job.types';

export const JobTypesCustomJobBuilder = (props: {
    builder: JobBuilder;
    setBuilderField: (field: string, value: string | string[]) => void;
}) => {
    const { builder, setBuilderField } = props;
    const filter = createFilterOptions<string>();
    return (
        <Stack spacing={2} width="100%">
            <TextField
                label="Pixel"
                size="small"
                value={builder.pixel}
                onChange={(e) => setBuilderField('pixel', e.target.value)}
                multiline
                rows={3}
            />
            <AutocompleteTwo
                value={(builder.tags as string[]) ?? []}
                fullWidth
                multiple
                size="small"
                onChange={(_, newValue) => {
                    setBuilderField('tags', newValue);
                }}
                filterOptions={(options, params) => {
                    const filtered = filter(options, params);

                    const { inputValue } = params;
                    const isExisting = options.some(
                        (option) => inputValue === option,
                    );
                    if (inputValue !== '' && !isExisting) {
                        filtered.push(inputValue);
                    }

                    return filtered;
                }}
                options={[]}
                renderOption={(props, option) => <li {...props}>{option}</li>}
                freeSolo
                renderInput={(params) => <TextField {...params} label="Tags" />}
            />
        </Stack>
    );
};
