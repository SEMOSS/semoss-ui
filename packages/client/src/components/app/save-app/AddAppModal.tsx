import React, { Dispatch, SetStateAction, useState } from 'react';
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
    ADD_APP_FORM_FIELD_TYPE,
} from './save-app.constants';
import { AppUploadStep } from './AppUploadStep';
import { AppAccessStep } from './AppAccessStep';
import { SaveAppModal } from './SaveAppModal';
import { AppDetailsStep } from './AppDetailsStep';
import { useNotification } from '@semoss/ui';
import { AppTagsStep } from './AppTagsStep';

type AddAppForm = {
    [ADD_APP_FORM_FIELD_NAME]: string;
    [ADD_APP_FORM_FIELD_DESCRIPTION]: string;
    [ADD_APP_FORM_FIELD_TAGS]: string[];
    [ADD_APP_FORM_FIELD_UPLOAD]: File;
    [ADD_APP_FORM_FIELD_IS_GLOBAL]: boolean;
    [ADD_APP_FORM_FIELD_TYPE]: string;
};

export type AddAppFormStep = {
    name: string;
    icon: React.ReactElement;
    title: string;
    component: React.FunctionComponent<{
        control: Control<any, any>;
        disabled: boolean;
        setAddAppFormSteps?: Dispatch<SetStateAction<AddAppFormStep[]>>;
        defaultAddAppFormStep?: AddAppFormStep[];
        assetAddAppFormStep?: AddAppFormStep[];
    }>;
    requiredFields: string[];
};

interface AddAppProps {
    /** Track if the model is open */
    open: boolean;

    /** Callback that is triggered on close */
    handleClose: (appId?: string) => void;
}

export const AddAppModal = (props: AddAppProps) => {
    const addAppUploadStep = (props: { control: Control<any, any> }) => (
        <AppUploadStep
            control={props.control}
            setAddAppFormSteps={setAddAppFormSteps}
            defaultAddAppFormStep={defaultAddAppFormStep}
            assetAddAppFormStep={assetAddAppFormStep}
        />
    );

    const defaultAddAppFormStep = [
        {
            name: 'Upload',
            icon: <OpenInBrowser />,
            title: 'Upload a zip file',
            component: addAppUploadStep,
            requiredFields: [
                ADD_APP_FORM_FIELD_UPLOAD,
                ADD_APP_FORM_FIELD_TYPE,
            ],
        },

        {
            name: 'Access',
            icon: <Visibility />,
            title: 'Access',
            component: AppAccessStep,
            requiredFields: [],
        },
    ];

    const assetAddAppFormStep = [
        {
            name: 'Upload',
            icon: <OpenInBrowser />,
            title: 'Upload a zip file',
            component: addAppUploadStep,
            requiredFields: [
                ADD_APP_FORM_FIELD_UPLOAD,
                ADD_APP_FORM_FIELD_TYPE,
            ],
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

    const [addAppFormSteps, setAddAppFormSteps] = useState<AddAppFormStep[]>(
        defaultAddAppFormStep,
    );

    const { open, handleClose } = props;

    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    const defaultFormValues: AddAppForm = {
        [ADD_APP_FORM_FIELD_NAME]: '',
        [ADD_APP_FORM_FIELD_DESCRIPTION]: '',
        [ADD_APP_FORM_FIELD_TAGS]: [],
        [ADD_APP_FORM_FIELD_UPLOAD]: null,
        [ADD_APP_FORM_FIELD_IS_GLOBAL]: false,
        [ADD_APP_FORM_FIELD_TYPE]: 'App Zip',
    };

    /**
     * Method that is called to create the app
     */
    const createApp = async (data: AddAppForm) => {
        // upload the file

        if (data[ADD_APP_FORM_FIELD_TYPE] === 'App Zip') {
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
            handleClose(output.project_id);
        } else {
            const createProjectResponse = await monolithStore.runQuery(
                `CreateProject(project=["${data[ADD_APP_FORM_FIELD_NAME]}"], global=["${data[ADD_APP_FORM_FIELD_IS_GLOBAL]}"], projectType=["CODE"], portal=["true"])`,
            );

            let createProjectOutput = undefined;
            let type = undefined;

            createProjectOutput = createProjectResponse.pixelReturn[0].output;
            type = createProjectResponse.pixelReturn[0].operationType[0];

            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message: createProjectOutput,
                });

                return;
            }
            const setProjectMetadataResponse = await monolithStore.runQuery(
                `SetProjectMetadata(project=["${
                    createProjectOutput.project_id
                }"], meta=[${JSON.stringify({
                    tag: data['tags'],
                    description: data['description'],
                })}])`,
            );

            let output = undefined;
            type = undefined;

            output = setProjectMetadataResponse.pixelReturn[0].output;
            type = setProjectMetadataResponse.pixelReturn[0].operationType[0];

            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message: output,
                });

                return;
            }

            const deleteAssetResponse = await monolithStore.runQuery(
                `DeleteAsset(filePath=["version/assets/"], space=["${createProjectOutput.project_id}"]);`,
            );
            output = undefined;
            type = undefined;

            output = deleteAssetResponse.pixelReturn[0].output;
            type = deleteAssetResponse.pixelReturn[0].operationType[0];

            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message: output,
                });

                return;
            }

            const upload = await monolithStore.uploadFile(
                [data[ADD_APP_FORM_FIELD_UPLOAD]],
                configStore.store.insightID,
                createProjectOutput.project_id,
                'version',
            );

            const unzipFileResponse = await monolithStore.runQuery(
                `UnzipFile(filePath=["${upload[0].fileLocation}"], space=["${createProjectOutput.project_id}"]);`,
            );
            output = undefined;
            type = undefined;

            output = unzipFileResponse.pixelReturn[0].output;
            type = unzipFileResponse.pixelReturn[0].operationType[0];

            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message: output,
                });

                return;
            }
            // close it

            handleClose(createProjectOutput.project_id);
        }
    };

    return (
        <SaveAppModal
            open={open}
            handleClose={handleClose}
            title="Upload app from my computer"
            steps={addAppFormSteps}
            defaultFormValues={defaultFormValues}
            handleFormSubmit={createApp}
            errorMessage="There was an error creating your app. Please check your zip file and try again."
        />
    );
};
