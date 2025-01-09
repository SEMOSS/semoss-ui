import React, { Dispatch, SetStateAction, useState } from 'react';
import { useRootStore } from '@/hooks';
import { Edit, LocalOffer, Visibility } from '@mui/icons-material';
import {
    ADD_APP_FORM_FIELD_APP_TYPE,
    ADD_APP_FORM_FIELD_DESCRIPTION,
    ADD_APP_FORM_FIELD_IS_GLOBAL,
    ADD_APP_FORM_FIELD_NAME,
    ADD_APP_FORM_FIELD_TAGS,
    ADD_APP_FORM_FIELD_UPLOAD,
    ADD_APP_FORM_FIELD_TYPE,
} from './save-app.constants';
import { AppAccessStep } from './AppAccessStep';
import { SaveAppModal } from './SaveAppModal';
import { AppDetailsStep } from './AppDetailsStep';
import { useNotification } from '@semoss/ui';
import { AppTagsStep } from './AppTagsStep';
import { Control } from 'react-hook-form';

type AddAppForm = {
    [ADD_APP_FORM_FIELD_NAME]: string;
    [ADD_APP_FORM_FIELD_APP_TYPE]: string;
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
        appZipFormSteps?: AddAppFormStep[];
        projectZipFormSteps?: AddAppFormStep[];
    }>;
    requiredFields: string[];
};

interface AddAppProps {
    /** Track if the model is open */
    open: boolean;
    appId: string;
    /** Callback that is triggered on close */
    handleClose: (appId?: string) => void;
}

export const AddAppCloneModal = (props: AddAppProps) => {
    const projectZipFormSteps = [
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

    const [addAppFormSteps] = useState<AddAppFormStep[]>(projectZipFormSteps);

    const { open, handleClose, appId } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const defaultFormValues: AddAppForm = {
        [ADD_APP_FORM_FIELD_NAME]: '',
        [ADD_APP_FORM_FIELD_DESCRIPTION]: '',
        [ADD_APP_FORM_FIELD_APP_TYPE]: 'CODE',
        [ADD_APP_FORM_FIELD_TAGS]: [],
        [ADD_APP_FORM_FIELD_UPLOAD]: null,
        [ADD_APP_FORM_FIELD_IS_GLOBAL]: false,
        [ADD_APP_FORM_FIELD_TYPE]: 'Assets Copy',
    };

    /**
     * Method that is called to create the app
     */
    const createApp = async (data: AddAppForm) => {
        // upload the file

        const createProjectResponse = await monolithStore.runQuery(
            `CreateProject(project=["${data[ADD_APP_FORM_FIELD_NAME]}"], global=["${data[ADD_APP_FORM_FIELD_IS_GLOBAL]}"], portal=["true"])`,
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

        const clonePorjectResponse = await monolithStore.runQuery(
            `CloneProject(project=["${appId}"], space=["${createProjectOutput.project_id}"]);`,
        );
        output = undefined;
        type = undefined;

        output = clonePorjectResponse.pixelReturn[0].output;
        type = clonePorjectResponse.pixelReturn[0].operationType[0];

        if (type.indexOf('ERROR') > -1) {
            notification.add({
                color: 'error',
                message: output,
            });

            return;
        }
        // close it

        handleClose(createProjectOutput.project_id);
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
