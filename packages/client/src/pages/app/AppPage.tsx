import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import {
    Avatar,
    styled,
    Stack,
    Typography,
    useNotification,
    Button,
    Modal,
    Tooltip,
    IconButton,
} from '@semoss/ui';
import { EditOutlined, ShareRounded } from '@mui/icons-material';

import { Env } from '@semoss/sdk/react';
import { WorkspaceStore } from '@/stores';
import { useRootStore } from '@/hooks';
import { LoadingScreen, ShareOverlay } from '@/components/ui';
// import { BlocksRenderer } from '@/components/blocks-workspace';
import { CodeRenderer } from '@/components/code-workspace';
import { Link } from 'react-router-dom';

import { Renderer } from '@semoss/renderer';

const StyledViewport = styled('div')(() => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
}));

const StyledContent = styled('div')(({ theme }) => ({
    position: 'relative',
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
}));

export const AppPage = observer(() => {
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

    // hide the screen while it loads
    if (!workspace) {
        return <LoadingScreen.Trigger description="Initializing app" />;
    }

    return (
        <StyledViewport>
            <Stack
                direction={'row'}
                justifyContent={'space-between'}
                alignItems={'center'}
                padding={1}
                spacing={1}
            >
                <Stack direction="row" alignItems={'center'} spacing={1}>
                    <Avatar
                        variant="rounded"
                        src={`${Env.MODULE}/api/project-${workspace.appId}/projectImage/download`}
                    />
                    <Typography variant={'subtitle1'}>
                        {workspace.metadata.project_name}
                    </Typography>
                </Stack>
                <Stack flex={1}>&nbsp;</Stack>

                <Tooltip title={'Share App'}>
                    <IconButton
                        size="small"
                        color="default"
                        onClick={() => {
                            setIsShareOpen(true);
                        }}
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
                    to={`../../../workspace/${appId}`}
                >
                    Edit
                </Button>
            </Stack>
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
        </StyledViewport>
    );
});
