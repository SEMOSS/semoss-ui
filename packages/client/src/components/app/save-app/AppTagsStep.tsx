import { Autocomplete, TextField } from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import { ADD_APP_FORM_FIELD_TAGS } from './save-app.constants';

export const AppTagsStep = (props: { control: Control<any, any> }) => {
    return (
        <Controller
            name={ADD_APP_FORM_FIELD_TAGS}
            control={props.control}
            rules={{}}
            render={({ field }) => {
                return (
                    <Autocomplete
                        value={(field.value as string[]) || []}
                        fullWidth
                        multiple
                        onChange={(_, newValue) => {
                            field.onChange(newValue);
                        }}
                        options={[]}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                placeholder='Press "Enter" to add tag'
                            />
                        )}
                    />
                );
            }}
        />
    );
};
