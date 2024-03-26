import { observer } from 'mobx-react-lite';
import { styled, IconButton, Stack, Typography, Tooltip } from '@semoss/ui';
import { ArrowBack, InfoOutlined } from '@mui/icons-material';

import { WorkspaceOverlay } from './WorkspaceOverlay';
import { WorkspaceLoading } from './WorkspaceLoading';
import { WorkspaceContext } from '@/contexts';
import { WorkspaceStore } from '@/stores';
import { useNavigate } from 'react-router-dom';

const StyledMain = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledHeader = styled('div')(({ theme }) => ({
    position: 'relative',
    flexShrink: 0,
    height: theme.spacing(5.5),
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(2),
    gap: theme.spacing(2),
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper1,
    borderBottom: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: theme.palette.divider,
}));

const StyledHeaderTitle = styled(Stack)(() => ({
    position: 'absolute',
    inset: '0',
}));

const StyledContent = styled('div')(() => ({
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

interface WorkspaceProps {
    /** Start items to render in the top bar */
    startTopbar?: React.ReactNode;

    /** End items to render in the top bar */
    endTopbar?: React.ReactNode;

    /** Footer to render */
    footer?: React.ReactNode;

    /** Content to render  */
    children: React.ReactNode;

    /** Workspace to render */
    workspace: WorkspaceStore;
}

export const Workspace = observer((props: WorkspaceProps) => {
    const {
        startTopbar: startTopbar = null,
        endTopbar: endTopbar = null,
        footer = null,
        workspace,
        children,
    } = props;

    const navigate = useNavigate();

    return (
        <WorkspaceContext.Provider
            value={{
                workspace: workspace,
            }}
        >
            <WorkspaceOverlay />
            <StyledMain>
                <StyledHeader>
                    <StyledHeaderTitle
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'center'}
                        spacing={1}
                    >
                        <Typography variant={'h6'}>
                            {workspace.metadata.project_name}
                        </Typography>
                        <Tooltip
                            title={
                                <Stack direction="column" spacing={0}>
                                    <div>App ID: {workspace.appId}</div>
                                    <div>
                                        Created:
                                        {
                                            workspace.metadata
                                                .project_date_created
                                        }
                                    </div>
                                </Stack>
                            }
                        >
                            <InfoOutlined fontSize={'small'} />
                        </Tooltip>
                    </StyledHeaderTitle>
                    <IconButton
                        title="Go back"
                        size="small"
                        color="default"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowBack fontSize="medium" />
                    </IconButton>

                    {startTopbar}
                    <Stack flex={1} direction="row">
                        &nbsp;
                    </Stack>

                    {endTopbar}
                </StyledHeader>
                <StyledContent>
                    <WorkspaceLoading />
                    {children}
                </StyledContent>
                {footer}
            </StyledMain>
        </WorkspaceContext.Provider>
    );
});
