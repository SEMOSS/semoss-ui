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
import { RadioGroup } from '@semoss/ui';

const StyledBox = styled(Box)(({ theme }) => ({
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    width: '100%',
    padding: `${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(
        2,
    )} ${theme.spacing(2)}`,
    marginBottom: theme.spacing(4),
}));

const StyledSelectionContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(4),
    alignSelf: 'stretch',
}));

const StyledSelection = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flex: '1 0 0',
    alignSelf: 'stretch',
}));
const StyledDropzoneContainer = styled(StyledSelection)(({ theme }) => ({
    height: theme.spacing(37.5),
}));

const StyledOrContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    alignSelf: 'stretch',
}));

const StyledOr = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '54px',
    padding: '12px 16px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '64px',
    border: '2px solid rgba(134, 188, 37, 0.50)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
}));

const StyledFrameworkContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    width: '100%',
}));

const StyledFrameworkCard = styled(Card)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    height: '10rem',
    width: '23%',
    paddingBottom: '0px',
    flexDirection: 'column',
    gap: theme.spacing(1),
    flex: '1 0 0',
}));

const StyledRadioCardTop = styled('div')(({ theme }) => ({
    gap: '10px',
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: theme.spacing(1),
}));

const StyledRadioCardMiddle = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',
}));

const StyledRadioCardBottom = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: `0px ${theme.spacing(2)}`,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
}));

const StyledMetavalsForm = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '8px',
}));

const StyledFlexend = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
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
    // Import
    PROJECT_UPLOAD?: File;
    GIT_URL?: '';
    // Framework
    FRAMEWORK?: 'REACT' | 'ANGULARJS' | 'HTML/JS' | 'VUE';
    // Metavals
    APP_NAME: string;
    APP_DESCRIPTION: string;
    TAGS: string[];
};

const frameworks = ['REACT', 'ANGULARJS', 'HTML/JS', 'VUE'];

export const ImportAppForm = (props: CreateAppProps) => {
    const { data, onCreate } = props;
    const { monolithStore, configStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);

    const APP_TYPE = data.type;

    const { handleSubmit, setValue, control } = useForm<AddAppForm>({
        defaultValues: {
            // Import
            PROJECT_UPLOAD: null,
            GIT_URL: null,
            // Framework
            FRAMEWORK: null,
            // Metavals
            APP_NAME: '',
            APP_DESCRIPTION: '',
            TAGS: [],
        },
    });

    /**
     * Import App from zip or git
     * @param data
     * @returns
     */
    const importApp = async (data) => {
        try {
            let appId;
            if (data.GIT_URL) {
                appId = await uploadFromZip(data);
            } else {
                appId = await uploadFromZip(data);
            }

            return appId;
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            // turn of loading
            setIsLoading(false);
        }
    };

    const uploadFromGit = async (data) => {
        const pixel = `CreateAppFromGit(meta=[])`;

        // create the project
        const response = await monolithStore.runQuery(pixel);
    };

    /**
     * @desc Uploads App From Zip
     * @param data
     * @returns
     */
    const uploadFromZip = async (data) => {
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

        if (APP_TYPE === 'UI_BUILDER' || APP_TYPE === 'PROMPT_BUILDER') {
            // Hit Reactor to add property in smss file for APP_TYPE = 'ui-builder' | 'prompt-builder'
            const pixel = `CreateBuilderApp(type=[${APP_TYPE}]);`;

            onCreate('dummy id: 17833789124');
        } else if (APP_TYPE === 'TEMPLATE_APP') {
            let pixel = `CreateAppFromTemplate(meta=["${formVals}"])`;

            // If TEMPLATE_ID
            if (data.options) {
                pixel += `, template=[${data.options}]`;
            }

            pixel += ')';

            onCreate('dummy id: 09312849');
        } else if (APP_TYPE === 'FRAMEWORK_APP') {
            const pixel = `CreateAppWithFramework(meta=["${formVals}"], framework=[${formVals.FRAMEWORK}])`;

            onCreate('dummy id: 173781387');
        } else if (APP_TYPE === 'IMPORT_APP') {
            const id = await importApp(formVals);

            if (id) {
                onCreate(id);
            }
        }
    });

    return (
        <form onSubmit={createApp}>
            <StyledBox>
                {APP_TYPE === 'IMPORT_APP' ? (
                    <StyledSelectionContainer>
                        <StyledDropzoneContainer>
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
                                            extensions={['zip']}
                                            value={field.value}
                                            disabled={isLoading}
                                            onChange={(newValues) => {
                                                // Remove Git Url
                                                setValue('GIT_URL', '');

                                                field.onChange(newValues);
                                            }}
                                        />
                                    );
                                }}
                            />
                        </StyledDropzoneContainer>
                        <StyledOrContainer>
                            <StyledOr>
                                <Typography variant={'caption'}>OR</Typography>
                            </StyledOr>
                        </StyledOrContainer>
                        <StyledSelection>
                            <Typography variant="h6">Connect to Git</Typography>
                            <Typography variant="body1">
                                To import your app from a GitHub repository,
                                copy and paste the HTTPS link below:
                            </Typography>
                            <Controller
                                name={'GIT_URL'}
                                control={control}
                                rules={{}}
                                render={({ field }) => {
                                    return (
                                        <StyledTextField
                                            disabled
                                            value={field.value}
                                            placeholder={
                                                'github.com/cfg-ai-portal'
                                            }
                                            onChange={(newValues) => {
                                                // Remove File Upload
                                                setValue(
                                                    'PROJECT_UPLOAD',
                                                    null,
                                                );

                                                field.onChange(newValues);
                                            }}
                                        />
                                    );
                                }}
                            />
                        </StyledSelection>
                    </StyledSelectionContainer>
                ) : null}

                {APP_TYPE === 'FRAMEWORK_APP' ? (
                    <div>
                        <Typography variant="h6">Select Framework</Typography>
                        <Controller
                            name={'FRAMEWORK'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                    <RadioGroup
                                        row
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
                                        }}
                                    >
                                        <StyledFrameworkContainer>
                                            {frameworks.map((f, i) => {
                                                return (
                                                    <StyledFrameworkCard
                                                        key={i}
                                                    >
                                                        <StyledRadioCardTop>
                                                            <RadioGroup.Item
                                                                label=""
                                                                value={f}
                                                            ></RadioGroup.Item>
                                                        </StyledRadioCardTop>
                                                        <StyledRadioCardMiddle></StyledRadioCardMiddle>
                                                        <StyledRadioCardBottom>
                                                            <Typography
                                                                variant={'h6'}
                                                            >
                                                                {f}
                                                            </Typography>
                                                        </StyledRadioCardBottom>
                                                    </StyledFrameworkCard>
                                                );
                                            })}
                                        </StyledFrameworkContainer>
                                    </RadioGroup>
                                );
                            }}
                        />
                    </div>
                ) : null}

                {APP_TYPE === 'TEMPLATE_APP' ? (
                    <div>
                        <Typography variant="h6">Selected Template</Typography>
                        <Card sx={{ width: '10rem', height: '10rem' }}>
                            {data.options ? data.options : 'blank template'}
                        </Card>
                    </div>
                ) : null}

                {/* These are the required metavals for every app */}
                <StyledMetavalsForm>
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
                </StyledMetavalsForm>
            </StyledBox>
            <StyledFlexend>
                <Button variant="contained" type="submit">
                    Create App
                </Button>
            </StyledFlexend>
        </form>
    );
};
