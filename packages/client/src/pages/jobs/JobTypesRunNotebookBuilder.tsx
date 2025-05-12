import {
    createFilterOptions,
    AutocompleteTwo,
    Stack,
    TextField,
    MenuItem,
} from '@semoss/ui';

import { JobBuilder } from './job.types';
import { useRootStore } from '@/hooks';
import { useEffect, useState } from 'react';

export const JobTypesRunNotebookBuilder = (props: {
    builder: JobBuilder;
    setBuilderField: (field: string, value: string | string[]) => void;
}) => {
    const { builder, setBuilderField } = props;
    const filter = createFilterOptions<string>();

    const {monolithStore } = useRootStore();

    const [userNotebooks, setUserNotebooks] = useState<string[]>([]);

    const getNotebooks = async () => {
        try {
            const response = await monolithStore.runQuery(
                `MyProjects(onlyPortal=true);`,
            );
            console.log(response);
            const notebooks = response.pixelReturn[0].output
                .filter((notebook: any) => notebook.project_type === 'BLOCKS')
                .map((notebook: any) => `${notebook.low_project_name}: ${notebook.project_name} (${notebook.project_id})`);
            setUserNotebooks(notebooks);
            console.log('User Notebooks:', notebooks);
        } catch (error) {
            console.error('Error fetching notebooks:', error);
        }
    };
    useEffect(() => {
        getNotebooks();
    }, []);
    return (

        <Stack spacing={2} width="100%">
            <TextField
                select
                label="Select Notebook"
                value={builder.pixel || builder.notebook}
                onChange={(e) => {
                    setBuilderField('notebook', e.target.value);
                    setBuilderField('pixel', e.target.value);
                }}
            >
                {userNotebooks.map((notebook) => (
                    <MenuItem key={notebook} value={notebook}>
                        {notebook}
                    </MenuItem>
                ))}
            </TextField>
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
