import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import {
    Home as HomeIcon,
    Favorite as FavoriteIcon,
    GridView as GridViewIcon,
    Settings as SettingsIcon,
    Functions as FunctionsIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    TokenRounded,
    Inventory2Outlined,
} from '@mui/icons-material';

import {
    Drawer,
    List,
    Divider,
    Typography,
    Box,
    IconButton,
    styled,
} from '@semoss/ui';

import { ModelBrain } from '@/assets/img/ModelBrain';
import { Database } from '@/assets/img/Database';
import { useRootStore } from '@/hooks';
import { Logo } from '@/assets/img/Logo';
import { THEME } from '@/constants';
import { LoginPopover } from '../LoginPopover/LoginPopover';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    marginRight: 2,
    borderRadius: '7px',
    border: '0.938px solid #323232',
    width: '30px',
    height: '30px',
}));

const drawerWidth = 312;

const menuItems = [
    { text: 'Home', icon: <HomeIcon />, route: '/' },
    // { text: 'My Favorites', icon: <FavoriteIcon /> },
];

const catalogItems = [
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

const teamItems = [
    { text: 'SEMOSS Dev', color: '#22A4FF' },
    { text: 'Netherlands Ops', color: '#FFB74D' },
    { text: 'Spain Dev Ops', color: '#7AC36B' },
    { text: 'Microsoft - Spain General', color: '#AA7EEA' },
];

const drawerStyles = {
    width: drawerWidth,
    display: 'flex',
    justifyContent: 'space-between',
    flexShrink: 0,
    '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        borderRadius: '0 12px 12px 0',
        boxShadow: '4px 0px 4px 0px rgba(0, 0, 0, 0.05)',
    },
};

const headingStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 2,
    height: '56px',
};

const listStyles = {
    padding: 0,
    '&:hover': {
        backgroundColor: '#EBF4FE',
    },
};

const sectionTitleStyles = (fw = 600) => ({
    margin: '8px 16px',
    fontWeight: fw,
});

const teamIconStyles = (color: string) => ({
    width: 24,
    height: 24,
    backgroundColor: color,
    borderRadius: '4px',
});

interface SideNavProps {
    isOpen: boolean;
    onClose: () => void;
}

const bottomSectionStyles = {
    borderTop: '1px solid #E0E0E0',
    padding: 0,
};

const personIconStyles = {
    width: 24,
    height: 24,
    border: '1px solid #BDBDBD',
    borderRadius: '50%',
    backgroundColor: '#BDBDBD',
    fill: '#FFFFFF',
};

const SideNav = observer(({ isOpen, onClose }: SideNavProps) => {
    const { configStore } = useRootStore();
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
        <Drawer
            open={isOpen}
            variant="temporary"
            anchor="left"
            sx={drawerStyles}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%', // Ensures the Drawer takes full height
                    overflowY: 'auto', // Allows scrolling if content overflows
                }}
            >
                {/* Drawer Heading */}
                <Box sx={{ ...headingStyles, padding: '12px 16px' }}>
                    <Typography
                        variant="body1"
                        sx={{
                            ...sectionTitleStyles(700),
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            margin: 0,
                            padding: 0,
                        }}
                    >
                        <Logo />
                        <Typography variant="h6">
                            {' '}
                            {themeMap.name ? themeMap.name : THEME.name}
                        </Typography>
                    </Typography>
                    <StyledIconButton
                        size="medium"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={() => {
                            onClose();
                        }}
                    >
                        <CloseIcon
                            sx={{
                                cursor: 'pointer',
                                color: 'text.secondary',
                            }}
                        />
                    </StyledIconButton>
                </Box>
                <Divider />
                <Box sx={{ overflowY: 'auto' }}>
                    {/* Main Menu */}
                    <List sx={{ padding: 0 }}>
                        {menuItems.map((item, index) => (
                            <Link
                                key={index}
                                to={item.route}
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                }}
                                onClick={(e) => {
                                    onClose();
                                }}
                            >
                                <List.Item key={index} sx={listStyles}>
                                    <List.ItemButton sx={{ gap: 2 }}>
                                        <List.Icon sx={{ minWidth: '24px' }}>
                                            {item.icon}
                                        </List.Icon>
                                        <List.ItemText primary={item.text} />
                                    </List.ItemButton>
                                </List.Item>
                            </Link>
                        ))}
                    </List>
                    <Divider />

                    {/* Catalog Section */}
                    {viewSidebar && (
                        <>
                            <Typography
                                variant="subtitle1"
                                sx={sectionTitleStyles()}
                            >
                                Catalogs
                            </Typography>
                            <List sx={{ padding: 0 }}>
                                {catalogItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.route}
                                        style={{
                                            textDecoration: 'none',
                                            color: 'inherit',
                                        }}
                                        onClick={(e) => {
                                            onClose();
                                        }}
                                    >
                                        <List.Item key={index} sx={listStyles}>
                                            <List.ItemButton sx={{ gap: 2 }}>
                                                <List.Icon
                                                    sx={{ minWidth: '24px' }}
                                                >
                                                    {item.icon}
                                                </List.Icon>
                                                <List.ItemText
                                                    primary={item.text}
                                                />
                                            </List.ItemButton>
                                        </List.Item>
                                    </Link>
                                ))}
                            </List>
                            <Divider />
                        </>
                    )}

                    {/* Teams Section */}
                    {/* <Typography variant="subtitle1" sx={sectionTitleStyles()}>
                        Teams
                    </Typography>
                    <List sx={{ padding: 0 }}>
                        {teamItems.map((item, index) => (
                            <List.Item key={index} sx={listStyles}>
                                <List.ItemButton sx={{ gap: 2 }}>
                                    <List.Icon sx={{ minWidth: '24px' }}>
                                        <Box sx={teamIconStyles(item.color)} />
                                    </List.Icon>
                                    <List.ItemText primary={item.text} />
                                </List.ItemButton>
                            </List.Item>
                        ))}
                    </List>
                    <Divider /> */}

                    {/* Settings */}
                    <List sx={{ padding: 0 }}>
                        <Link
                            to={'/settings'}
                            style={{
                                textDecoration: 'none',
                                color: 'inherit',
                            }}
                            onClick={(e) => {
                                onClose();
                            }}
                        >
                            <List.Item sx={listStyles}>
                                <List.ItemButton sx={{ gap: 2 }}>
                                    <List.Icon sx={{ minWidth: '24px' }}>
                                        <SettingsIcon />
                                    </List.Icon>
                                    <List.ItemText primary="Settings" />
                                </List.ItemButton>
                            </List.Item>
                        </Link>
                    </List>
                </Box>
            </Box>
            {/* Bottom Section */}
            <Box sx={bottomSectionStyles}>
                <List sx={{ padding: 0 }}>
                    <List.Item sx={listStyles}>
                        <List.ItemButton sx={{ gap: 2 }}>
                            <LoginPopover>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                    }}
                                >
                                    <List.Icon sx={{ minWidth: '24px' }}>
                                        <PersonIcon sx={personIconStyles} />
                                    </List.Icon>
                                    {configStore.store.user.name && (
                                        <List.ItemText
                                            primary={
                                                configStore.store.user.name
                                            }
                                        />
                                    )}
                                </Box>
                            </LoginPopover>
                        </List.ItemButton>
                    </List.Item>
                </List>
            </Box>
        </Drawer>
    );
});

export { SideNav };
