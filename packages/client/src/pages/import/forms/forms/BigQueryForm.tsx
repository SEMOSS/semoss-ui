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

export const BigQueryForm: ImportFormComponent = () => {
    const { control, reset } = useForm();

    React.useEffect(() => {
        reset({
            HOST_NAME: 'https://www.googleapis.com/bigquery/v2',
            PORT: '443',
            OAUTH_TYPE: '0',
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
                label="Hostname"
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
                name="PROJECT"
                label="Project"
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
                name="OAUTH_TYPE"
                label="OAuth Type"
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
                name="OAUTH_SERVICE_ACCOUNT"
                label="OAuth Service Account"
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
                name="OAUTH_PRIVATE_ACCOUNT_KEY"
                label="OAuth Private Account Key Path"
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
                name="ADDITIONAL_PARAMETERS"
                label="Enter Additional Parameters"
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
                label="Enter Custom JDBC Url"
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
        </Form>
    );
};

BigQueryForm.name2 = 'BigQuery';

BigQueryForm.logo = 'path_to_logo';
