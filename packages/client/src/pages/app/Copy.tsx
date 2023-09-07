import React, {
    useState,
    useEffect,
    useReducer,
    useCallback,
    useRef,
} from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
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
    Code,
    CodeOff,
    Download,
    Settings,
    PersonAdd,
} from '@mui/icons-material';
import { Navbar } from '@/components/ui';
import { useRootStore, useAPI } from '@/hooks';
import { AppRenderer } from '@/components/app';

import { SettingsContext } from '@/contexts';
import { MembersTable } from '@/components/settings/MembersTable';
import { PendingMembersTable } from '@/components/settings/PendingMembersTable';
import { AppSettings } from '@/components/project/';
import { SettingsTiles } from '@/components/settings';

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
// Navigation Styles End ---------------------------------------

// background: var(--light-text-primary, rgba(0, 0, 0, 0.87));
const StyledContent = styled('div')(() => ({
    border: 'solid blue',
    height: `100%`,
    overflow: 'hidden',
}));

const StyledTop = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',

    // Take in prop that will resize height of top portion
    // marginTop: NAV_HEIGHT,
    border: 'solid yellow',
}));

const StyledTopLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    overflowX: 'hidden',
    background: theme.palette.background.paper,
    justifyContent: 'space-between',
    // gap: theme.spacing(2),
    // flexDirection: 'column',
    // border: 'solid green',

    // Take in prop that will resize width of left portion
    // height: '100%',
    width: '50%', // resizable
    maxWidth: '500px',
}));

const StyledTopLeftContent = styled('div')(({ theme }) => ({
    height: '95vh',
    width: '100%',
    overflowY: 'scroll',
    paddingLeft: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    // border: 'solid red',
}));

const StyledTopRight = styled('div')(() => ({
    flex: '1',
    height: '100%', //resizable
    overflow: 'hidden',
}));

const StyledBottom = styled('div')(({ theme }) => ({
    marginRight: theme.spacing(1),
}));

const StyledHorizDivider = styled(Divider)(() => ({
    height: '4px',
    '&:hover': {
        cursor: 'row-resize',
    },
}));

const StyledVertDivider = styled(Divider)(() => ({
    '&:hover': {
        cursor: 'col-resize',
    },
}));

type EditAppForm = {
    PROJECT_UPLOAD: File;
};

/**
 * Layout for the app
 */
export const Copy = observer(() => {
    const notification = useNotification();

    const { monolithStore, configStore } = useRootStore();
    const navigate = useNavigate();

    // get the app id from the url
    const { appId } = useParams();

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

    useEffect(() => {
        getAppPermission();

        return () => {
            // disable edit
            setAppPermission('READ_ONLY');
        };
    }, []);

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
     * Refresh the view
     */
    const refreshOutlet = () => {
        setCounter((c) => {
            return c + 1;
        });
    };

    /**
     * @name handleChange
     * @param event
     * @param newValue
     * @desc changes tab group
     */
    const handleChange = (newValue: string) => {
        setView(newValue);
    };

    // navigate home if there is not app id
    if (!appId) {
        return <Navigate to="/" replace />;
    }

    // RESIZABLE WINDOW START ----------------------------
    const [topPanelHeight, setTopPanelHeight] = useState('70%');
    const [bottomPanelHeight, setBottomPanelHeight] = useState('30%');

    const handleVerticalResize = (e) => {
        const newBottomPanelHeight = `${window.innerHeight - e.clientY}px`;
        const newTopPanelHeight = `${e.clientY}px`;

        setTopPanelHeight(newTopPanelHeight);
        setBottomPanelHeight(newBottomPanelHeight);
    };

    return (
        <StyledViewport>
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
                                            setView('settings');
                                        } else {
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
            <StyledContent>
                {/* Top Panel, resizes based on Divider drag in Bottom Panel */}
                <StyledTop
                    style={{
                        height:
                            editMode && view === 'code-editor'
                                ? topPanelHeight
                                : '100%',
                    }}
                >
                    {editMode && (
                        <SettingsContext.Provider
                            value={{
                                adminMode: configStore.store.user.admin,
                            }}
                        >
                            <StyledTopLeft>
                                <StyledTopLeftContent>
                                    {view === 'settings' && (
                                        <form onSubmit={editApp}>
                                            <Stack
                                                direction="column"
                                                spacing={1}
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
                                                        console.log(
                                                            field.value,
                                                        );
                                                        return (
                                                            <FileDropzone
                                                                multiple={false}
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
                                    )}
                                    {view === 'permissions' && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                            }}
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
                                        </div>
                                    )}
                                    {view === 'code-editor' && (
                                        // <AppEditor />
                                        <div> Insert editor</div>
                                    )}
                                </StyledTopLeftContent>
                                <StyledVertDivider orientation={'vertical'} />
                            </StyledTopLeft>
                        </SettingsContext.Provider>
                    )}
                    <StyledTopRight>
                        <AppRenderer key={counter} appId={appId}></AppRenderer>
                    </StyledTopRight>
                </StyledTop>

                {/* Bottom Panel for Console, Resizes top and Bottom Panel */}
                {editMode && view === 'code-editor' ? (
                    <>
                        <StyledHorizDivider
                            light={false}
                            onMouseDown={(e) => {
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
                            // onMouseDown={(e) => {
                            //     setDragging(true);
                            // }}
                            // onDragStart={() => setDragging(true)}
                        />
                        <StyledBottom
                            sx={{
                                border: 'solid green',
                                height: bottomPanelHeight,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    width: '100%',
                                    alignItems: 'center',
                                }}
                            >
                                <Icon>
                                    <BugReport style={{}} />
                                </Icon>
                                <Typography variant="caption">
                                    Debug Console
                                </Typography>
                            </div>
                            {/* <AppConsole /> */}
                        </StyledBottom>
                    </>
                ) : null}
            </StyledContent>
        </StyledViewport>
    );
});
