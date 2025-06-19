import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Button,
    Typography,
    List,
    Stack,
    IconButton,
    Menu,
    MenuItem,
    Drawer,
    Avatar,
    ListItem,
    ListItemText,
    ListItemButton,
    ListItemIcon,
} from '@mui/material';
import { useInsight } from '@semoss/sdk/react';
import {
    Add,
    MenuOpenRounded,
    MenuRounded,
    MoreVertOutlined,
    PublicOutlined,
} from '@mui/icons-material';

import { useCacheState, useChat } from '@/hooks';
import { SidebarItem } from './SidebarItem';
import LOGO from '@/assets/img/logo.svg';
import LOGO_FULL from '@/assets/img/logo_full.svg';

const APP_NAME = process.env.APP_NAME ? process.env.APP_NAME : '';
const LOGO_PATH = process.env.LOGO_PATH ? process.env.LOGO_PATH : '';
const LOGO_FULL_PATH = process.env.LOGO_FULL_PATH
    ? process.env.LOGO_FULL_PATH
    : '';

const DRAWER_OPEN_WIDTH = 320;

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    fontSize: '14px',
    fontWeight: 400,
    letterSpacing: '.1px',
    lineHeight: '48px',
    height: theme.spacing(4),
    width: theme.spacing(4),
    background: theme.palette.primary.main,
}));

const StyledButton = styled(Button)(({ theme }) => ({
    height: theme.spacing(6),
    color: theme.palette.text.primary,
    background: theme.palette.background.paper,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.palette.secondary.border,
    borderRadius: theme.shape.borderRadiusLg,
})) as unknown as typeof Button;

const StyledActions = styled(Stack)(({ theme }) => ({
    height: '100%',
    position: 'relative',
    background: 'transparent',
    paddingTop: theme.spacing(3),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(3),
    paddingLeft: theme.spacing(3),
    zIndex: 0,
}));

const StyledSidebar = styled(Drawer)(() => ({
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

const StyledSidebarHeader = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(3),
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
}));

const StyledMenuOpenRounded = styled(MenuOpenRounded)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

const StyledSidebarContent = styled(Stack)(({ theme }) => ({
    height: '100%',
    width: '100%',
    flex: 1,
    paddingTop: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(3),
    paddingLeft: theme.spacing(2),
}));

const StyledList = styled(List)(() => ({
    flex: '1',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: 0,
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
    gap: theme.spacing(1),
    padding: theme.spacing(1),
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
    flexGrow: '0',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
})) as unknown as typeof ListItemButton;

const StyledListItemIcon = styled(ListItemIcon)(() => ({
    width: '28px',
    minWidth: 'auto',
}));

const StyledPublicOutlined = styled(PublicOutlined)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

const StyledMoreVertOutlined = styled(MoreVertOutlined)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

