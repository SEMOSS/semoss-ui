import { useForm } from 'react-hook-form';
import { Field } from '../../../components/form';
import { Form } from '@semoss/components';

export const CopyDatabaseForm = () => {
    const { control } = useForm();

    return (
        <Form>
            <Field
                name="DATABASE_NAME"
                label="Database Name"
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
                name="DATABASE_LOCATION"
                label="Database Location"
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
