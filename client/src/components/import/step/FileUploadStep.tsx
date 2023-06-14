import {
    styled,
    Button,
    Input,
    Form,
    Select,
    Checkbox,
    FileDropzone,
} from '@semoss/components';
import { useState, useEffect } from 'react';
import { theme } from '@/theme';
import { useForm, Controller } from 'react-hook-form';
import { StepConfig, StepComponent } from './step.types';
import { useRootStore } from '@/hooks';

export interface FileUploadStepConfig extends StepConfig {
    id: string;
    data: {
        files: File[];
        extensions: string[];
        delimiter: string;
        databaseType: string;
        metaModelType: string;
        useCustomUri: boolean;
        customUri: string;
        tinkerType: string;
        propFiles: string[];
        type: string;
    };
}
type FormData = {
    files: File[];
    delimiter: string;
    databaseType: string;
    metaModelType: string;
    useCustomUri: boolean;
    customUri: string;
    tinkerType: string;
    propFiles: string[];
    type: string;
};
const StyledFileUploadStep = styled('div', {
        padding: theme.space['4'],
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        width: '100%',
    }),
    FlexColumn = styled('div', {
        display: 'flex',
        flexDirection: 'column',
    }),
    _FileUploadStep: StepComponent<FileUploadStepConfig> = ({
        stepIdx,
        step,
        updateStep,
        navigateStep,
        steps,
        updateSteps,
    }) => {
        const { setValue, handleSubmit, control, watch } = useForm<FormData>({
            defaultValues: {
                files: step.data.files ? step.data.files : [],
                delimiter: step.data.delimiter,
                databaseType: step.data.databaseType
                    ? step.data.databaseType
                    : step.data.type === 'CSV'
                    ? 'H2'
                    : '',
                metaModelType: step.data.metaModelType
                    ? step.data.metaModelType
                    : step.data.type === 'CSV'
                    ? 'As Flat Table'
                    : '',
                useCustomUri: step.data.useCustomUri || false,
                customUri:
                    step.data.customUri || 'http://semoss.org/ontologies',
                tinkerType: step.data.tinkerType ? step.data.tinkerType : 'TG',
                propFiles:
                    step.data.propFiles && step.data.propFiles.length
                        ? step.data.propFiles
                        : [],
            },
        });

        const { configStore, monolithStore } = useRootStore();
        const showCustomUri: boolean = watch('databaseType') === 'RDF';
        const enableCustomUri: boolean = watch('useCustomUri') === true;
        const showTinkerType: boolean = watch('databaseType') === 'Tinker';
        const showUploadPropFileComponent: boolean =
            watch('metaModelType') === 'From Prop File';
        const filesLength: number = watch('files').length;
        const propFilesLength: number = watch('propFiles').length;
        const [databaseOptions, setDatabaseOptions] = useState<string[]>([]);
        const [metamodelOptions, setMetamodelOptions] = useState<string[]>([]);

        const onSubmit = handleSubmit((data) => {
            console.log(data);

            let next;
            const {
                files,
                delimiter,
                databaseType,
                metaModelType,
                customUri,
                useCustomUri,
                tinkerType,
                propFiles,
            }: FormData = data;
            const fileUploadStepData = {
                files,
                delimiter,
                databaseType,
                metaModelType,
            };
            if (step.data.type === 'CSV') {
                if (showCustomUri) {
                    fileUploadStepData['customUri'] = customUri;
                }
                if (showTinkerType) {
                    fileUploadStepData['tinkerType'] = tinkerType;
                }
                if (showUploadPropFileComponent) {
                    fileUploadStepData['propFiles'] = propFiles;
                }

                // Type '{ files: any[]; type: string; delimiter: string; metaModelType: string; databaseType: string; }'
                // is missing the following properties from type
                // '{ files: File[]; extensions: string[]; delimiter: string; databaseType: string; metaModelType: string; useCustomUri: boolean; customUri: string; tinkerType: string; propFiles: string[]; type: string; }': extensions, useCustomUri, customUri, tinkerType, propFilests(2345)

                monolithStore
                    .uploadFile(files, configStore.store.insightID, null, null)
                    .then((responseFiles) => {
                        const currentStep = {
                            id: step.id,
                            name: step.name,
                            data: {
                                responseFiles,
                                files,
                                type: step.data.type,
                                extensions: step.data.extensions,
                                delimiter,
                                metaModelType,
                                databaseType,
                                customUri,
                                tinkerType,
                                propFiles,
                                useCustomUri,
                            },
                        };

                        next = {
                            id: 'metamodel',
                            data: {
                                databaseName: '',
                                databaseDescription: '',
                                tags: [],
                                metaModelType,
                                files,
                                responseFiles,
                                delimiter,
                            },
                            name: `Define Metamodel`,
                        };

                        const updatedSteps = [
                            ...steps.slice(0, stepIdx),
                            currentStep,
                        ];

                        updateStep(currentStep);
                        updateSteps([
                            ...updatedSteps.slice(0, stepIdx + 1),
                            next,
                        ]);

                        // // navigate to the next one
                        navigateStep(stepIdx + 1);
                    })
                    .catch((error) => {
                        throw Error(error);
                    });

                // if SuggestedMetaModel === 'As Flat Table'
                // show data selection component
            }
        });
        // default metaModelOptions
        useEffect(() => {
            let metaModelOptionsTemp: string[] = [],
                dataBaseOptionsTemp: string[] = [];
            if (step.data.type) {
                // for some reason typescript is complaining
                if (step.data.type === 'CSV' || step.data.type === 'TSV') {
                    dataBaseOptionsTemp = ['H2', 'RDF', 'Tinker', 'R'];
                    metaModelOptionsTemp = [
                        'As Flat Table',
                        'As Suggested Metamodel',
                        'From Sratch',
                        'From Prop File',
                    ];
                }
            }
            setDatabaseOptions(dataBaseOptionsTemp);
            setMetamodelOptions(metaModelOptionsTemp);
        }, []);

        return (
            <StyledFileUploadStep>
                <Form>
                    <FlexColumn>
                        <Controller
                            name="files"
                            control={control}
                            render={({ field }) => {
                                return (
                                    <Form.Field
                                        label={
                                            <>
                                                {`Upload ${step.data.type} file(s):`}
                                                <span className="text-error-100">
                                                    *
                                                </span>
                                            </>
                                        }
                                    >
                                        <FileDropzone
                                            multiple
                                            extensions={step.data.extensions}
                                            onChange={(value) => {
                                                field.onChange(value);
                                            }}
                                        />
                                    </Form.Field>
                                );
                            }}
                        />
                        <div>
                            Acceptable Extensions are :
                            {JSON.stringify(step.data.extensions)}
                        </div>
                        <Controller
                            name="delimiter"
                            control={control}
                            rules={{
                                required: true,
                            }}
                            render={({ field }) => {
                                return (
                                    // use field component like delegation request
                                    <Form.Field label={<>Delimiter:</>}>
                                        <Input
                                            value={field.value}
                                            onChange={(value) => {
                                                field.onChange(value);
                                                setValue('delimiter', value);
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
                            name="databaseType"
                            control={control}
                            render={({ field }) => {
                                return (
                                    <Form.Field
                                        label={
                                            <>
                                                Database Type
                                                <span className="text-error-100">
                                                    *
                                                </span>
                                            </>
                                        }
                                    >
                                        <Select
                                            value={field.value}
                                            options={databaseOptions}
                                            onChange={(value) => {
                                                field.onChange(value);
                                                if (
                                                    value === 'RDF' ||
                                                    value === 'Tinker'
                                                ) {
                                                    setMetamodelOptions([
                                                        'As Suggested Metamodel',
                                                        'From Sratch',
                                                        'From Prop File',
                                                    ]);
                                                    setValue(
                                                        'metaModelType',
                                                        'As Suggested Metamodel',
                                                    );
                                                } else if (value === 'R') {
                                                    setMetamodelOptions([
                                                        'As Flat Table',
                                                    ]);
                                                    setValue(
                                                        'metaModelType',
                                                        'As Flat Table',
                                                    );
                                                } else {
                                                    setMetamodelOptions([
                                                        'As Flat Table',
                                                        'As Suggested Metamodel',
                                                        'From Sratch',
                                                        'From Prop File',
                                                    ]);
                                                    setValue(
                                                        'metaModelType',
                                                        'As Flat Table',
                                                    );
                                                }
                                            }}
                                        />
                                    </Form.Field>
                                );
                            }}
                        />
                        <Controller
                            name="metaModelType"
                            control={control}
                            render={({ field }) => {
                                return (
                                    <Form.Field
                                        label={
                                            <>
                                                MetaModel Type
                                                <span className="text-error-100">
                                                    *
                                                </span>
                                            </>
                                        }
                                    >
                                        <Select
                                            value={field.value}
                                            options={metamodelOptions}
                                            onChange={(value) => {
                                                field.onChange(value);
                                            }}
                                        />
                                    </Form.Field>
                                );
                            }}
                        />
                        {showCustomUri ? (
                            <div>
                                <Controller
                                    name="useCustomUri"
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Form.Field label={<>Enter URI:</>}>
                                                <Checkbox
                                                    value={field.value}
                                                    onChange={(value) => {
                                                        field.onChange(value);
                                                    }}
                                                >
                                                    Use Custom URI:
                                                </Checkbox>
                                            </Form.Field>
                                        );
                                    }}
                                />
                                <Controller
                                    name="customUri"
                                    control={control}
                                    render={({ field }) => {
                                        return (
                                            <Form.Field
                                                label={<>Enter Custom URI:</>}
                                            >
                                                <Input
                                                    onChange={(value) => {
                                                        field.onChange(value);
                                                    }}
                                                    disabled={
                                                        enableCustomUri
                                                            ? false
                                                            : true
                                                    }
                                                    value={field.value}
                                                />
                                            </Form.Field>
                                        );
                                    }}
                                />
                            </div>
                        ) : null}
                        {showTinkerType ? (
                            <Controller
                                name="tinkerType"
                                control={control}
                                render={({ field }) => {
                                    return (
                                        <Form.Field
                                            label={
                                                <>
                                                    Tinker Type
                                                    <span className="text-error-100">
                                                        *
                                                    </span>
                                                </>
                                            }
                                        >
                                            <Select
                                                value={field.value}
                                                options={[
                                                    'TG',
                                                    'Neo4j',
                                                    'XML',
                                                    'JSON',
                                                ]}
                                                onChange={(value) => {
                                                    field.onChange(value);
                                                }}
                                            />
                                        </Form.Field>
                                    );
                                }}
                            />
                        ) : null}
                        {showUploadPropFileComponent ? (
                            <Controller
                                name="propFiles"
                                control={control}
                                render={({ field }) => {
                                    return (
                                        <Form.Field
                                            label={
                                                <>
                                                    Add Prop File(s):
                                                    <span className="text-error-100">
                                                        *
                                                    </span>
                                                </>
                                            }
                                        >
                                            <FileDropzone
                                                multiple
                                                extensions={['prop', 'json']}
                                                onChange={(value) => {
                                                    field.onChange(value);
                                                }}
                                            />
                                        </Form.Field>
                                    );
                                }}
                            />
                        ) : null}
                    </FlexColumn>
                </Form>
                <div>
                    <Button
                        onClick={() => {
                            // navigate to the next one
                            navigateStep(stepIdx - 1);
                        }}
                    >
                        Back
                    </Button>
                    <Button
                        disabled={
                            !filesLength ||
                            (showUploadPropFileComponent && !propFilesLength)
                        }
                        onClick={() => {
                            onSubmit();
                        }}
                    >
                        Next
                    </Button>
                </div>
            </StyledFileUploadStep>
        );
    };

_FileUploadStep.config = {
    id: 'file-upload',
    data: {
        files: [],
        extensions: [],
        delimiter: '',
        databaseType: '',
        metaModelType: '',
        customUri: '',
        tinkerType: '',
        useCustomUri: false,
        propFiles: [],
        type: '',
    },
};

export { _FileUploadStep as FileUploadStep };
