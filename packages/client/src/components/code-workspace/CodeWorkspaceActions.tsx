import { observer } from 'mobx-react-lite';
import { styled, Button, Stack, useNotification } from '@semoss/ui';
import { ShareRounded } from '@mui/icons-material';

import { useWorkspace, useRootStore } from '@/hooks';
import { ShareOverlay } from '@/components/workspace';

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

export const CodeWorkspaceActions = observer(() => {
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const { workspace } = useWorkspace();

    /**
     * Method that is called to export the app
     */
    const exportApp = async () => {
        // turn on loading
        workspace.setLoading(true);

        try {
            // export  the app
            const response = await monolithStore.runQuery<[string]>(
                `ExportProject(project=["${workspace.appId}"]);`,
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

    return (
        <Stack direction="row" spacing={1.25} alignItems={'center'}>
            <StyledShareButton
                size={'small'}
                color={'secondary'}
                variant={'outlined'}
                startIcon={<StyledShareIcon />}
                onClick={() => {
                    workspace.openOverlay(() => (
                        <ShareOverlay
                            appId={workspace.appId}
                            onClose={() => workspace.closeOverlay()}
                        />
                    ));
                }}
            >
                <StyledShareButtonText>Share</StyledShareButtonText>
            </StyledShareButton>
        </Stack>
    );
});
