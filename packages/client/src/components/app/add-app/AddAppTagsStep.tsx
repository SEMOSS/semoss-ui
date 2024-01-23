import { Autocomplete } from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import { ADD_APP_FORM_FIELD_TAGS } from './add-app.constants';

export const AddAppTagsStep = (props: { control: Control<any, any> }) => {
    return (
        <Controller
            name={ADD_APP_FORM_FIELD_TAGS}
            control={props.control}
            rules={{}}
            render={({ field }) => {
                return (
                    <Autocomplete<string, true, false, true>
                        freeSolo={true}
                        multiple={true}
                        label={'Tags'}
                        options={[]}
                        value={(field.value as string[]) || []}
                        onChange={(event, newValue) => {
                            field.onChange(newValue);
                        }}
                    />
                );
            }}
        />
    );
};
