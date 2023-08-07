import React from 'react';
import { useForm } from 'react-hook-form';
import { Field } from '../../../../components/form';
import { Form } from '@semoss/components';
import { ImportFormComponent } from './formTypes';

export const SemossForm: ImportFormComponent = () => {
    const { control, reset } = useForm();

    React.useEffect(() => {
        reset({
            PROTOCOL: 'https',
            PORT: '443',
            ENDPOINT: 'Monolith',
        });
    }, []);

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
                name="PROJECT_ID"
                label="Project ID"
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
                name="INSIGHT_ID"
                label="Insight ID"
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
                name="ENDPOINT"
                label="Endpoint"
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
                name="PROTOCOL"
                label="Protocol"
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
                name="SUB_URL"
                label="Sub URL"
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
            <Field
                name="ADDITIONAL PARAMETERS"
                label="Enter Additional Paramaters"
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
                name="JDBC_URL"
                label="Enter Custom JSBC Url"
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
            ADVANCED SETTINGS
            <Field
                name="FETCH_SIZE"
                label="Fetch Size"
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
                name="CONNECTION_TIMEOUT"
                label="Connection Query Timeout"
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
                name="CONNECTION_POOLING"
                label="Use Connection Pooling"
                control={control}
                rules={{
                    required: false,
                }}
                options={{
                    component: 'checkbox',
                }}
                description=""
                layout="vertical"
            />
            <Field
                name="POOL_MIN_SIZE"
                label="Pool Minimum Size"
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
                name="POOL_MAX_SIZE"
                label="Pool Maximum Size"
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

SemossForm.name2 = 'Semoss';

SemossForm.logo = 'path_to_logo';
