/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { observer } from 'mobx-react-lite';
// Context and Hooks
import { SettingsContext } from '@/contexts';
import { useRootStore, useAPI } from '@/hooks';
// Components
import { Navbar } from '@/components/ui';
import { MembersTable } from '@/components/settings/MembersTable';
import { PendingMembersTable } from '@/components/settings/PendingMembersTable';
import { AppSettings } from '@/components/app';
import { SettingsTiles } from '@/components/settings';
import { AppRenderer, AppEditor } from '@/components/app';

import {
    Button,
    Divider,
    FileDropzone,
    Icon,
    IconButton,
    Stack,
    Typography,
    ToggleTabsGroup,
    useNotification,
    styled,
} from '@semoss/ui';

import {
    BugReport,
    CloseOutlined,
    Code,
    CodeOff,
    Download,
    Settings,
    PersonAdd,
} from '@mui/icons-material';

const NAV_HEIGHT = '48px';
const NAV_FOOTER = '24px';
const SIDEBAR_WIDTH = '56px';

const StyledViewport = styled('div')(({ theme }) => ({
    height: '100vh',
}));

// Navigation Styles Start -------------------------------------
const StyledNavbarChildren = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledNavbarLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    // gap: theme.spacing(2),
}));

const StyledNavbarRight = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
}));

const StyledNavbarItem = styled('div', {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if item is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    textDecoration: 'none',
    height: NAV_HEIGHT,
    width: SIDEBAR_WIDTH,
    cursor: 'pointer',
    backgroundColor: selected
        ? theme.palette.primary.main
        : theme.palette.common.black,
    transition: 'backgroundColor 2s ease',
    '&:hover': {
        backgroundColor: selected
            ? theme.palette.primary.main
            : `${theme.palette.primary.dark}4D`,
        transition: 'backgroundColor 2s ease',
    },
}));

const StyledTrack = styled('div', {
    shouldForwardProp: (prop) => prop !== 'active',
})<{
    /** Track if dev mode is enabled */
    active: boolean;
}>(({ theme, active }) => ({
    display: 'flex',
    alignItems: 'center',
    flexShrink: '0',
    width: '52px',
    height: '32px',
    padding: '2px 4px',
    borderRadius: '100px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: active
        ? theme.palette.primary.light
        : theme.palette.grey['500'],
    backgroundColor: active
        ? theme.palette.primary.light
        : theme.palette.action.active,
    '&:hover': {
        borderColor: active
            ? `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`
            : theme.palette.grey['400'],
    },
}));

const StyledHandle = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'active',
})<{
    /** Track if dev mode is enabled */
    active: boolean;
}>(({ theme, active }) => ({
    left: active ? '16px' : '0px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '23px',
    color: active ? theme.palette.common.white : theme.palette.common.black,
    backgroundColor: active
        ? theme.palette.primary.main
        : theme.palette.grey['500'],
    '&:hover': {
        backgroundColor: active
            ? `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`
            : theme.palette.grey['400'],
    },
    transition: theme.transitions.create(['left'], {
        duration: theme.transitions.duration.standard,
    }),
}));

// End of Navigation Styles -----------------------
// Start Of Top Panel Styles ----------------------
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

const StyledVertDivider = styled('div')(({ theme }) => ({
    width: theme.spacing(0.25),
    background: theme.palette.divider,
    '&:hover': {
        cursor: 'ew-resize',
    },
}));
// End of Top Panel Styles --------------------------
// Start of Bottom Panel Styles ---------------------
const StyledHorizDivider = styled('div')(({ theme }) => ({
    height: theme.spacing(0.25),
    background: theme.palette.divider,
    '&:hover': {
        cursor: 'ns-resize',
    },
}));

const StyledBottom = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    gap: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    background: theme.palette.background.paper,
}));

const StyledOpenConsoleButton = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
    color: 'rgba(0, 0, 0, .5)',
}));

// Start of Types -----------------------------------
type EditAppForm = {
    PROJECT_UPLOAD: File;
};
// End of Types -------------------------------------

