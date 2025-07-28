import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Link, matchPath, useLocation } from 'react-router-dom';
import {
    Home as HomeIcon,
    GridView as GridViewIcon,
    Settings as SettingsIcon,
    Functions as FunctionsIcon,
    Person as PersonIcon,
    TokenRounded,
    Inventory2Outlined,
    MenuOpenRounded,
} from '@mui/icons-material';

import {
    Drawer,
    List,
    Divider,
    Typography,
    IconButton,
    styled,
    Stack,
} from '@semoss/ui';

import { ModelBrain } from '@/assets/img/ModelBrain';
import { Database } from '@/assets/img/Database';
import { usePage, useRootStore } from '@/hooks';
import { LoginPopover } from './LoginPopover';

const DRAWER_OPEN_WIDTH = 288;

const CATALOG_ROUTES = [
    { text: 'Apps', icon: <GridViewIcon />, route: '/app' },
    {
        text: 'Model',
        icon: <ModelBrain color="#757575" width="24" height="24" />,
        route: '/engine/model',
    },
    {
        text: 'Database',
        icon: <Database color="#757575" />,
        route: '/engine/database',
    },
    { text: 'Vector', icon: <TokenRounded />, route: '/engine/vector' },
    { text: 'Function', icon: <FunctionsIcon />, route: '/engine/function' },
    {
        text: 'Storage',
        icon: <Inventory2Outlined />,
        route: '/engine/storage',
    },
];

const StyledNavHeader = styled(Stack)(({ theme }) => ({
    position: 'relative',
    background: 'transparent',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    zIndex: 0,
}));

const StyledNavHeaderLink = styled(Link)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    gap: theme.spacing(1),
    '&:hover': {
        background: theme.palette.action.hover,
    },
}));

const StyledSidebar = styled(Drawer)(() => ({
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
        width: DRAWER_OPEN_WIDTH,
        borderRadius: '0px',
        // boxShadow: 'none',
        // border: 'none',
    },
    variants: [
        {
            props: ({ variant }) => variant === 'permanent',
            style: {
                width: DRAWER_OPEN_WIDTH,
                '& .MuiDrawer-paper': {
                    // backgroundColor: 'transparent',
                },
            },
        },
    ],
}));

const StyledSidebarContent = styled(Stack)(({ theme }) => ({
    flexDirection: 'column',
    width: '100%',
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    overflowY: 'auto',
}));

const StyledSidebarFooter = styled(Stack)(({ theme }) => ({
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    overflowY: 'hidden',
}));

const StyledList = styled(List)(() => ({
    padding: 0,
}));

const StyledListItem = styled(List.Item)(({ theme }) => ({
    gap: theme.spacing(1),
    padding: theme.spacing(1),
}));

const StyledListItemButton = styled(List.ItemButton, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected: boolean }>(({ theme, selected }) => ({
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: selected ? theme.palette.secondary.light : undefined,
})) as unknown as typeof List.ItemButton;

const StyledListItemIcon = styled(List.Icon)(() => ({
    width: '28px',
    minWidth: 'auto',
}));

const StyledLink = styled(Link)(({ theme }) => ({
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
}));

