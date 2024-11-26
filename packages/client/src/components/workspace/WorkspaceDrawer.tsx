import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';

import { styled, Typography, List, Stack } from '@semoss/ui';
import {
    Code,
    Dashboard,
    DataObject,
    Settings,
    VerticalSplitOutlined,
} from '@mui/icons-material';
import { useRootStore, useWorkspace } from '@/hooks';
import { THEME } from '@/constants';
import { Link } from 'react-router-dom';

const StyledListIcon = styled(List.Icon)(({ theme }) => ({
    minWidth: 'auto',
    width: theme.spacing(4),
}));

const StyledHeaderLogo = styled(Link)(({ theme }) => ({
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    ':hover': {
        bacakground: theme.palette.action.hover,
    },
}));

const StyledHeaderLogoImg = styled('img')(({ theme }) => ({
    width: theme.spacing(3),
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

export const WorkspaceDrawer = observer(() => {
    const { workspace, app } = useWorkspace();

    const { configStore } = useRootStore();

    const themeMap = useMemo(() => {
        const theme = configStore.store.config['theme'];

        if (theme && theme['THEME_MAP']) {
            try {
                return JSON.parse(theme['THEME_MAP'] as string);
            } catch {
                return {};
            }
        }

        return {};
    }, [Object.keys(configStore.store.config).length]);

    return (
        <Stack direction="column" gap={1} height={'100%'} padding={2}>
            <StyledHeaderLogo to={'/'}>
                <Stack direction="row" alignItems={'center'} spacing={1}>
                    {themeMap.isLogoUrl ? (
                        <StyledHeaderLogoImg src={themeMap.logo} />
                    ) : THEME.logo ? (
                        <StyledHeaderLogoImg src={THEME.logo} />
                    ) : null}
                    <Typography variant={'subtitle2'}>
                        {themeMap.name ? themeMap.name : THEME.name}
                    </Typography>
                </Stack>
            </StyledHeaderLogo>
            <Stack flex={1} direction="column" overflow={'auto'}>
                <Typography variant={'subtitle2'}>Perspectives</Typography>
                <List
                    component="nav"
                    dense={true}
                    aria-label="workspace layouts"
                >
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
            {app ? (
                <Stack
                    direction="column"
                    justifyContent={'center'}
                    spacing={0.25}
                >
                    <Typography
                        variant={'caption'}
                        sx={{ fontSize: '.625rem' }}
                    >
                        ID: {app.appId}
                    </Typography>
                </Stack>
            ) : null}
        </Stack>
    );
});
