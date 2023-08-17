import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import {
    styled,
    useNotification,
    Icon,
    Button,
    Stack,
    IconButton,
    FileDropzone,
    Typography,
} from '@semoss/ui';
import { AccountCircle, Code, Download } from '@mui/icons-material';

import { THEME } from '@/constants';
import { useRootStore } from '@/hooks';
import { AppRenderer } from '@/components/app';

const NAV_HEIGHT = '48px';
const NAV_FOOTER = '24px';
const NAV_ICON_WIDTH = '56px';

// background: var(--light-text-primary, rgba(0, 0, 0, 0.87));

const StyledHeader = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: NAV_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    color: 'rgba(235, 238, 254, 1)',
    backgroundColor: theme.palette.common.black,
    zIndex: 10,
    gap: theme.spacing(1),
}));

const StyledHeaderLogo = styled(Link)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: 'inherit',
    textDecoration: 'none',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    cursor: 'pointer',
    backgroundColor: theme.palette.common.black,
    '&:hover': {
        backgroundColor: `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`,
    },
}));

const StyledHeaderLogout = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    textDecoration: 'none',
    height: NAV_HEIGHT,
    width: NAV_ICON_WIDTH,
    cursor: 'pointer',
    backgroundColor: theme.palette.common.black,
    '&:hover': {
        backgroundColor: `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`,
    },
}));

const StyledContent = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    paddingTop: NAV_HEIGHT,
    paddingBottom: NAV_FOOTER,
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledLeft = styled('div')(({ theme }) => ({
    height: '100%',
    width: '50%',
    maxWidth: '400px',
    overflow: 'hidden',
    background: theme.palette.background.paper,
    padding: theme.spacing(2),
}));

const StyledRight = styled('div')(() => ({
    flex: '1',
    height: '100%',
    overflow: 'hidden',
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

type EditAppForm = {
    PROJECT_UPLOAD: File;
};

/**
 * Layout for the app
 */
export const AppPage = observer(() => {
    const notification = useNotification();

    const { monolithStore, configStore } = useRootStore();

    // get the app id from the url
    const { appId } = useParams();

    const [editMode, setEditMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);
    const [counter, setCounter] = useState(0);

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

            // upnzip the file in the new project
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

            // upnzip the file in the new project
            await monolithStore.runQuery(
                `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${appId}"]);`,
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

            // upnzip the file in the new project
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

    // navigate home if there is not app id
    if (!appId) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <StyledHeader>
                <StyledHeaderLogo to={'/'}>
                    {THEME.logo ? <img src={THEME.logo} /> : null}
                    {THEME.name}
                </StyledHeaderLogo>
                <Stack flex={1}>&nbsp;</Stack>
                <StyledTrack
                    active={editMode}
                    onClick={() => setEditMode(!editMode)}
                >
                    <StyledHandle active={editMode}>
                        <Code />
                    </StyledHandle>
                </StyledTrack>
                <IconButton
                    size={'small'}
                    color={'primary'}
                    onClick={() => {
                        downloadApp();
                    }}
                >
                    <Download />
                </IconButton>
                <StyledHeaderLogout>
                    <Icon>
                        <AccountCircle />
                    </Icon>
                </StyledHeaderLogout>
            </StyledHeader>
            <StyledContent>
                {editMode && (
                    <StyledLeft>
                        <form onSubmit={editApp}>
                            <Stack direction="column" spacing={1}>
                                <Typography variant="subtitle2">
                                    Update Project
                                </Typography>
                                <Controller
                                    name={'PROJECT_UPLOAD'}
                                    control={control}
                                    rules={{}}
                                    render={({ field }) => {
                                        console.log(field.value);
                                        return (
                                            <FileDropzone
                                                multiple={false}
                                                value={field.value}
                                                disabled={isLoading}
                                                onChange={(newValues) => {
                                                    field.onChange(newValues);
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
                    </StyledLeft>
                )}
                <StyledRight>
                    <AppRenderer key={counter} appId={appId}></AppRenderer>
                </StyledRight>
            </StyledContent>
        </>
    );
});
