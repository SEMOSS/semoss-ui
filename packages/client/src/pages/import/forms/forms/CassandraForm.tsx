import React from 'react';
import { useForm } from 'react-hook-form';
import { Field } from '../../../../components/form';
import { Form } from '@semoss/components';

type ImportFormComponent = React.FunctionComponent<{
    name: string;
}> & {
    name2: string;

    logo: string;
};

export const CassandraForm: ImportFormComponent = () => {
    const { control, reset } = useForm();

    React.useEffect(() => {
        reset({
            PORT: '9042',
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
                name="SCHEMA"
                label="Schema"
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

CassandraForm.name2 = 'Cassandra';

CassandraForm.logo = 'path_to_logo';
