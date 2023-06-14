import { StepConfig, StepComponent } from './step.types';
import {
    styled,
    Button,
    Input,
    Form,
    Textarea,
    Typeahead,
} from '@semoss/components';
import { useForm, Controller } from 'react-hook-form';
import { theme } from '@/theme';
import { usePixel } from '@/hooks';
export interface MetaModelStepConfig extends StepConfig {
    id: string;
    data: {
        databaseName: string;
        databaseDescription: string;
        tags: string[];
        metaModelType: string;
        delimiter: string;
        files: File[];
        responseFiles: {
            fileName: string;
            fileLocation: string;
        }[];
    };
}
type FormData = {
    databaseName: string;
    databaseDescription: string;
    tags: string[];
};

const StyledMetaModelStep = styled('div', {
        padding: theme.space['4'],
        width: '100%',
    }),
    FlexColumn = styled('div', {
        display: 'flex',
        flexDirection: 'column',
    }),
    _MetaModelStep: StepComponent<MetaModelStepConfig> = ({
        stepIdx,
        step,
        updateStep,
        navigateStep,
        steps,
        updateSteps,
    }) => {
        const myDatabases = usePixel('META | MyDatabases ( ) ;');
        let myDatabaseNames = [];
        if (myDatabases.status === 'SUCCESS') {
            myDatabaseNames = myDatabases.data.map(
                (database) => database.database_name,
            );
        }
        const { handleSubmit, control, watch } = useForm<FormData>({
            defaultValues: {
                databaseName:
                    step.data.databaseName ||
                    step.data.responseFiles[0].fileName.slice(
                        0,
                        step.data.responseFiles[0].fileName.lastIndexOf('.'),
                    ),
                databaseDescription: step.data.databaseDescription || '',
                tags: step.data.tags || [],
            },
        });

        const databaseName = watch('databaseName');
        const sameDatabaseName = myDatabaseNames.indexOf(databaseName) > -1;
        console.log(databaseName);

        const onSubmit = handleSubmit((data) => {
            const { databaseName, databaseDescription, tags }: FormData = data;
            const currentStep = {
                id: step.id,
                name: step.name,
                data: {
                    databaseName,
                    databaseDescription,
                    tags,
                    files: step.data.files,
                    metaModelType: step.data.metaModelType,
                    responseFiles: step.data.responseFiles,
                    delimiter: step.data.delimiter,
                },
            };

            if (step.data.metaModelType === 'As Flat Table') {
                const next = {
                    id: 'dataSelection',
                    data: {
                        databaseName,
                        databaseDescription,
                        tags,
                        files: step.data.files,
                        metaModelType: step.data.metaModelType,
                        responseFiles: step.data.responseFiles,
                        delimiter: step.data.delimiter,
                    },
                    name: `Define Data Selection`,
                };

                const updatedSteps = [...steps.slice(0, stepIdx), currentStep];
                updateStep(currentStep);
                updateSteps([...updatedSteps.slice(0, stepIdx + 1), next]);
                // // navigate to the next one
                navigateStep(stepIdx + 1);
            }
        });

        return (
            <StyledMetaModelStep>
                MetaModelStep
                <Form>
                    <FlexColumn>
                        <Controller
                            name="databaseName"
                            control={control}
                            rules={{
                                required: true,
                            }}
                            render={({ field }) => {
                                return (
                                    // use field component like delegation request
                                    <Form.Field
                                        label={
                                            <>
                                                Enter Database Name
                                                <span className="text-error-100">
                                                    *
                                                </span>
                                            </>
                                        }
                                        error={
                                            !field.value
                                                ? 'Database name is required'
                                                : sameDatabaseName
                                                ? 'Database name is not unique'
                                                : ''
                                        }
                                    >
                                        <Input
                                            placeholder="Enter Database Name"
                                            value={field.value}
                                            onChange={(value) => {
                                                field.onChange(value);
                                            }}
                                            inputProps={{
                                                maxLength: 50,
                                            }}
                                        />
                                    </Form.Field>
                                );
                            }}
                        />
                        <Controller
                            name="databaseDescription"
                            control={control}
                            rules={{
                                required: false,
                            }}
                            render={({ field }) => {
                                return (
                                    <Form.Field
                                        label={<>Enter Database Description:</>}
                                    >
                                        <Textarea
                                            placeholder={'Database Description'}
                                            value={field.value}
                                            onChange={(value) => {
                                                field.onChange(value);
                                            }}
                                        />
                                    </Form.Field>
                                );
                            }}
                        />
                        <Controller
                            name="tags"
                            control={control}
                            rules={{ required: false }}
                            render={({ field }) => {
                                return (
                                    <Form.Field label={'Enter Database Tags'}>
                                        <Typeahead
                                            multiple={true} // this should make it so you can set tags
                                            options={[]}
                                            value={field.value}
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                        />
                                    </Form.Field>
                                );
                            }}
                        />
                    </FlexColumn>
                </Form>{' '}
                <Button
                    onClick={() => {
                        // navigate to the next one
                        navigateStep(stepIdx - 1);
                    }}
                >
                    Back
                </Button>
                <Button
                    disabled={sameDatabaseName || !databaseName.length}
                    onClick={() => {
                        onSubmit();
                    }}
                >
                    Next
                </Button>
            </StyledMetaModelStep>
        );
    };
_MetaModelStep.config = {
    id: 'metamodel',
    data: {
        databaseName: '',
        databaseDescription: '',
        tags: [],
        metaModelType: '',
        files: [],
        responseFiles: [],
        delimiter: '',
    },
};
export { _MetaModelStep as MetaModelStep };
