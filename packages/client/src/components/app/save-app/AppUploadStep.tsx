import { FileDropzone } from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import { ADD_APP_FORM_FIELD_UPLOAD } from './save-app.constants';
import { Stack, Select } from '@semoss/ui';
import { Dispatch, SetStateAction, useState } from 'react';
import { AddAppFormStep } from './AddAppModal';
import { valueArray } from 'vega-lite/build/src/channeldef';



export const AppUploadStep = (props: {
    control: Control<any, any>;
    fileFormSteps: AddAppFormStep[];
}) => {
    const { control, fileFormSteps } = props;

    return (
        <Stack direction="column">
            <Controller
                name={ADD_APP_FORM_FIELD_UPLOAD}
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                    return (
                        <FileDropzone
                            multiple={false}
                            value={field.value}
                            onChange={(newValues) => {
                                field.onChange(newValues);
                            }}
                            // commented due to .smss-app files
                            // extensions={['.zip']}
                        />
                    );
                }}
            />

            {/* <Controller
                name={ADD_APP_FORM_FIELD_APP_TYPE}
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                    return isZip ? (
                        <></>
                    ) : (
                        <Select
                            label="App Type"
                            value={field.value}
                            defaultValue={'Assets Copy'}
                            onChange={(value) => {
                                field.onChange(value);
                            }}
                        >
                            {['CODE', 'BLOCKS'].map((option, idx) => (
                                <Select.Item key={idx} value={option}>
                                    {option}
                                </Select.Item>
                            ))}
                        </Select>
                    );
                }}
            /> */}
        </Stack>
    );
};
