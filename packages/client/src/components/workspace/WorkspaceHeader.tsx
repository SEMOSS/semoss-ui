import { observer } from 'mobx-react-lite';

import { useWorkspace } from '@/hooks';
import { styled, Stack, IconButton, Avatar, Typography } from '@semoss/ui';
import { Menu, MenuOpen } from '@mui/icons-material';
import { Env } from '@/env';

const StyledMenuOpenIcon = styled(MenuOpen)(() => ({
    color: 'rgba(0, 0, 0, 0.54)',
}));

const StyledMenuIcon = styled(Menu)(() => ({
    color: 'rgba(0, 0, 0, 0.54)',
}));

interface WorkspaceHeaderProps {
    /** Content to show at the end of the list */
    end?: React.ReactNode;

    /** Content to show in the alert field */
    alert?: React.ReactNode;
}

export const WorkspaceHeader = observer((props: WorkspaceHeaderProps) => {
    const { alert, end } = props;
    const { app, workspace } = useWorkspace();

    if (!app) {
        return null;
    }

    return (
        <Stack direction={'row'} alignItems={'center'} padding={1} spacing={1}>
            <Stack
                direction={'row'}
                alignItems={'center'}
                padding={1}
                spacing={1}
            >
                <IconButton
                    edge="start"
                    color={'default'}
                    aria-label="menu"
                    size={'small'}
                    onClick={() => {
                        workspace.toggleDrawer();

                        // save the workspace
                        workspace.saveToCache();
                    }}
                >
                    {workspace.drawer.isOpen ? (
                        <StyledMenuOpenIcon fontSize="inherit" />
                    ) : (
                        <StyledMenuIcon fontSize="inherit" />
                    )}
                </IconButton>
                <Stack direction="row" alignItems={'center'} spacing={1}>
                    <Avatar
                        variant="rounded"
                        src={`${Env.MODULE}/api/project-${app.appId}/projectImage/download`}
                    />
                    <Typography variant={'subtitle1'}>
                        {app.metadata.project_name}
                    </Typography>
                </Stack>
                <Stack
                    flex={1}
                    alignItems={'center'}
                    justifyContent={'center'}
                    overflow={'hidden'}
                >
                    <div>{alert || <>&nbsp;</>}</div>
                </Stack>
                {end}
            </Stack>
        </Stack>
    );
});
