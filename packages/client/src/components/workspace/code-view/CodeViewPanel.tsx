import React from 'react';
import {
    Button,
    IconButton,
    FileDropzone,
    useNotification,
    Typography,
    Stack,
    styled,
} from '@semoss/ui';
import {
    Code,
    CodeOff,
    Download,
    Settings,
    PersonAdd,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useWorkspace, useRootStore } from '@/hooks';
import { SettingsContext } from '@/contexts';
import { AppEditor } from '@/components/common';
import { MembersTable, SettingsTiles } from '@/components/settings';

import { AppSettings } from '../../app/AppSettings';
import { Card } from '@mui/material';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    // height: 'calc(100% - 42px)',
}));

const StyledTopLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    overflowX: 'hidden',
    backgroundColor: theme.palette.secondary.light,
    justifyContent: 'space-between',
    paddingLeft: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    paddingRight: theme.spacing(2),

    // Take in prop that will resize width of left portion
    height: '100%',
    width: '100%',
}));

const StyledTopLeftContent = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
}));

type EditAppForm = {
    PROJECT_UPLOAD: File;
};

interface CodeViewPanelProps {
    editorView: 'settings' | 'permissions' | 'code-editor';
    width: string;
}

export const CodeViewPanel = (props: CodeViewPanelProps) => {
    const { editorView, width } = props;

    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const navigate = useNavigate();

    const { workspace } = useWorkspace();

    const { handleSubmit, control } = useForm<EditAppForm>({
        defaultValues: {
            PROJECT_UPLOAD: null,
        },
    });

    /**
     * Method that is called to create the app
     */
    const editApp = handleSubmit(async (data: EditAppForm) => {
        // turn on loading
        workspace.setLoading(true);

        try {
            const path = 'version/assets/';

            // upnzip the file in the new app
            await monolithStore.runQuery(
                `DeleteAsset(filePath=["${path}"], space=["${workspace.appId}"]);`,
            );

            // upload the file
            const upload = await monolithStore.uploadFile(
                [data.PROJECT_UPLOAD],
                configStore.store.insightID,
                workspace.appId,
                path,
            );

            // upnzip the file in the new app
            await monolithStore.runQuery(
                `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${
                    workspace.appId
                }"]);`,
            );

            // Load the insight classes
            await monolithStore.runQuery(
                `ReloadInsightClasses('${workspace.appId}');`,
            );

            // set the app portal
            await monolithStore.setProjectPortal(
                false,
                workspace.appId,
                true,
                'public',
            );

            // Publish the app the insight classes
            await monolithStore.runQuery(
                `PublishProject('${workspace.appId}', release=true);`,
            );

            // close it
            // refreshApp();
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // turn of loading
            workspace.setLoading(false);
        }
    });

    /**
     * TODO Reusability
     * but first see if this is the order of operations that is needed to refresh app with new changes
     */
    const reloadAndPublish = async () => {
        // turn on loading
        workspace.setLoading(true);

        try {
            // Load the insight classes
            await monolithStore.runQuery(
                `ReloadInsightClasses('${workspace.appId}');`,
            );

            // set the app portal
            await monolithStore.setProjectPortal(
                false,
                workspace.appId,
                true,
                'public',
            );

            // Publish the app the insight classes
            await monolithStore.runQuery(
                `PublishProject('${workspace.appId}', release=true);`,
            );

            // close it
            // refreshApp();
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // turn of loading
            workspace.setLoading(false);
        }
    };

    return (
        <StyledContainer>
            <AppEditor
                appId={workspace.appId}
                width={width}
                onSave={(success: boolean) => {
                    // Succesfully Saved Asset, refresh portal
                    if (success) {
                        reloadAndPublish();
                    }
                }}
            />
        </StyledContainer>
    );
};
