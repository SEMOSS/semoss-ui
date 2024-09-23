import { useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Button,
    IconButton,
    Stack,
    useNotification,
    ButtonGroup,
} from '@semoss/ui';
import {
    GetAppRounded,
    PlayCircleRounded,
    ShareRounded,
    LaunchRounded,
} from '@mui/icons-material';

import { useWorkspace, useRootStore, useBlocks } from '@/hooks';
import { ShareOverlay, PreviewOverlay } from '@/components/workspace';
import { useNavigate } from 'react-router-dom';
import { Env } from '@/env';
import { env } from 'process';

const StyledShareIcon = styled(ShareRounded)(({ theme }) => ({
    color: 'rgba(0, 0, 0, 0.54)',
}));

export const BlocksWorkspaceActions = observer(() => {
    const { state } = useBlocks();

    const { configStore, monolithStore } = useRootStore();
    const notification = useNotification();
    const { workspace } = useWorkspace();
    const navigate = useNavigate();

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
                message: 'Save successful! Make sure to double-check your changes for correctness',
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
     * Method that is called to export the app
     */
    const exportApp = async () => {
        // turn on loading
        workspace.setLoading(true);

        try {
            // export  the app
            const response = await monolithStore.runQuery<[string]>(
                `ExportProjectApp(project=["${workspace.appId}"]);`,
            );

            // throw an error if there is no key
            const key = response.pixelReturn[0].output;
            if (!key) {
                throw new Error('Error exporting app');
            }

            await monolithStore.download(configStore.store.insightID, key);

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

    /**
     * Trigger save on ctrl+s
     */
        const onDocumentKeydown = useCallback((event: KeyboardEvent) => {
            if (event.key === 's' && event.ctrlKey) {
                event.preventDefault();
                saveApp();
            }
        }, []);
    
        useEffect(() => {
            // attach the event listener
            document.addEventListener('keydown', onDocumentKeydown);
    
            // remove the event listener
            return () => {
                document.removeEventListener('keydown', onDocumentKeydown);
            };
        }, [onDocumentKeydown]);

    return (
        <Stack direction="row" spacing={1} alignItems={'center'}>
            <Button
                variant="text"
                startIcon={<PlayCircleRounded />}
                title="Preview App"
                color="inherit"
                onClick={() => {
                    previewApp();
                }}
            >
                Preview
            </Button>
            <Button
                variant="text"
                startIcon={<GetAppRounded />}
                title="Download App"
                color="inherit"
                onClick={() => {
                    exportApp();
                }}
            >
                Download
            </Button>
            <Button
                size="small"
                variant="text"
                startIcon={<StyledShareIcon />}
                title="Share App"
                color="inherit"
                onClick={() => {
                    shareApp();
                }}
            >
                Share
            </Button>
            <Button
                variant="contained"
                size="small"
                color="primary"
                title="Save App"
                onClick={() => {
                    saveApp();
                }}
            >
                Save
            </Button>
            <Button
                endIcon={<LaunchRounded />}
                onClick={() => {
                    const encodedState = encodeURIComponent(
                        JSON.stringify(state.toJSON()),
                    );
                    const url = `${window.location.origin}${window.location.pathname}#/s/${workspace.appId}?state=${encodedState}`;

                    window.open(url, '_blank');
                }}
            >
                Launch
            </Button>
        </Stack>
    );
});
