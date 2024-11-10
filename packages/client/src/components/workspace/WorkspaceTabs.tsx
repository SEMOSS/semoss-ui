import { observer } from 'mobx-react-lite';

import { useWorkspace } from '@/hooks';
import { styled, Typography, List, Stack } from '@semoss/ui';
import {
    Code,
    Dashboard,
    DataObject,
    Settings,
    VerticalSplitOutlined,
} from '@mui/icons-material';

const StyledListIcon = styled(List.Icon)(({ theme }) => ({
    minWidth: 'auto',
    width: theme.spacing(4),
}));

const getIcon = (id: string) => {
    if (id === 'code') {
        return <Code fontSize="inherit" />;
    } else if (id === 'settings') {
        return <Settings fontSize="inherit" />;
    } else if (id === 'ui') {
        return <Dashboard fontSize="inherit" />;
    } else if (id === 'data-science') {
        return <DataObject fontSize="inherit" />;
    } else if (id === 'dev') {
        return <VerticalSplitOutlined fontSize="inherit" />;
    } else if (id === 'renderer') {
        return null;
    }

    return null;
};

export const WorkspaceTabs = observer(() => {
    const { workspace } = useWorkspace();

    // if there are no other layouts, no need to show this
    if (workspace.availableLayouts.length <= 1) {
        return null;
    }

    return (
        <Stack direction="column">
            <Typography variant={'subtitle2'}>Perspectives</Typography>
            <List component="nav" dense={true} aria-label="workspace layouts">
                {workspace.availableLayouts.map((a) => {
                    return (
                        <List.ItemButton
                            key={a.id}
                            selected={a.id === workspace.selectedLayout?.id}
                            onClick={() => {
                                // select the layout
                                workspace.selectLayout(a.id);
                            }}
                        >
                            <StyledListIcon>{getIcon(a.id)}</StyledListIcon>
                            <List.ItemText primary={a.name} />
                        </List.ItemButton>
                    );
                })}
            </List>
        </Stack>
    );
});
