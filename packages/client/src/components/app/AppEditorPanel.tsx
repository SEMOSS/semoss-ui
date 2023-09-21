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

import { useApp, useRootStore } from '@/hooks';
import { SettingsContext } from '@/contexts';
import { SettingsTiles } from '@/components/settings';
import { AppSettings } from '@/components/app';
import { AppEditor } from '@/components/app';
import { MembersTable } from '@/components/settings/MembersTable';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
}));

const StyledTopLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    overflowX: 'hidden',
    background: theme.palette.background.paper,
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
}));

type EditAppForm = {
    PROJECT_UPLOAD: File;
};

export const AppEditorPanel = (props) => {
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const navigate = useNavigate();

    const { appId, editorView, refreshApp, setIsLoading, isLoading } = useApp();

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
        setIsLoading(true);

        try {
            const path = 'version/assets/';

            // upnzip the file in the new app
            await monolithStore.runQuery(
                `DeleteAsset(filePath=["${path}"], space=["${appId}"]);`,
            );

            // upload the file
            const upload = await monolithStore.uploadFile(
                [data.PROJECT_UPLOAD],
                configStore.store.insightID,
                appId,
                path,
            );

            // upnzip the file in the new app
            await monolithStore.runQuery(
                `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${appId}"]);`,
            );

            // Load the insight classes
            await monolithStore.runQuery(`ReloadInsightClasses('${appId}');`);

            // set the app portal
            await monolithStore.setProjectPortal(false, appId, true, 'public');

            // Publish the app the insight classes
            await monolithStore.runQuery(
                `PublishProject('${appId}', release=true);`,
            );

            // close it
            refreshApp();
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // turn of loading
            setIsLoading(false);
        }
    });

    return (
        <StyledContainer>
            {editorView === 'settings' && (
                <StyledTopLeft>
                    <StyledTopLeftContent>
                        <SettingsContext.Provider
                            value={{
                                adminMode: configStore.store.user.admin,
                            }}
                        >
                            <form
                                onSubmit={editApp}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                }}
                            >
                                <Stack
                                    direction="column"
                                    spacing={1}
                                    sx={{
                                        width: '100%',
                                    }}
                                >
                                    <Typography variant={'h5'}>
                                        Settings
                                    </Typography>
                                    <Typography variant={'h6'}>
                                        Access
                                    </Typography>
                                    <SettingsTiles
                                        type={'app'}
                                        id={appId}
                                        condensed={true}
                                        onDelete={() => {
                                            console.log(
                                                'navigate to app library',
                                            );
                                            navigate('/');
                                        }}
                                    />
                                    <Typography variant={'h6'}>
                                        Publish
                                    </Typography>
                                    <AppSettings id={appId} condensed={true} />
                                    <Typography variant="h6">
                                        Update Project
                                    </Typography>

                                    <Controller
                                        name={'PROJECT_UPLOAD'}
                                        control={control}
                                        rules={{}}
                                        render={({ field }) => {
                                            return (
                                                <FileDropzone
                                                    multiple={false}
                                                    value={field.value}
                                                    disabled={isLoading}
                                                    onChange={(newValues) => {
                                                        field.onChange(
                                                            newValues,
                                                        );
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    <Stack alignItems={'center'}>
                                        <Button
                                            type="submit"
                                            variant={'contained'}
                                            disabled={isLoading}
                                        >
                                            Update
                                        </Button>
                                    </Stack>
                                </Stack>
                            </form>
                        </SettingsContext.Provider>
                    </StyledTopLeftContent>
                </StyledTopLeft>
            )}
            {editorView === 'permissions' && (
                <StyledTopLeft>
                    <StyledTopLeftContent>
                        <SettingsContext.Provider
                            value={{
                                adminMode: configStore.store.user.admin,
                            }}
                        >
                            <Stack
                                direction="column"
                                spacing={1}
                                sx={{ width: '100%' }}
                            >
                                <Typography variant={'h5'}>
                                    Member Permissions
                                </Typography>
                                <Typography variant={'h6'}>Members</Typography>
                                <MembersTable
                                    type={'app'}
                                    id={appId}
                                    condensed={true}
                                />
                                {/* <Typography variant="h6">
                                                Pending Permissions
                                            </Typography> */}
                                {/* <PendingMembersTable
                                                type={'app'}
                                                id={appId}
                                            /> */}
                                {/* </div> */}
                            </Stack>
                        </SettingsContext.Provider>
                    </StyledTopLeftContent>
                </StyledTopLeft>
            )}
            {editorView === 'code-editor' && <AppEditor appId={appId} />}
        </StyledContainer>
    );
};