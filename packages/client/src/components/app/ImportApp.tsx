import React, { useState } from 'react';
import { Page } from '@/components/ui';
import {
    Autocomplete,
    Button,
    Box,
    Card,
    FileDropzone,
    Grid,
    Stack,
    TextArea,
    TextField,
    Typography,
    styled,
} from '@semoss/ui';

import { Controller, useForm } from 'react-hook-form';
import { useRootStore } from '@/hooks';

const StyledBox = styled(Box)(({ theme }) => ({
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    width: '100%',
    padding: '16px 16px 16px 16px',
    marginBottom: '32px',
}));

const StyledSelectionContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const StyledSelection = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '45%',
    height: '280px',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
}));

interface CreateAppProps {
    /**
     * once app is created, send back to parent for next step in process
     */
    onCreate: (appId: string) => void;

    /**
     * Data associated with the type of app that is getting created
     */
    data?: {
        type: string;
        options?: string;
        // | 'Blank Template'
        // | 'Build App'
        // | 'Template App'
        // | 'Import App'
        // | 'Prompt Builder'
        // | 'UI Builder';
    };
}

type AddAppForm = {
    APP_NAME: string;
    APP_DESCRIPTION: string;
    TAGS: string[];
    PROJECT_UPLOAD?: File;
    FRAMEWORK?: 'REACT' | 'ANGULARJS' | 'HTML/JS' | 'VUE';
};

const frameworks = ['REACT', 'ANGULARJS', 'HTML/JS', 'VUE'];

