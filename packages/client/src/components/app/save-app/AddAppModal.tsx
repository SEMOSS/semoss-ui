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
import { AppAccessStep } from './AppAccessStep';
import { SaveAppModal } from './SaveAppModal';
import { useNotification } from '@semoss/ui';

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
    // {
    //     name: 'Details',
    //     icon: <Edit />,
    //     title: 'Details',
    //     component: AppDetailsStep,
    //     requiredFields: [
    //         ADD_APP_FORM_FIELD_NAME,
    //         ADD_APP_FORM_FIELD_DESCRIPTION,
    //     ],
    // },
    // {
    //     name: 'Tags',
    //     icon: <LocalOffer />,
    //     title: 'Tags',
    //     component: AppTagsStep,
    //     requiredFields: [],
    // },
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
    const notification = useNotification();

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
        // upload the file
        const upload = await monolithStore.uploadFile(
            [data[ADD_APP_FORM_FIELD_UPLOAD]],
            configStore.store.insightID,
        );

        const resp = await monolithStore.runQuery(
            `UploadProjectApp(filePath=["${upload[0].fileLocation}"], global=[${data[ADD_APP_FORM_FIELD_IS_GLOBAL]}]);`,
        );

        let output = undefined;
        let type = undefined;

        output = resp.pixelReturn[0].output;
        type = resp.pixelReturn[0].operationType[0];

        if (type.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });

            return;
        }
        // close it
        handleClose(output.project_id);
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
