import { FileDropzone } from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import {
    ADD_APP_FORM_FIELD_UPLOAD,
    ADD_APP_FORM_FIELD_TYPE,
} from './save-app.constants';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Stack, Accordion, Select } from '@semoss/ui';
import { Dispatch, SetStateAction, useState } from 'react';
import { AddAppFormStep } from './AddAppModal';

export const AppUploadStep = (props: {
    control: Control<any, any>;
    setAddAppFormSteps: Dispatch<SetStateAction<AddAppFormStep[]>>;
    defaultAddAppFormStep: AddAppFormStep[];
    assetAddAppFormStep: AddAppFormStep[];
}) => {
    const {
        control,
        setAddAppFormSteps,
        defaultAddAppFormStep,
        assetAddAppFormStep,
    } = props;

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
                            extensions={['.zip']}
                        />
                    );
                }}
            />
            <Controller
                name={ADD_APP_FORM_FIELD_TYPE}
                control={control}
                render={({ field }) => {
                    return (
                        <Select
                            label="Folder Type"
                            value={field.value}
                            defaultValue="App Zip"
                            onChange={(value) => {
                                field.onChange(value);
                                setAddAppFormSteps(
                                    value.target.value === 'App Zip'
                                        ? defaultAddAppFormStep
                                        : assetAddAppFormStep,
                                );
                            }}
                        >
                            {['App Zip', 'Project Zip'].map((option, idx) => (
                                <Select.Item key={idx} value={option}>
                                    {option}
                                </Select.Item>
                            ))}
                        </Select>
                    );
                }}
            />
        </Stack>
    );
};
