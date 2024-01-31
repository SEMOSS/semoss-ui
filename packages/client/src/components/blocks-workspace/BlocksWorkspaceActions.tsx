import { observer } from 'mobx-react-lite';
import {
    Button,
    IconButton,
    useNotification,
    styled,
    Stack,
    ButtonGroup,
    ThemeProvider,
} from '@semoss/ui';
import {
    Code,
    Share,
    Settings,
    Save,
    PlayCircleRounded,
} from '@mui/icons-material';

import { useWorkspace, useRootStore, useBlocks } from '@/hooks';
import { ShareOverlay } from '@/components/workspace';
import { PreviewOverlay } from '../workspace/PreviewOverlay';

const StyledNavItem = styled(ButtonGroup.Item, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if item is selected */
    selected: boolean;
}>(({ selected }) => ({
    backgroundColor: selected ? 'rgba(4, 113, 240, 0.12)' : '',
    transition: 'backgroundColor 2s ease',
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

export const BlocksWorkspaceActions = observer(() => {
    const { state } = useBlocks();

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { workspace } = useWorkspace();

    /**
     * Preview the current App
     */
    const previewApp = () => {
        try {
            // get the current state
            const json = state.toJSON();

            workspace.openOverlay(
                () => (
                    <PreviewOverlay
                        state={json}
                        onClose={() => {
                            workspace.closeOverlay();
                        }}
                    />
                ),
                {
                    maxWidth: 'lg',
                },
            );
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    };

    /**
     * Save the current app
     */
    const saveApp = async () => {
        // turn on loading
        workspace.setLoading(true);

        // convert the state to json
        const json = state.toJSON();

        try {
            // save the json
            const { errors } = await monolithStore.runQuery<[true]>(
                `SaveAppBlocksJson(project=["${
                    workspace.appId
                }"], json=["<encode>${JSON.stringify(json)}</encode>"]);`,
            );

            if (errors.length > 0) {
                throw new Error(errors.join(''));
            }

            notification.add({
                color: 'success',
                message: 'Success',
            });
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

    /**
     * Share the current App
     */
    const shareApp = async () => {
        // turn on loading
        workspace.setLoading(true);

        try {
            let isChanged = false;

            // only get the json if the user can edit
            if (workspace.role === 'OWNER' || workspace.role === 'EDIT') {
                const { pixelReturn, errors } = await monolithStore.runQuery<
                    [true]
                >(`GetAppBlocksJson ( project=['${workspace.appId}']);`);

                if (errors.length > 0) {
                    throw new Error(errors.join(''));
                }

                const { output } = pixelReturn[0];

                // TODO: Do we want a better way to check if it is changed
                isChanged =
                    JSON.stringify(output) !== JSON.stringify(state.toJSON());
            }

            workspace.openOverlay(() => (
                <ShareOverlay
                    diffs={isChanged}
                    appId={workspace.appId}
                    onClose={() => workspace.closeOverlay()}
                />
            ));
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
        <Stack direction="row" alignItems={'center'} spacing={2}>
            {(workspace.role === 'OWNER' || workspace.role === 'EDIT') &&
            workspace.isEditMode ? (
                <Stack direction="row" alignItems={'center'} spacing={0}>
                    <ButtonGroup
                        orientation="horizontal"
                        color="primary"
                        size="small"
                        variant="outlined"
                    >
                        <StyledNavItem
                            title={'Data'}
                            selected={workspace.view === 'data'}
                            onClick={() => {
                                workspace.setView('data');
                            }}
                        >
                            Data
                        </StyledNavItem>
                        <StyledNavItem
                            title={'Design'}
                            selected={workspace.view === 'design'}
                            onClick={() => {
                                workspace.setView('design');
                            }}
                        >
                            Design
                        </StyledNavItem>
                        <StyledNavItem
                            title={'Settings'}
                            selected={workspace.view === 'settings'}
                            onClick={() => {
                                workspace.setView('settings');
                            }}
                        >
                            <Stack
                                alignItems={'center'}
                                justifyContent={'center'}
                            >
                                <Settings fontSize="small" />
                            </Stack>
                        </StyledNavItem>
                    </ButtonGroup>
                </Stack>
            ) : (
                <></>
            )}
            <Stack flex={1}>&nbsp;</Stack>
            {workspace.isEditMode && (
                <>
                    <ThemeProvider type={'dark'} reset={false}>
                        <IconButton
                            color="default"
                            size="medium"
                            onClick={() => {
                                previewApp();
                            }}
                        >
                            <PlayCircleRounded
                                fontSize="inherit"
                                color={'inherit'}
                            />
                        </IconButton>
                    </ThemeProvider>
                    <Button
                        size={'small'}
                        color={'secondary'}
                        variant={'outlined'}
                        startIcon={<Share />}
                        onClick={() => {
                            shareApp();
                        }}
                    >
                        Share
                    </Button>

                    {workspace.role === 'OWNER' || workspace.role === 'EDIT' ? (
                        <>
                            <Button
                                size={'small'}
                                color={'secondary'}
                                variant={'outlined'}
                                startIcon={<Save />}
                                onClick={() => {
                                    saveApp();
                                }}
                            >
                                Save
                            </Button>
                        </>
                    ) : (
                        <></>
                    )}
                </>
            )}
            {workspace.role === 'OWNER' || workspace.role === 'EDIT' ? (
                <>
                    <StyledTrack
                        active={workspace.isEditMode}
                        onClick={() => {
                            workspace.setEditMode(!workspace.isEditMode);
                        }}
                    >
                        <StyledHandle active={workspace.isEditMode}>
                            <Code />
                        </StyledHandle>
                    </StyledTrack>
                </>
            ) : (
                <></>
            )}
        </Stack>
    );
});
