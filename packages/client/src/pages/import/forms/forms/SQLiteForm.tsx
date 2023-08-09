import React from 'react';
import { useForm } from 'react-hook-form';
import { Field } from '../../../../components/form';
import { Form } from '@semoss/components';
import { FileDropzone } from '@semoss/ui';
import { ImportFormComponent } from './formTypes';

const UploadData = () => {
    const [selectedValues, setSelectedValues] = React.useState(null);

    return (
        <FileDropzone
            value={selectedValues}
            onChange={(newValues) => {
                setSelectedValues(newValues);
            }}
        />
    );
};

export const SQLiteForm: ImportFormComponent = () => {
    const { control } = useForm();

    return (
        <Form>
            <Field
                name="DATABASE_NAME"
                label="Enter Database Name"
                control={control}
                rules={{
                    required: true,
                }}
                options={{
                    component: 'input',
                }}
                description=""
                layout="vertical"
            />
            <Field
                name="DATABASE_DESCRIPTION"
                label="Database Description"
                control={control}
                rules={{
                    required: false,
                }}
                options={{
                    component: 'input',
                }}
                description=""
                layout="vertical"
            />
            <Field
                name="DATABASE_TAGS"
                label="Enter Database Tags"
                control={control}
                rules={{
                    required: false,
                }}
                options={{
                    component: 'input',
                }}
                description=""
                layout="vertical"
            />
            <UploadData />
            <Field
                name="SCHEMA"
                label="Enter Schema"
                control={control}
                rules={{
                    required: false,
                }}
                options={{
                    component: 'input',
                }}
                description=""
                layout="vertical"
            />
            <Field
                name="USERNAME"
                label="Enter Username"
                control={control}
                rules={{
                    required: false,
                }}
                options={{
                    component: 'input',
                }}
                description=""
                layout="vertical"
            />
            <Field
                name="PASSWORD"
                label="Enter Password"
                control={control}
                rules={{
                    required: false,
                    password: true,
                }}
                options={{
                    component: 'input',
                }}
                description=""
                layout="vertical"
            />
            <Field
                name="PARAMETERS"
                label="Enter Additional Parameters"
                control={control}
                rules={{
                    required: false,
                    password: true,
                }}
                options={{
                    component: 'input',
                }}
                description=""
                layout="vertical"
            />
        </Form>
    );
};

SQLiteForm.name2 = 'SQLite';

SQLiteForm.logo = 'path_to_logo';