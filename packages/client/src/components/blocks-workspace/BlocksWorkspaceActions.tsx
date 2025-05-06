import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { ShareRounded, SaveOutlined, PlayArrow } from '@mui/icons-material';

import { IconButton, Stack, useNotification, Tooltip } from '@semoss/ui';
import { useBlocks } from '@semoss/renderer';

import { useWorkspace, useRootStore } from '@/hooks';
import { PreviewOverlay } from '@/components/workspace';
import { ShareOverlay } from '@/components/ui';

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
                message:
                    'Save successful! Make sure to double-check your changes for correctness',
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

    useEffect(() => {
        /**
         * Trigger save on ctrl + s or command + s
         */
        const onDocumentKeydown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                saveApp();
            }
        };

        // attach the event listener
        document.addEventListener('keydown', onDocumentKeydown);

        // remove the event listener
        return () => {
            document.removeEventListener('keydown', onDocumentKeydown);
        };
    }, []);

    return (
        <Stack direction="row" spacing={1} alignItems={'center'}>
            <Tooltip title="Preview App">
                <IconButton
                    size={'small'}
                    color="default"
                    onClick={() => {
                        previewApp();
                    }}
                >
                    <PlayArrow fontSize="inherit" />
                </IconButton>
            </Tooltip>
            <Tooltip title={'Share App'}>
                <IconButton
                    size={'small'}
                    color="default"
                    onClick={() => {
                        shareApp();
                    }}
                >
                    <ShareRounded fontSize="inherit" />
                </IconButton>
            </Tooltip>
            <Tooltip title={'Save App (ctrl/command + s)'}>
                <IconButton
                    size={'small'}
                    color={'primary'}
                    onClick={() => {
                        saveApp();
                    }}
                >
                    <SaveOutlined fontSize="inherit" />
                </IconButton>
            </Tooltip>
        </Stack>
    );
});