export const AppPage = observer(() => {
    const notification = useNotification();

    const { monolithStore, configStore } = useRootStore();
    const navigate = useNavigate();

    // get the app id from the url
    const { appId } = useParams();

    // For console
    const dateObject = new Date();

    const [appPermission, setAppPermission] = useState('READ_ONLY');
    const [editMode, setEditMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [counter, setCounter] = useState(0);
    const [view, setView] = useState<string>('');

    const { handleSubmit, control } = useForm<EditAppForm>({
        defaultValues: {
            PROJECT_UPLOAD: null,
        },
    });

    // Start of Resizable Panels ----------------------

    const [topPanelHeight, setTopPanelHeight] = useState('100%');
    const [bottomPanelHeight, setBottomPanelHeight] = useState('3.5%');

    const [leftPanelWidth, setLeftPanelWidth] = useState('35%');
    const [rightPanelWidth, setRightPanelWidth] = useState('65%');

    const [showConsole, setShowConsole] = useState(false);

    const handleVerticalResize = (e) => {
        const bottomPanelHeight =
            (window.innerHeight - e.clientY) / window.innerHeight;
        const newBottomPanelHeight = `${bottomPanelHeight * 100}%`;
        const newTopPanelHeight = `${(e.clientY / window.innerHeight) * 100}%`;

        if (bottomPanelHeight < 0.035) {
            setShowConsole(false);
        } else {
            // console.log(newBottomPanelHeight)
            setTopPanelHeight(newTopPanelHeight);
            setBottomPanelHeight(newBottomPanelHeight);
            setShowConsole(true);
        }
    };

    const handleHorizontalResize = (e) => {
        const newRightPanelWidth = `${window.innerWidth - e.clientX}px`;
        const newLeftPanelWidth = `${e.clientX}px`;

        setLeftPanelWidth(newLeftPanelWidth);
        setRightPanelWidth(newRightPanelWidth);
    };
    // End of Resizable Panels ------------------------
    /**
     * @name handleChange
     * @param event
     * @param newValue
     * @desc changes tab group
     */
    const handleChange = (newValue: string) => {
        // resize window
        if (newValue === 'code-editor') {
            setLeftPanelWidth('45%');
            setRightPanelWidth('55%');
        }
        setView(newValue);
    };

    /**
     * Refresh the view
     */
    const refreshOutlet = () => {
        setCounter((c) => {
            return c + 1;
        });
    };

    /**
     * Determines whether user is allowed to edit or export
     */
    const getAppPermission = async () => {
        const response = await monolithStore.getUserProjectPermission(appId);

        setAppPermission(response.permission);
    };

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
            refreshOutlet();
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
     * Method that is called to download the app
     */
    const downloadApp = async () => {
        // turn on loading
        setIsLoading(true);

        try {
            const path = 'version/assets/';

            // upnzip the file in the new app
            const response = await monolithStore.runQuery(
                `DownloadAsset(filePath=["${path}"], space=["${appId}"]);`,
            );
            const key = response.pixelReturn[0].output;
            if (!key) {
                throw new Error('Error Downloading Asset');
            }

            await monolithStore.download(configStore.store.insightID, key);
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

    /**
     * Effects Section
     */
    useEffect(() => {
        getAppPermission();
        return () => {
            // disable edit
            setAppPermission('READ_ONLY');
        };
    }, []);

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <Navbar>
                {appPermission === 'OWNER' && (
                    <StyledNavbarChildren>
                        <StyledNavbarLeft>
                            {editMode ? (
                                <>
                                    <StyledNavbarItem
                                        selected={view === 'code-editor'}
                                        onClick={() => {
                                            handleChange('code-editor');
                                        }}
                                    >
                                        <CodeOff />
                                    </StyledNavbarItem>
                                    <StyledNavbarItem
                                        selected={view === 'settings'}
                                        onClick={() => {
                                            handleChange('settings');
                                        }}
                                    >
                                        <Settings />
                                    </StyledNavbarItem>
                                    <StyledNavbarItem
                                        selected={view === 'permissions'}
                                        onClick={() => {
                                            handleChange('permissions');
                                        }}
                                    >
                                        <PersonAdd />
                                    </StyledNavbarItem>
                                </>
                            ) : null}
                        </StyledNavbarLeft>
                        <StyledNavbarRight>
                            <StyledTrack
                                active={editMode}
                                onClick={() => {
                                    if (appPermission === 'OWNER') {
                                        setEditMode(!editMode);
                                        if (!editMode) {
                                            setTopPanelHeight('96.5%');
                                            setView('code-editor');
                                        } else {
                                            setTopPanelHeight('100%');
                                            setView('');
                                        }
                                    } else {
                                        notification.add({
                                            color: 'error',
                                            message:
                                                'Currently you do not have access to edit this application.',
                                        });
                                    }
                                }}
                            >
                                <StyledHandle active={editMode}>
                                    <Code />
                                </StyledHandle>
                            </StyledTrack>
                            <Button
                                size={'small'}
                                color={'primary'}
                                variant={'outlined'}
                                onClick={() => {
                                    downloadApp();
                                }}
                            >
                                <Download />
                            </Button>
                        </StyledNavbarRight>
                    </StyledNavbarChildren>
                )}
            </Navbar>
            <div
                className="panel"
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    height: topPanelHeight,
                    paddingTop: NAV_HEIGHT,
                }}
            >
                {editMode && (
                    <div
                        style={{
                            width: leftPanelWidth,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            {view === 'settings' && (
                                <StyledTopLeft>
                                    <StyledTopLeftContent>
                                        <SettingsContext.Provider
                                            value={{
                                                adminMode:
                                                    configStore.store.user
                                                        .admin,
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
                                                    <AppSettings
                                                        id={appId}
                                                        condensed={true}
                                                    />
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
                                                                    multiple={
                                                                        false
                                                                    }
                                                                    value={
                                                                        field.value
                                                                    }
                                                                    disabled={
                                                                        isLoading
                                                                    }
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
                                                    <Stack
                                                        alignItems={'center'}
                                                    >
                                                        <Button
                                                            type="submit"
                                                            variant={
                                                                'contained'
                                                            }
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
                            {view === 'permissions' && (
                                <StyledTopLeft>
                                    <StyledTopLeftContent>
                                        <SettingsContext.Provider
                                            value={{
                                                adminMode:
                                                    configStore.store.user
                                                        .admin,
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
                                                <Typography variant={'h6'}>
                                                    Members
                                                </Typography>
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
                            {view === 'code-editor' && (
                                <AppEditor appId={appId} />
                            )}
                            <StyledVertDivider
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    window.addEventListener(
                                        'mousemove',
                                        handleHorizontalResize,
                                    );
                                    window.addEventListener('mouseup', () => {
                                        window.removeEventListener(
                                            'mousemove',
                                            handleHorizontalResize,
                                        );
                                    });
                                }}
                            />
                        </div>
                    </div>
                )}

                <div
                    style={{
                        width: !editMode ? '100%' : rightPanelWidth,
                    }}
                >
                    <AppRenderer key={counter} appId={appId}></AppRenderer>
                </div>
            </div>

            {/* Resizable Bottom Panel  */}
            {editMode ? (
                <StyledBottom
                    sx={{ height: `calc(${bottomPanelHeight} - 2px)` }}
                >
                    <StyledHorizDivider
                        onMouseDown={(e) => {
                            e.preventDefault();
                            window.addEventListener(
                                'mousemove',
                                handleVerticalResize,
                            );
                            window.addEventListener('mouseup', () => {
                                window.removeEventListener(
                                    'mousemove',
                                    handleVerticalResize,
                                );
                            });
                        }}
                    ></StyledHorizDivider>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '100%',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="caption">
                                {dateObject.toUTCString()}
                            </Typography>
                            <StyledOpenConsoleButton
                                onClick={() => {
                                    if (
                                        topPanelHeight === '96.5%' &&
                                        bottomPanelHeight === '3.5%'
                                    ) {
                                        setShowConsole(true);
                                        setTopPanelHeight('75%');
                                        setBottomPanelHeight('25%');
                                    } else {
                                        setShowConsole(false);
                                        setTopPanelHeight('96.5%');
                                        setBottomPanelHeight('3.5%');
                                    }
                                }}
                            >
                                <StyledIcon>
                                    <BugReport />
                                </StyledIcon>
                                <Typography variant="caption">
                                    Debug Console
                                </Typography>
                                {showConsole ? (
                                    <StyledIcon>
                                        <CloseOutlined />
                                    </StyledIcon>
                                ) : null}
                            </StyledOpenConsoleButton>
                        </div>
                        {showConsole ? (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '100%',
                                }}
                            >
                                <Typography variant="h6">
                                    Currently in Progress...
                                </Typography>
                                <Typography variant="body1">
                                    We appreciate the patience with ongoing
                                    development, in the future this view will
                                    allow you to see the different responses
                                    that come back via the application, whether
                                    that being errors warnings and messages.
                                </Typography>
                            </div>
                        ) : null}
                    </div>
                    {/* <AppConsole /> */}
                </StyledBottom>
            ) : null}
        </div>
    );
});
