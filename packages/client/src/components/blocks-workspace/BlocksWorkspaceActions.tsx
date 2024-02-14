import { observer } from 'mobx-react-lite';
import {
    styled,
    Button,
    IconButton,
    Stack,
    useNotification,
    ButtonGroup,
} from '@semoss/ui';
import { PlayCircleRounded, ShareRounded } from '@mui/icons-material';

import { useWorkspace, useRootStore, useBlocks } from '@/hooks';
import { ShareOverlay, PreviewOverlay } from '@/components/workspace';

const StyledShareButton = styled(Button)(({ theme }) => ({
    //TODO: styled needs to be updated to match the theme
    borderRadius: '12px', //  theme.shape.borderRadiusLg
}));

const StyledShareButtonText = styled('span')(({ theme }) => ({
    ...theme.typography.button,
    color: theme.palette.text.primary,
}));

const StyledShareIcon = styled(ShareRounded)(({ theme }) => ({
    color: 'rgba(0, 0, 0, 0.54)',
}));

const StyledSaveButtonGroup = styled(ButtonGroup)(({ theme }) => ({
    //TODO: styled needs to be updated to match the theme
    borderRadius: '12px', //  theme.shape.borderRadiusLg
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
        <Stack direction="row" spacing={1.25} alignItems={'center'}>
            <IconButton
                color="default"
                size="small"
                onClick={() => {
                    previewApp();
                }}
            >
                <PlayCircleRounded />
            </IconButton>
            <StyledShareButton
                size={'small'}
                color={'secondary'}
                variant={'outlined'}
                startIcon={<StyledShareIcon />}
                onClick={() => {
                    shareApp();
                }}
            >
                <StyledShareButtonText>Share</StyledShareButtonText>
            </StyledShareButton>
            <StyledSaveButtonGroup variant={'contained'} color={'primary'}>
                <ButtonGroup.Item
                    size={'small'}
                    onClick={() => {
                        saveApp();
                    }}
                >
                    Save
                </ButtonGroup.Item>
            </StyledSaveButtonGroup>
        </Stack>
    );
});
