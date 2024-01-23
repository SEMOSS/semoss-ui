import React, { useMemo, useState, createElement } from 'react';
import {
    Button,
    Modal,
    Typography,
    styled,
    Stack,
    Breadcrumbs,
    Chip,
    IconButton,
} from '@semoss/ui';
import { Control, Controller, useForm } from 'react-hook-form';
import { useRootStore } from '@/hooks';
import {
    OpenInBrowser,
    Edit,
    LocalOffer,
    Visibility,
    KeyboardArrowRight,
    Close,
} from '@mui/icons-material';
import {
    ADD_APP_FORM_FIELD_DESCRIPTION,
    ADD_APP_FORM_FIELD_IS_GLOBAL,
    ADD_APP_FORM_FIELD_NAME,
    ADD_APP_FORM_FIELD_TAGS,
    ADD_APP_FORM_FIELD_UPLOAD,
} from './add-app.constants';
import { AddAppUploadStep } from './AddAppUploadStep';
import { AddAppDetailsStep } from './AddAppDetailsStep';
import { AddAppTagsStep } from './AddAppTagsStep';
import { AddAppAccessStep } from './AddAppAccessStep';

const StyledRow = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
}));

const StyledStepChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'isStepSelected',
})<{ isStepSelected: boolean }>(({ theme, isStepSelected }) => ({
    '.MuiSvgIcon-root': {
        color: isStepSelected
            ? theme.palette.primary.main
            : theme.palette.grey[400],
        paddingLeft: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.25),
    },
    '.MuiChip-label': {
        color: isStepSelected
            ? theme.palette.primary.main
            : theme.palette.grey[400],
    },
}));

type AddAppForm = {
    [ADD_APP_FORM_FIELD_NAME]: string;
    [ADD_APP_FORM_FIELD_DESCRIPTION]: string;
    [ADD_APP_FORM_FIELD_TAGS]: string[];
    [ADD_APP_FORM_FIELD_UPLOAD]: File;
    [ADD_APP_FORM_FIELD_IS_GLOBAL]: boolean;
};

type AddAppFormStep = {
    name: string;
    icon: React.ReactElement;
    title: string;
    component: React.FunctionComponent<{
        control: Control<any, any>;
        disabled: boolean;
    }>;
    requiredFields: string[];
};

const AddAppFormSteps: AddAppFormStep[] = [
    {
        name: 'Upload',
        icon: <OpenInBrowser />,
        title: 'Upload a zip file',
        component: AddAppUploadStep,
        requiredFields: [ADD_APP_FORM_FIELD_UPLOAD],
    },
    {
        name: 'Details',
        icon: <Edit />,
        title: 'Details',
        component: AddAppDetailsStep,
        requiredFields: [
            ADD_APP_FORM_FIELD_NAME,
            ADD_APP_FORM_FIELD_DESCRIPTION,
        ],
    },
    {
        name: 'Tags',
        icon: <LocalOffer />,
        title: 'Tags',
        component: AddAppTagsStep,
        requiredFields: [ADD_APP_FORM_FIELD_TAGS],
    },
    {
        name: 'Access',
        icon: <Visibility />,
        title: 'Access',
        component: AddAppAccessStep,
        requiredFields: [ADD_APP_FORM_FIELD_IS_GLOBAL],
    },
];

interface AddAppProps {
    /** Track if the model is open */
    open: boolean;

    /** Callback that is triggered onClose */
    onClose: (appId?: string) => void;
}

