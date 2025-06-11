import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditOutlined, ShareRounded } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';

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
    Container,
} from '@semoss/ui';
import { Env } from '@semoss/sdk/react';
import { Renderer } from '@semoss/renderer';

import { WorkspaceStore } from '@/stores';
import { useRootStore } from '@/hooks';
import {
    LoadingScreen,
    NavigationBar,
    ShareOverlay,
    SideNav,
} from '@/components/ui';
import { CodeRenderer } from '@/components/code-workspace';

const StyledViewport = styled('div')(() => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
}));

const StyledContent = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: '56px',
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
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
            <StyledContent sx={{ paddingLeft: '40px', paddingRight: '40px' }}>
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
