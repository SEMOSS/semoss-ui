import { TextArea, TextField } from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import {
    ADD_APP_FORM_FIELD_DESCRIPTION,
    ADD_APP_FORM_FIELD_NAME,
} from './save-app.constants';

export const AppDetailsStep = (props: { control: Control<any, any> }) => {
    return (
        <>
            <Controller
                name={ADD_APP_FORM_FIELD_NAME}
                control={props.control}
                rules={{ required: true }}
                render={({ field }) => {
                    return (
                        <TextField
                            label="Name"
                            variant="outlined"
                            value={field.value ? field.value : ''}
                            onChange={(value) => field.onChange(value)}
                        />
                    );
                }}
            />
            <Controller
                name={ADD_APP_FORM_FIELD_DESCRIPTION}
                control={props.control}
                rules={{ required: true }}
                render={({ field }) => {
                    return (
                        <TextArea
                            label="Description"
                            variant="outlined"
                            value={field.value ? field.value : ''}
                            onChange={(value) => field.onChange(value)}
                            rows={3}
                        />
                    );
                }}
            />
        </>
    );
};
