import React from 'react';
import {
    Button,
    IconButton,
    FileDropzone,
    useNotification,
    Typography,
    Stack,
    Paper,
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
import { AppEditor } from '@/components/common';
import { MembersTable, SettingsTiles } from '@/components/settings';

import { AppSettings } from './AppSettings';

import { useEffect, useMemo, useState } from 'react';
import { ContentCopyOutlined } from '@mui/icons-material';
import {
    Outlet,
    Link,
    useLocation,
    matchPath,
    useParams,
} from 'react-router-dom';
import {
    // styled,
    // Typography,
    Breadcrumbs,
    // Stack,
    ToggleButton,
    Tooltip,
    // Paper,
    // useNotification,
    // IconButton,
} from '@semoss/ui';

// import { useRootStore } from '@/hooks';
// import { SettingsContext } from '@/contexts';
import { Page } from '@/components/ui/';
// import { SETTINGS_ROUTES } from './settings.constants';
import { SETTINGS_ROUTES } from '../../pages/settings/settings.constants';
import { observer } from 'mobx-react-lite';
import { AdminPanelSettingsOutlined } from '@mui/icons-material';

// console.log({SETTINGS_ROUTES})

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: '13px',
    padding: '5px 13px',
}));

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
    backgroundColor: theme.palette.secondary.light,
    justifyContent: 'space-between',
    paddingLeft: theme.spacing(4),
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    paddingRight: theme.spacing(4),

    // Take in prop that will resize width of left portion
    height: '100%',
    width: '100%',
}));

const StyledTopLeftContent = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    gap: theme.spacing(2),
}));

const StyledLink = {
    textDecoration: 'none',
    color: 'inherit',
};

const StyledAdminContainer = styled(Paper)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 1,
}));

const IdContainer = styled('span')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
}));

const StyledId = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.dark,
}));

type EditAppForm = {
    PROJECT_UPLOAD: File;
};