export const Sidebar: React.FC = observer(() => {
    const { configStore } = useRootStore();
    const { page } = usePage();

    const { pathname } = useLocation();

    const [viewSidebar, setViewSidebar] = useState(false);
    useEffect(() => {
        if (configStore.store.user.admin) {
            setViewSidebar(true);
        } else if (
            !configStore.store.user.admin &&
            !configStore.store.config.adminOnlyViewMenuBarFlag
        ) {
            setViewSidebar(true);
        }
    }, [
        configStore.store.user.admin,
        configStore.store.config.adminOnlyViewMenuBarFlag,
    ]);

    return (
        <>
            <StyledSidebar
                variant={page.sidebar.pinned ? 'permanent' : 'temporary'}
                anchor="left"
                open={page.sidebar.open}
                onClose={() => page.closeSidebar()}
                PaperProps={{
                    onMouseLeave: () => {
                        // closes if it is not pinned
                        if (page.sidebar.pinned) {
                            return;
                        }

                        page.closeSidebar();
                    },
                }}
            >
                <StyledNavHeader
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'flex-start'}
                    spacing={2}
                >
                    <StyledNavHeaderLink to={'/'} aria-label={'Go Home'}>
                        {configStore.theme.logo ? (
                            <img src={configStore.theme.logo} />
                        ) : null}
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {configStore.theme.name}
                        </Typography>
                    </StyledNavHeaderLink>

                    <IconButton
                        size="small"
                        onClick={() => {
                            if (!page.sidebar.pinned) {
                                // if it is open and not pinned, pin it
                                page.pinSidebar();
                            } else if (page.sidebar.pinned) {
                                // if it is open, and pinned, close and unpin
                                page.unpinSidebar();
                                page.closeSidebar();
                            } else {
                                // noop
                            }
                        }}
                    >
                        <MenuOpenRounded fontSize="medium" />
                    </IconButton>
                </StyledNavHeader>
                <Divider />
                <StyledSidebarContent>
                    <StyledList dense={true} aria-label="main navigation">
                        <StyledLink to={'/'} aria-label={'Home'}>
                            <StyledListItemButton
                                selected={!!matchPath('/', pathname)}
                                dense={true}
                            >
                                <StyledListItemIcon>
                                    <HomeIcon />
                                </StyledListItemIcon>
                                <List.ItemText primary={'Home'} />
                            </StyledListItemButton>
                        </StyledLink>
                    </StyledList>
                </StyledSidebarContent>
                <Divider />
                {viewSidebar ? (
                    <>
                        <StyledSidebarContent flex={1}>
                            <StyledList
                                dense={true}
                                aria-label="catalog navigation"
                            >
                                <StyledListItem>
                                    <List.ItemText
                                        primary={'Catalog'}
                                        primaryTypographyProps={{
                                            variant: 'subtitle2',
                                        }}
                                    />
                                </StyledListItem>
                                {CATALOG_ROUTES.map((r) => {
                                    return (
                                        <StyledLink
                                            key={r.route}
                                            to={r.route}
                                            aria-label={r.text}
                                        >
                                            <StyledListItemButton
                                                selected={
                                                    !!matchPath(
                                                        `${r.route}/*`,
                                                        pathname,
                                                    )
                                                }
                                                aria-label={r.text}
                                                dense={true}
                                            >
                                                <StyledListItemIcon>
                                                    {r.icon}
                                                </StyledListItemIcon>
                                                <List.ItemText
                                                    primary={r.text}
                                                />
                                            </StyledListItemButton>
                                        </StyledLink>
                                    );
                                })}
                            </StyledList>
                        </StyledSidebarContent>
                    </>
                ) : (
                    <Stack flex={1} />
                )}
                <Divider />
                <StyledSidebarFooter>
                    <StyledList dense={true} aria-label="main navigation">
                        <StyledLink to={'/settings'} aria-label={'Settings'}>
                            <StyledListItemButton
                                selected={!!matchPath(`/settings/*`, pathname)}
                                dense={true}
                            >
                                <StyledListItemIcon>
                                    <SettingsIcon />
                                </StyledListItemIcon>
                                <List.ItemText primary={'Settings'} />
                            </StyledListItemButton>
                        </StyledLink>

                        <LoginPopover>
                            <StyledListItemButton
                                aria-label={'Login'}
                                dense={true}
                            >
                                <StyledListItemIcon>
                                    <PersonIcon />
                                </StyledListItemIcon>
                                <List.ItemText
                                    primary={configStore.store.user.name || ''}
                                />
                            </StyledListItemButton>
                        </LoginPopover>
                    </StyledList>
                </StyledSidebarFooter>
            </StyledSidebar>
        </>
    );
});
