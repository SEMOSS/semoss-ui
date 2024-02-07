import { FileDropzone } from '@/component-library';
import { Control, Controller } from 'react-hook-form';
import { ADD_APP_FORM_FIELD_UPLOAD } from './save-app.constants';

export const AppUploadStep = (props: { control: Control<any, any> }) => {
    return (
        <Controller
            name={ADD_APP_FORM_FIELD_UPLOAD}
            control={props.control}
            rules={{ required: true }}
            render={({ field }) => {
                return (
                    <FileDropzone
                        multiple={false}
                        value={field.value}
                        onChange={(newValues) => {
                            field.onChange(newValues);
                        }}
                        extensions={['.zip']}
                    />
                );
            }}
        />
    );
};
