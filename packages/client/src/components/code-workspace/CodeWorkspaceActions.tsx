import { observer } from 'mobx-react-lite';
import { IconButton, Stack, Tooltip } from '@semoss/ui';
import { ShareRounded } from '@mui/icons-material';
import { useWorkspace } from '@/hooks';
import { ShareOverlay } from '@/components/ui';

export const CodeWorkspaceActions = observer(() => {
    const { workspace } = useWorkspace();

    return (
        <Stack direction="row" spacing={1.25} alignItems={'center'}>
            <Tooltip title={'Share App'}>
                <IconButton
                    size="small"
                    color="default"
                    onClick={() => {
                        workspace.openOverlay(() => (
                            <ShareOverlay
                                appId={workspace.appId}
                                onClose={() => workspace.closeOverlay()}
                            />
                        ));
                    }}
                >
                    <ShareRounded fontSize={'inherit'} />
                </IconButton>
            </Tooltip>
        </Stack>
    );
});
