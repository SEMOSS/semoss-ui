import { useState } from 'react';
import {
    Autocomplete,
    Button,
    TextField,
    TextArea,
    Modal,
    FileDropzone,
    LinearProgress,
} from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';
import { useRootStore } from '@/hooks';

type AddAppForm = {
    APP_NAME: string;
    APP_DESCRIPTION: string;
    TAGS: string[];
    PROJECT_UPLOAD: File;
};

interface AddAppProps {
    /** Callback that is triggered onClose */
    onClose: (appId?: string) => void;
}

export const AddAppNew = (props: AddAppProps) => {
    const { onClose } = props;

    const { monolithStore, configStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);

    const { handleSubmit, control } = useForm<AddAppForm>({
        defaultValues: {
            APP_NAME: '',
            APP_DESCRIPTION: '',
            TAGS: [],
            PROJECT_UPLOAD: null,
        },
    });

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

            // close it
            onClose(appId);
        } catch (e) {
            console.error(e);
        } finally {
            // turn of loading
            setIsLoading(false);
        }
    });
    return <div>AddAppNew</div>;
};
