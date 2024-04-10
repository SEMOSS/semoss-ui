import { FileDropzone } from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import {
    ADD_APP_FORM_FIELD_UPLOAD,
    ADD_APP_FORM_FIELD_APP_TYPE,
    ADD_APP_FORM_FIELD_TYPE,
} from './save-app.constants';
import { Stack, Select } from '@semoss/ui';
import { Dispatch, SetStateAction } from 'react';
import { AddAppFormStep } from './AddAppModal';

const FOLDER_TYPE_OPTIONS = [
    {
        display: 'App Zip',
        value: 'App Zip',
        description:
            'Contains full semoss construct. .smss, and other specific folders',
    },
    {
        display: 'Assets Copy',
        value: 'Assets Copy',
        description: 'Contains project zipped as assets',
    },
];

export const AppUploadStep = (props: {
    control: Control<any, any>;
    setAddAppFormSteps: Dispatch<SetStateAction<AddAppFormStep[]>>;
    appZipFormSteps: AddAppFormStep[];
    projectZipFormSteps: AddAppFormStep[];
}) => {
    const {
        control,
        setAddAppFormSteps,
        appZipFormSteps,
        projectZipFormSteps,
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
                            defaultValue={'App Zip'}
                            onChange={(value) => {
                                field.onChange(value);
                                setAddAppFormSteps(
                                    value.target.value === 'App Zip'
                                        ? appZipFormSteps
                                        : projectZipFormSteps,
                                );
                            }}
                        >
                            {FOLDER_TYPE_OPTIONS.map((option, idx) => (
                                <Select.Item key={idx} value={option.value}>
                                    {option.display}
                                </Select.Item>
                            ))}
                        </Select>
                    );
                }}
            />
            <Controller
                name={ADD_APP_FORM_FIELD_APP_TYPE}
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                    return (
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
            />
        </Stack>
    );
};
