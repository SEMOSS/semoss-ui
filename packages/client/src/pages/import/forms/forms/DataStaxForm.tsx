import React from 'react';
import { useForm } from 'react-hook-form';
import { Field } from '../../../../components/form';
import { Form } from '@semoss/components';
import { ImportFormComponent } from './formTypes';

export const DataStaxForm: ImportFormComponent = () => {
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
            <Field
                name="HOST_NAME"
                label="Host Name"
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
                name="PORT"
                label="Port"
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
                name="GRAPH"
                label="Graph"
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
                name="USERNAME"
                label="Username"
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
                label="Password"
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
        </Form>
    );
};

DataStaxForm.name2 = 'DataStax';

DataStaxForm.logo = 'path_to_logo';
