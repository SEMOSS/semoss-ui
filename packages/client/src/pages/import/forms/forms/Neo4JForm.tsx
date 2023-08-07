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

export const Neo4JForm: ImportFormComponent = () => {
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
                name="PATH"
                label="Enter Path"
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
        </Form>
    );
};

Neo4JForm.name2 = 'Neo4J';

Neo4JForm.logo = 'path_to_logo';
