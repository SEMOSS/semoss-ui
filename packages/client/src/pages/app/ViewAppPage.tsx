import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import {
    styled,
    useNotification,
    Modal,
    Stack,
    Tooltip,
    IconButton,
    Button,
    Typography,
    Avatar,
} from '@semoss/ui';
import { Renderer } from '@semoss/renderer';

import { WorkspaceStore } from '@/stores';
import { usePageSetup, useRootStore } from '@/hooks';
import { LoadingScreen, ShareOverlay } from '@/components/ui';
import { CodeRenderer } from '@/components/code-workspace';
import { EditOutlined, ShareRounded } from '@mui/icons-material';
import { Env } from '@semoss/sdk';

const StyledContent = styled('div')(({ theme }) => ({
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
}));

export const ViewAppPage = observer(() => {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { configStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<WorkspaceStore>(undefined);
    const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

    useEffect(() => {
        // clear out the old app
        setWorkspace(undefined);

        configStore
            .createWorkspace(appId)
            .then((loadedWorkspace) => {
                setWorkspace(loadedWorkspace);
            })
            .catch((e) => {
                notification.add({
                    color: 'error',
                    message: e.message,
                });

                navigate('/');
            });
    }, [appId]);

    usePageSetup({
        topNav: {
            left: () =>
                workspace ? (
                    <Stack direction="row" alignItems={'center'} spacing={1}>
                        <Avatar
                            variant="rounded"
                            src={`${Env.MODULE}/api/project-${workspace.appId}/projectImage/download`}
                        />
                        <Typography variant={'subtitle1'}>
                            {workspace.metadata.project_name}
                        </Typography>
                    </Stack>
                ) : (
                    <></>
                ),
            search: true,
            right: () =>
                workspace ? (
                    <Stack direction="row" alignItems={'center'} spacing={1}>
                        <Tooltip title={'Share App'}>
                            <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                    setIsShareOpen(true);
                                }}
                                data-testid={'app-page-share-btn'}
                            >
                                <ShareRounded fontSize={'inherit'} />
                            </IconButton>
                        </Tooltip>

                        <Button
                            variant="contained"
                            size={'small'}
                            color="primary"
                            disabled={
                                !(
                                    workspace.role === 'OWNER' ||
                                    workspace.role === 'EDIT'
                                )
                            }
                            endIcon={<EditOutlined fontSize="inherit" />}
                            component={Link}
                            //@ts-expect-error this is expected. props are forwarded
                            to={`../../../workspace/${appId}/edit`}
                            data-testid={'app-page-edit-btn'}
                        >
                            Edit
                        </Button>
                    </Stack>
                ) : (
                    <></>
                ),
        },
    });

    // hide the screen while it loads
    if (!workspace) {
        return <LoadingScreen.Trigger description="Initializing app" />;
    }

    console.log('show renderer');

    return (
        <>
            <StyledContent>
                {workspace.type === 'BLOCKS' ? (
                    <Renderer appId={appId} insightId={workspace.insightId} />
                ) : null}
                {workspace.type === 'CODE' ? (
                    <CodeRenderer appId={appId} />
                ) : null}
            </StyledContent>

            <Modal open={isShareOpen} onClose={() => setIsShareOpen(false)}>
                <ShareOverlay
                    appId={appId}
                    onClose={() => setIsShareOpen(false)}
                />
            </Modal>
        </>
    );
});