export const Sidebar = observer(() => {
    const { chat } = useChat();
    const { system, actions } = useInsight();

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isPinned, setIsPinned] = useCacheState<boolean>(
        false,
        'sidebar--isPinned',
    );
    const [settingsMenuAnchorEle, setSettingsMenuAnchorEle] =
        React.useState<null | HTMLElement>(null);
    const isSettingsMenuOpen = Boolean(settingsMenuAnchorEle);

    const loginType = Object.keys(system.config.logins)[0];
    const userName: string =
        typeof system.config.logins[loginType] === 'string'
            ? (system.config.logins[loginType] as unknown as string)
            : '';

    const initials: string = userName
        .match(/(\b\S)?/g)
        .join('')
        .match(/(^\S|\S$)?/g)
        .join('')
        .toUpperCase();

    /**
     * Logout of the application
     */
    const logout = async () => {
        try {
            await actions.logout();

            setSettingsMenuAnchorEle(null);
        } catch (e) {
            console.warn(e);
        }
    };

    return (
        <>
            {!isPinned && (
                <StyledActions
                    direction={'column'}
                    alignItems={'center'}
                    onMouseOver={() => setIsOpen(true)}
                    spacing={2}
                >
                    {LOGO_PATH ? (
                        <img src={LOGO_PATH} aria-label={APP_NAME} />
                    ) : (
                        <img src={LOGO} aria-label={APP_NAME} />
                    )}
                    <Stack flex={1}>&nbsp;</Stack>
                    <StyledAvatar alt="user initials">{initials}</StyledAvatar>
                    <IconButton onClick={() => setIsOpen(true)} size="medium">
                        <MenuRounded fontSize="inherit" />
                    </IconButton>
                </StyledActions>
            )}

            <StyledSidebar
                variant={isPinned ? 'permanent' : 'temporary'}
                open={isOpen}
                onClose={() => setIsOpen(false)}
                PaperProps={{
                    onMouseLeave: () => {
                        // closes if it is not pinned
                        if (isPinned) {
                            return;
                        }

                        setIsOpen(false);
                    },
                }}
            >
                <StyledSidebarHeader
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'flex-start'}
                    spacing={1}
                >
                    <Stack
                        to={'/'}
                        aria-label={'Go Home'}
                        component={Link}
                        direction={'row'}
                        alignItems={'center'}
                        flex={1}
                    >
                        {LOGO_FULL_PATH ? (
                            <img src={LOGO_FULL_PATH} aria-label={APP_NAME} />
                        ) : (
                            <img src={LOGO_FULL} aria-label={APP_NAME} />
                        )}
                    </Stack>

                    {/* <Box
                        flex={1}
                        textOverflow={'hidden'}
                        component={Link}
                        to={'/'}
                        aria-label={'Go Home'}
                        sx={{
                            color: 'inherit',
                            textDecoration: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {APP_NAME}
                    </Box> */}
                    <IconButton
                        size="small"
                        onClick={() => {
                            if (!isPinned) {
                                // if it is open and not pinned, pin it
                                setIsPinned(true);
                            } else if (isPinned) {
                                // if it is open, and pinned, close and unpin
                                setIsPinned(false);
                                setIsOpen(false);
                            } else {
                                // noop
                            }
                        }}
                    >
                        <StyledMenuOpenRounded fontSize="medium" />
                    </IconButton>
                </StyledSidebarHeader>
                <StyledSidebarContent
                    direction={'column'}
                    spacing={2}
                    overflow={'hidden'}
                >
                    <StyledButton
                        component={Link}
                        to={'/new'}
                        aria-label={'New room'}
                        replace={true}
                        variant={'text'}
                        color={'primary'}
                        fullWidth={true}
                        startIcon={<Add />}
                    >
                        New Chat
                    </StyledButton>
                    <StyledList dense={true} aria-label="open chat rooms">
                        <Stack direction={'column'} spacing={2}>
                            <StyledListItem>
                                <ListItemText>Today</ListItemText>
                            </StyledListItem>
                            {chat.todayRooms.map((roomId) => {
                                return (
                                    <SidebarItem key={roomId} roomId={roomId} />
                                );
                            })}
                            <StyledListItem>
                                <ListItemText>Previous</ListItemText>
                            </StyledListItem>
                            {chat.previousRooms.map((roomId) => {
                                return (
                                    <SidebarItem key={roomId} roomId={roomId} />
                                );
                            })}
                        </Stack>
                    </StyledList>
                    <StyledListItemButton
                        component={Link}
                        to={'/agents'}
                        aria-label={'Discover Agents'}
                        dense={true}
                    >
                        <StyledListItemIcon>
                            <StyledPublicOutlined fontSize="medium" />
                        </StyledListItemIcon>
                        <Typography variant="subtitle2">Discover</Typography>
                    </StyledListItemButton>
                    <Stack
                        direction={'row'}
                        alignItems={'center'}
                        padding={1}
                        spacing={2}
                    >
                        <Stack
                            direction={'row'}
                            alignItems={'center'}
                            flex={1}
                            spacing={1}
                        >
                            <StyledAvatar alt="user initials">
                                {initials}
                            </StyledAvatar>
                            <Typography
                                flex={1}
                                textOverflow={'ellipsis'}
                                variant="subtitle2"
                            >
                                {userName}
                            </Typography>
                        </Stack>
                        <IconButton
                            id="settings-control"
                            aria-controls={
                                isSettingsMenuOpen ? 'settings-menu' : undefined
                            }
                            aria-label="settings"
                            aria-expanded={
                                isSettingsMenuOpen ? 'true' : undefined
                            }
                            aria-haspopup="true"
                            onClick={(e) => {
                                setSettingsMenuAnchorEle(e.currentTarget);
                            }}
                        >
                            <StyledMoreVertOutlined />
                        </IconButton>
                        <Menu
                            id="settings-menu"
                            MenuListProps={{
                                'aria-labelledby': 'long-button',
                            }}
                            anchorEl={settingsMenuAnchorEle}
                            open={isSettingsMenuOpen}
                            onClose={() => {
                                setSettingsMenuAnchorEle(null);
                            }}
                        >
                            <MenuItem
                                onClick={() => {
                                    logout();
                                }}
                            >
                                Log Out
                            </MenuItem>
                        </Menu>
                    </Stack>
                </StyledSidebarContent>
            </StyledSidebar>
        </>
    );
});
