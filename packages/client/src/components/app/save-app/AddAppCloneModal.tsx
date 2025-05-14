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
            requiredFields: [ADD_APP_FORM_FIELD_NAME],
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
        [ADD_APP_FORM_FIELD_APP_TYPE]: 'CODE',
        [ADD_APP_FORM_FIELD_IS_GLOBAL]: false,
        [ADD_APP_FORM_FIELD_TYPE]: 'Assets Copy',
    };

    /**
     * Method that is called to clone the app
     */
    const cloneApp = async (data: AddAppForm) => {
        try {
            const cloneProjectResponse = await monolithStore.runQuery(
                `CreateAppFromTemplate(project=["${data[ADD_APP_FORM_FIELD_NAME]}"], projectTemplate=["${appId}"], global=["${data[ADD_APP_FORM_FIELD_IS_GLOBAL]}"]);`,
            );
            let output = undefined;
            let type = undefined;

            output = cloneProjectResponse.pixelReturn[0].output;
            type = cloneProjectResponse.pixelReturn[0].operationType[0];

            if (type.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message: output,
                });

                return;
            }
            // close it

            handleClose(output.project_id);
        } catch (error) {
            notification.add({
                color: 'error',
                message:
                    'There was an error cloning your app. Please check your template files and try again.',
            });
        }
    };

    return (
        <SaveAppModal
            open={open}
            handleClose={handleClose}
            title="Want to clone this app ?"
            steps={addAppFormSteps}
            defaultFormValues={defaultFormValues}
            handleFormSubmit={cloneApp}
            errorMessage="There was an error cloning your app. Please check your template files and try again."
        />
    );
};
