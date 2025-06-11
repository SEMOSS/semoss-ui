import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Link, useLocation } from 'react-router-dom';
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
import { useRootStore } from '@/hooks';
import { Logo } from '@/assets/img/Logo';
import { THEME } from '@/constants';
import { LoginPopover } from '../LoginPopover/LoginPopover';

const DRAWER_OPEN_WIDTH = 312;

const CATALOG_ROUTES = [
    { text: 'Apps', icon: <GridViewIcon />, route: '/apps' },
    {
        text: 'Models',
        icon: <ModelBrain color="#757575" width="24" height="24" />,
        route: '/engine/model',
    },
    {
        text: 'Databases',
        icon: <Database color="#757575" />,
        route: '/engine/database',
    },
    { text: 'Vectors', icon: <TokenRounded />, route: '/engine/vector' },
    { text: 'Functions', icon: <FunctionsIcon />, route: '/engine/function' },
    {
        text: 'Storages',
        icon: <Inventory2Outlined />,
        route: '/engine/storage',
    },
];

const StyledSideNav = styled(Drawer)(() => ({
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& .MuiDrawer-paper': {
        width: DRAWER_OPEN_WIDTH,
        borderRadius: '0px',
        boxShadow: 'none',
        border: 'none',
    },
    variants: [
        {
            props: ({ variant }) => variant === 'permanent',
            style: {
                width: DRAWER_OPEN_WIDTH,
                '& .MuiDrawer-paper': {
                    backgroundColor: 'transparent',
                },
            },
        },
    ],
}));

const StyledSideNavHeader = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
}));

const StyledSideNavHeaderLink = styled(Link)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    gap: theme.spacing(2),
    '&:hover': {
        background: theme.palette.action.hover,
    },
}));

const StyledSideNavContent = styled(Stack)(({ theme }) => ({
    height: '100%',
    width: '100%',
    flex: 1,
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    overflowY: 'auto',
}));

const StyledSideNavFooter = styled(Stack)(({ theme }) => ({
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
    backgroundColor: selected ? theme.palette.secondary.selected : undefined,
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

interface SideNavProps {
    /** Track if the nav is open */
    isOpen: boolean;

    /** Track if the nav is pinned open */
    isPinned: boolean;

    /** Triggered when the state is upated */
    onUpdate: (isOpen: boolean, isPinned: boolean) => void;
}

export const SideNav: React.FC<SideNavProps> = observer(
    ({ isOpen, isPinned, onUpdate }) => {
        const { configStore } = useRootStore();
        const location = useLocation();

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

        // TODO: Load from a theme object
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

        /**
         * to determine if route is selected
         */
        const isSelected = (route: string) => {
            if (route === '/') {
                if (location.pathname === '/') {
                    return true;
                }
                return false;
            } else {
                return location.pathname.includes(route);
            }
        };

        return (
            <StyledSideNav
                variant={isPinned ? 'permanent' : 'temporary'}
                open={isOpen}
                onClose={() => onUpdate(false, isPinned)}
                PaperProps={{
                    onMouseLeave: () => {
                        // closes if it is not pinned
                        if (isPinned) {
                            return;
                        }

                        onUpdate(false, isPinned);
                    },
                }}
            >
                <StyledSideNavHeader
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'flex-start'}
                    spacing={1}
                >
                    <StyledSideNavHeaderLink to={'/'} aria-label={'Go Home'}>
                        <Logo />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {themeMap.name ? themeMap.name : THEME.name}
                        </Typography>
                    </StyledSideNavHeaderLink>

                    <IconButton
                        size="small"
                        onClick={() => {
                            console.log('start', isOpen, isPinned);
                            if (isOpen && !isPinned) {
                                // if it is open and not pinned, pin it
                                onUpdate(isOpen, true);
                            } else if (isOpen && isPinned) {
                                // if it is open, and pinned, close and unpin
                                onUpdate(false, false);
                            } else {
                                // noop
                            }
                        }}
                    >
                        <MenuOpenRounded fontSize="medium" />
                    </IconButton>
                </StyledSideNavHeader>
                <Divider />
                <StyledSideNavContent direction={'column'} spacing={2}>
                    <StyledList dense={true} aria-label="main navigation">
                        <Stack direction={'column'} spacing={2}>
                            <StyledLink to={'/'} aria-label={'Home'}>
                                <StyledListItemButton
                                    selected={isSelected('/')}
                                    dense={true}
                                >
                                    <StyledListItemIcon>
                                        <HomeIcon />
                                    </StyledListItemIcon>
                                    <List.ItemText primary={'Home'} />
                                </StyledListItemButton>
                            </StyledLink>
                        </Stack>
                    </StyledList>
                    {viewSidebar && (
                        <>
                            <Divider />
                            <StyledList
                                dense={true}
                                aria-label="catalog navigation"
                            >
                                <Stack direction={'column'} spacing={2}>
                                    <StyledListItem>
                                        <List.ItemText>Catalogs</List.ItemText>
                                    </StyledListItem>

                                    {CATALOG_ROUTES.map((r) => {
                                        return (
                                            <StyledLink
                                                key={r.route}
                                                to={r.route}
                                                aria-label={r.text}
                                            >
                                                <StyledListItemButton
                                                    selected={isSelected(
                                                        r.route,
                                                    )}
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
                                </Stack>
                            </StyledList>
                        </>
                    )}
                </StyledSideNavContent>
                <Divider />
                <StyledSideNavFooter>
                    <StyledList dense={true} aria-label="main navigation">
                        <Stack direction={'column'} spacing={2}>
                            <StyledLink
                                to={'/settings'}
                                aria-label={'Settings'}
                            >
                                <StyledListItemButton
                                    selected={isSelected('/settings')}
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
                                        primary={
                                            configStore.store.user.name || ''
                                        }
                                    />
                                </StyledListItemButton>
                            </LoginPopover>
                        </Stack>
                    </StyledList>
                </StyledSideNavFooter>
            </StyledSideNav>
        );
    },
);