export const AddApp = (props: AddAppProps) => {
    const { open, onClose } = props;

    const { monolithStore, configStore } = useRootStore();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

    const { getValues, handleSubmit, watch, control } = useForm<AddAppForm>({
        defaultValues: {
            [ADD_APP_FORM_FIELD_NAME]: '',
            [ADD_APP_FORM_FIELD_DESCRIPTION]: '',
            [ADD_APP_FORM_FIELD_TAGS]: [],
            [ADD_APP_FORM_FIELD_UPLOAD]: null,
            [ADD_APP_FORM_FIELD_IS_GLOBAL]: false,
        },
    });

    const watchAll = watch();

    const isStepComplete = useMemo(() => {
        return (
            AddAppFormSteps[currentStepIndex].requiredFields as any[]
        ).every((field) => {
            return !!getValues(field);
        });
    }, [watchAll]);

    const isStepSelected = (index: number): boolean => {
        return currentStepIndex === index;
    };

    const handlePreviousStep = () => {
        if (currentStepIndex === 0) {
            onClose();
        } else {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    const previousStepLabel = currentStepIndex === 0 ? 'Cancel' : 'Back';

    const handleNextStep = () => {
        if (currentStepIndex === AddAppFormSteps.length - 1) {
            return;
        } else {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    };

    const nextStepLabel =
        currentStepIndex === AddAppFormSteps.length - 1 ? 'Upload' : 'Next';

    /**
     * Method that is called to create the app
     */
    const createApp = handleSubmit(async (data: AddAppForm) => {
        // turn on loading
        setIsLoading(true);

        try {
            const path = 'version/assets/';

            // create the project
            const response = await monolithStore.runQuery(
                `META | projectVar = CreateProject(project=["${
                    data[ADD_APP_FORM_FIELD_NAME]
                }"], portal=[true], global=[${
                    data[ADD_APP_FORM_FIELD_IS_GLOBAL]
                }]); SetProjectMetadata(project=[projectVar], meta=[${JSON.stringify(
                    {
                        description: data[ADD_APP_FORM_FIELD_DESCRIPTION],
                        tag: data[ADD_APP_FORM_FIELD_TAGS],
                    },
                )}])`,
            );

            const output = response.pixelReturn[0].output;

            // get the app id
            const appId = output.project_id;

            // upload the file
            const upload = await monolithStore.uploadFile(
                [data[ADD_APP_FORM_FIELD_UPLOAD]],
                configStore.store.insightID,
                appId,
                path,
            );

            // upnzip the file in the new project
            await monolithStore.runQuery(
                `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${appId}"]); ReloadInsightClasses('${appId}'); PublishProject('${appId}', release=true);`,
            );

            // Load the insight classes
            // await monolithStore.runQuery(`ReloadInsightClasses('${appId}');`);

            // Publish the project the insight classes
            // await monolithStore.runQuery(
            //     `PublishProject('${appId}', release=true);`,
            // );

            // close it
            onClose(appId);
        } catch (e) {
            console.error(e);
        } finally {
            // turn of loading
            setIsLoading(false);
        }
    });

    return (
        <Modal open={open} fullWidth>
            <Modal.Title>
                <Stack>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <span>Upload app from my computer</span>
                        <IconButton
                            aria-label="close"
                            onClick={() => onClose()}
                            disabled={isLoading}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                    <Breadcrumbs
                        separator={<KeyboardArrowRight color="disabled" />}
                    >
                        {Array.from(AddAppFormSteps, (step, i) => {
                            return (
                                <StyledStepChip
                                    key={i}
                                    isStepSelected={isStepSelected(i)}
                                    variant="outlined"
                                    size="small"
                                    color={
                                        isStepSelected(i)
                                            ? 'primary'
                                            : 'default'
                                    }
                                    label={step.name}
                                    avatar={step.icon}
                                />
                            );
                        })}
                    </Breadcrumbs>
                </Stack>
            </Modal.Title>
            <form onSubmit={createApp}>
                <Modal.Content>
                    <Stack spacing={2}>
                        <Typography variant="subtitle2">
                            {AddAppFormSteps[currentStepIndex].title}
                        </Typography>
                        {createElement(
                            AddAppFormSteps[currentStepIndex].component,
                            {
                                control: control,
                                disabled: isLoading,
                            },
                        )}
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Stack
                        flex={1}
                        direction="row"
                        justifyContent="end"
                        alignItems="center"
                        spacing={1}
                        padding={2}
                    >
                        <Button
                            type="button"
                            disabled={isLoading}
                            variant="text"
                            onClick={handlePreviousStep}
                        >
                            {previousStepLabel}
                        </Button>
                        <Button
                            type={
                                currentStepIndex === AddAppFormSteps.length - 1
                                    ? 'submit'
                                    : 'button'
                            }
                            variant="contained"
                            disabled={isLoading || !isStepComplete}
                            loading={isLoading}
                            onClick={handleNextStep}
                        >
                            {nextStepLabel}
                        </Button>
                    </Stack>
                </Modal.Actions>
            </form>
        </Modal>
    );
};