export const ImportApp = (props: CreateAppProps) => {
    const { data, onCreate } = props;
    const { monolithStore, configStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);

    const APP_TYPE = data.type;

    const { handleSubmit, control } = useForm<AddAppForm>({
        defaultValues: {
            APP_NAME: '',
            APP_DESCRIPTION: '',
            TAGS: [],
            PROJECT_UPLOAD: null,
            FRAMEWORK: null,
        },
    });

    /**
     * Upload App from zip
     * @param data
     * @returns
     */
    const uploadFromZip = async (data) => {
        try {
            const path = 'version/assets/';

            // create the project
            const response = await monolithStore.runQuery(
                `META | projectVar = CreateProject("${
                    data.APP_NAME
                }"); SetProjectMetadata(project=[projectVar], meta=[${JSON.stringify(
                    {
                        description: data.APP_DESCRIPTION,
                        tag: data.TAGS,
                    },
                )}])`,
            );

            const output = response.pixelReturn[0].output;

            // get the app id
            const appId = output.project_id;

            // upload the file
            const upload = await monolithStore.uploadFile(
                [data.PROJECT_UPLOAD],
                configStore.store.insightID,
                appId,
                path,
            );

            // upnzip the file in the new project
            await monolithStore.runQuery(
                `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${appId}"])`,
            );

            // Load the insight classes
            await monolithStore.runQuery(`ReloadInsightClasses('${appId}');`);

            // set the project portal
            await monolithStore.setProjectPortal(false, appId, true, 'public');

            // Publish the project the insight classes
            await monolithStore.runQuery(
                `PublishProject('${appId}', release=true);`,
            );

            return appId;
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            // turn of loading
            setIsLoading(false);
        }
    };

    /**
     * Method that is called to create the app
     * 1. Hit the reactor that is needed based on type of app
     *
     * 1a. What needs to happen on BE is the saving of App type -> 'template' or 'ui-builder'
     * - This will need to be saved in smss file for app so we know which type of editor view to open in App Editor Page
     */
    const createApp = handleSubmit(async (formVals: AddAppForm) => {
        // turn on loading
        setIsLoading(true);

        if (APP_TYPE === 'UI Builder' || APP_TYPE === 'Prompt Builder') {
            const pixel = `CreateBuilderApp(type=[${APP_TYPE}])`;

            // Hit Reactor to add property in smss file for APP_TYPE = 'ui-builder' | 'prompt-builder'
        } else if (APP_TYPE === 'Blank Template') {
            const pixel = `CreateBlankApp(meta=["${formVals}"])`;

            // Creates an empty project
        } else if (APP_TYPE === 'Build App') {
            const pixel = `CreateAppWithFramework(meta=["${formVals}"], framework=[${formVals.FRAMEWORK}])`;

            // I need a reactor:
            // 1. Meta-Data (Name, desc)
            // 2. As well as framework
        } else if (APP_TYPE === 'Template App') {
            const pixel = `CreateAppFromTemplate(meta=["${formVals}"], template=[${data.options}])`;

            // I need a reactor:
            // 1. Meta-Data (Name, desc)
            // 2. Selected Template App Id
        } else if (APP_TYPE === 'Import App') {
            const id = await uploadFromZip(formVals);

            if (id) {
                onCreate(id);
            }
        }
    });

    return (
        <form onSubmit={createApp}>
            <StyledBox>
                {APP_TYPE === 'Import App' ? (
                    <StyledSelectionContainer>
                        <StyledSelection>
                            <Typography variant="h6">Upload ZIP</Typography>
                            <Controller
                                name={'PROJECT_UPLOAD'}
                                control={control}
                                rules={{}}
                                render={({ field }) => {
                                    console.log(field.value);
                                    return (
                                        <FileDropzone
                                            multiple={false}
                                            value={field.value}
                                            disabled={isLoading}
                                            onChange={(newValues) => {
                                                field.onChange(newValues);
                                            }}
                                        />
                                    );
                                }}
                            />
                        </StyledSelection>
                        <div>
                            <Typography variant={'caption'}>OR</Typography>
                        </div>
                        <StyledSelection>
                            <Typography variant="h6">Connect to Git</Typography>
                            <Typography variant="body1">
                                To import your app from a GitHub repository,
                                copy and paste the HTTPS link below:
                            </Typography>
                            <TextField />
                        </StyledSelection>
                    </StyledSelectionContainer>
                ) : null}

                {APP_TYPE === 'Build App' ? (
                    <div>
                        <Typography variant="h6">Select Framework</Typography>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                flexDirection: 'row',
                                width: '100%',
                            }}
                        >
                            {frameworks.map((f, i) => {
                                return (
                                    <div style={{ width: '20%' }} key={f + i}>
                                        <Card
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '10rem',
                                            }}
                                        >
                                            {f}
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {APP_TYPE === 'Template App' ? (
                    <div>
                        <Typography variant="h6">Selected Template</Typography>
                        <Card sx={{ width: '10rem', height: '10rem' }}>
                            {data.options}
                        </Card>
                    </div>
                ) : null}

                {/* This is constant for every type of app  */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        marginTop: '8px',
                    }}
                >
                    <Typography variant="h6">Details</Typography>
                    <Controller
                        name={'APP_NAME'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => {
                            return (
                                <TextField
                                    required
                                    label="Name"
                                    value={field.value ? field.value : ''}
                                    disabled={isLoading}
                                    onChange={(value) => field.onChange(value)}
                                ></TextField>
                            );
                        }}
                    />
                    <Controller
                        name={'APP_DESCRIPTION'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => {
                            return (
                                <TextArea
                                    required
                                    label="Description"
                                    value={field.value ? field.value : ''}
                                    disabled={isLoading}
                                    onChange={(value) => field.onChange(value)}
                                    rows={3}
                                ></TextArea>
                            );
                        }}
                    />

                    <Controller
                        name={'TAGS'}
                        control={control}
                        rules={{}}
                        render={({ field }) => {
                            return (
                                <Autocomplete<string, true, false, true>
                                    freeSolo={true}
                                    multiple={true}
                                    label={'Tags'}
                                    options={[]}
                                    value={(field.value as string[]) || []}
                                    disabled={isLoading}
                                    onChange={(event, newValue) => {
                                        field.onChange(newValue);
                                    }}
                                />
                            );
                        }}
                    />
                </div>
            </StyledBox>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" type="submit">
                    Create App
                </Button>
            </div>
        </form>
    );
};
