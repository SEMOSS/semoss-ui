import React from 'react';
import { Control } from 'react-hook-form';
import { useRootStore } from '@/hooks';
import {
    OpenInBrowser,
    Edit,
    LocalOffer,
    Visibility,
} from '@mui/icons-material';
import {
    ADD_APP_FORM_FIELD_DESCRIPTION,
    ADD_APP_FORM_FIELD_IS_GLOBAL,
    ADD_APP_FORM_FIELD_NAME,
    ADD_APP_FORM_FIELD_TAGS,
    ADD_APP_FORM_FIELD_UPLOAD,
} from './save-app.constants';
import { AppUploadStep } from './AppUploadStep';
import { AppDetailsStep } from './AppDetailsStep';
import { AppTagsStep } from './AppTagsStep';
import { AppAccessStep } from './AppAccessStep';
import { SaveAppModal } from './SaveAppModal';

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
        component: AppUploadStep,
        requiredFields: [ADD_APP_FORM_FIELD_UPLOAD],
    },
    {
        name: 'Details',
        icon: <Edit />,
        title: 'Details',
        component: AppDetailsStep,
        requiredFields: [
            ADD_APP_FORM_FIELD_NAME,
            ADD_APP_FORM_FIELD_DESCRIPTION,
        ],
    },
    {
        name: 'Tags',
        icon: <LocalOffer />,
        title: 'Tags',
        component: AppTagsStep,
        requiredFields: [],
    },
    {
        name: 'Access',
        icon: <Visibility />,
        title: 'Access',
        component: AppAccessStep,
        requiredFields: [],
    },
];

interface AddAppProps {
    /** Track if the model is open */
    open: boolean;

    /** Callback that is triggered on close */
    handleClose: (appId?: string) => void;
}

export const AddAppModal = (props: AddAppProps) => {
    const { open, handleClose } = props;

    const { monolithStore, configStore } = useRootStore();

    const defaultFormValues: AddAppForm = {
        [ADD_APP_FORM_FIELD_NAME]: '',
        [ADD_APP_FORM_FIELD_DESCRIPTION]: '',
        [ADD_APP_FORM_FIELD_TAGS]: [],
        [ADD_APP_FORM_FIELD_UPLOAD]: null,
        [ADD_APP_FORM_FIELD_IS_GLOBAL]: false,
    };

    /**
     * Method that is called to create the app
     */
    const createApp = async (data: AddAppForm) => {
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
        handleClose(appId);
    };

    return (
        <SaveAppModal
            open={open}
            handleClose={handleClose}
            title="Upload app from my computer"
            steps={AddAppFormSteps}
            defaultFormValues={defaultFormValues}
            handleFormSubmit={createApp}
            errorMessage="There was an error creating your app. Please check your zip file and try again."
        />
    );
};