export const AppEditorPanel = (props) => {
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const navigate = useNavigate();

    const { appId, editorView, refreshApp, setIsLoading, isLoading } = useApp();

    const { width } = props;
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

    /**
     * TODO Reusability
     * but first see if this is the order of operations that is needed to refresh app with new changes
     */
    const reloadAndPublish = async () => {
        // turn on loading
        setIsLoading(true);

        try {
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
    };

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied id',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy id',
            });
        }
    };

    const { pathname, state } = useLocation();
    const { id } = useParams();
    const [adminMode, setAdminMode] = useState(false);

    const matchedRoute = useMemo(() => {
        for (const r of SETTINGS_ROUTES) {
            if (matchPath(`/${r.path}`, pathname)) {
                // alert(pathname)
                // a match is being found here so the r should be valid
                console.log({ r });
                return r;
            }
        }

        return null;
    }, [pathname]);

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
                            <Page
                                header={
                                    <Stack>
                                        {matchedRoute.path ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-between',
                                                }}
                                            >
                                                <Breadcrumbs separator="/">
                                                    <Link
                                                        to={'.'}
                                                        style={StyledLink}
                                                    >
                                                        Settings
                                                    </Link>
                                                    {/* ### tom note --- start here on monday */}
                                                    {matchedRoute.history.map(
                                                        (link, i) => {
                                                            return (
                                                                <Link
                                                                    style={
                                                                        StyledLink
                                                                    }
                                                                    to={link.replace(
                                                                        '<id>',
                                                                        id,
                                                                    )}
                                                                    key={
                                                                        i + link
                                                                    }
                                                                    state={...state}
                                                                >
                                                                    {link.includes(
                                                                        '<id>',
                                                                    )
                                                                        ? id
                                                                        : matchedRoute.title}
                                                                </Link>
                                                            );
                                                        },
                                                    )}
                                                    <Link
                                                        to={'.'}
                                                        style={StyledLink}
                                                    >
                                                        {
                                                            pathname.split('/')[
                                                                pathname.split(
                                                                    '/',
                                                                ).length - 1
                                                            ]
                                                        }
                                                    </Link>
                                                </Breadcrumbs>
                                                {configStore.store.user
                                                    .admin ? (
                                                    <StyledAdminContainer>
                                                        <Tooltip
                                                            title={
                                                                !adminMode
                                                                    ? 'Enable Admin Mode'
                                                                    : 'Disable Admin Mode'
                                                            }
                                                        >
                                                            <div>
                                                                <ToggleButton
                                                                    size="small"
                                                                    color={
                                                                        'primary'
                                                                    }
                                                                    value={
                                                                        'adminMode'
                                                                    }
                                                                    selected={
                                                                        adminMode
                                                                    }
                                                                    onClick={() =>
                                                                        setAdminMode(
                                                                            !adminMode,
                                                                        )
                                                                    }
                                                                >
                                                                    <AdminPanelSettingsOutlined />
                                                                </ToggleButton>
                                                            </div>
                                                        </Tooltip>
                                                    </StyledAdminContainer>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    height: '24px',
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                }}
                                            >
                                                {configStore.store.user
                                                    .admin ? (
                                                    <StyledAdminContainer>
                                                        <Tooltip
                                                            title={
                                                                !adminMode
                                                                    ? 'Enable Admin Mode'
                                                                    : 'Disable Admin Mode'
                                                            }
                                                        >
                                                            <div>
                                                                <ToggleButton
                                                                    size="small"
                                                                    color={
                                                                        'primary'
                                                                    }
                                                                    value={
                                                                        'adminMode'
                                                                    }
                                                                    selected={
                                                                        adminMode
                                                                    }
                                                                    onClick={() =>
                                                                        setAdminMode(
                                                                            !adminMode,
                                                                        )
                                                                    }
                                                                >
                                                                    <AdminPanelSettingsOutlined />
                                                                </ToggleButton>
                                                            </div>
                                                        </Tooltip>
                                                    </StyledAdminContainer>
                                                ) : null}
                                            </div>
                                        )}
                                        <Typography variant="h4">
                                            {matchedRoute.history.length < 2
                                                ? matchedRoute.title
                                                : state
                                                ? state.name
                                                : matchedRoute.title}
                                        </Typography>
                                        {id ? (
                                            <IdContainer>
                                                <StyledId variant={'subtitle2'}>
                                                    {id}
                                                </StyledId>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        copy(id);
                                                    }}
                                                >
                                                    <Tooltip title={`Copy ID`}>
                                                        <ContentCopyOutlined fontSize="inherit" />
                                                    </Tooltip>
                                                </IconButton>
                                            </IdContainer>
                                        ) : null}
                                        <Typography variant="body1">
                                            {!adminMode ||
                                            matchedRoute.path !== ''
                                                ? matchedRoute.description
                                                : matchedRoute.adminDescription}
                                        </Typography>
                                    </Stack>
                                }
                            >
                                <Outlet />
                            </Page>
                            {/* <form
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
                                        paddingBottom: '40px',
                                    }}
                                >
                                    <Typography variant={'h5'}>
                                        Settings
                                    </Typography>
                                    <Typography
                                        variant={'h6'}
                                        sx={{
                                            paddingTop: '8px',
                                            paddingBottom: '8px',
                                        }}
                                    >
                                        Access
                                    </Typography>
                                    <SettingsTiles
                                        mode="app"
                                        id={appId}
                                        name="App"
                                        condensed={true}
                                        onDelete={() => {
                                            navigate('/');
                                        }}
                                    />
                                    <Typography
                                        variant={'h6'}
                                        sx={{
                                            paddingTop: '8px',
                                            paddingBottom: '8px',
                                        }}
                                    >
                                        Publish
                                    </Typography>
                                    <AppSettings id={appId} condensed={true} />
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            paddingTop: '8px',
                                            paddingBottom: '8px',
                                        }}
                                    >
                                        Update Project
                                    </Typography>
                                    <Paper sx={{ paddingBottom: '20px' }}>
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
                                                        onChange={(
                                                            newValues,
                                                        ) => {
                                                            field.onChange(
                                                                newValues,
                                                            );
                                                        }}
                                                    />
                                                );
                                            }}
                                        />
                                        <Stack alignItems={'center'}>
                                            <StyledButton
                                                type="submit"
                                                variant={'contained'}
                                                disabled={isLoading}
                                            >
                                                Update
                                            </StyledButton>
                                        </Stack>
                                    </Paper>
                                </Stack>
                            </form> */}
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
                                    mode={'app'}
                                    id={appId}
                                    name={'app'}
                                    condensed={true}
                                />
                            </Stack>
                        </SettingsContext.Provider>
                    </StyledTopLeftContent>
                </StyledTopLeft>
            )}
            {editorView === 'code-editor' && (
                <AppEditor
                    appId={appId}
                    width={width}
                    onSave={(success: boolean) => {
                        // Succesfully Saved Asset, refresh portal
                        if (success) {
                            reloadAndPublish();
                        }
                    }}
                />
            )}
        </StyledContainer>
    );
};
