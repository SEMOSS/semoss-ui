import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';

import {
    Button,
    styled,
    Stack,
    Icon,
    Divider,
    List,
    Popover,
    Menu,
    Typography,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import {
    AccountCircle,
    Settings,
    Inventory2Outlined,
    LibraryBooksOutlined,
    Logout,
    SmartToyOutlined,
} from '@mui/icons-material';

import { THEME } from '@/constants';
import { Database } from '@/assets/img/Database';

const NAV_HEIGHT = '48px';
const SIDEBAR_WIDTH = '56px';

const StyledHeader = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: NAV_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    color: 'rgba(235, 238, 254, 1)',
    backgroundColor: theme.palette.common.black,
    zIndex: 10,
}));

const StyledHeaderLogo = styled(Link)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    color: 'inherit',
    textDecoration: 'none',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    cursor: 'pointer',
    backgroundColor: theme.palette.common.black,
    '&:hover': {
        backgroundColor: `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`,
    },
}));

const StyledHeaderLogoImg = styled('img')(({ theme }) => ({
    width: theme.spacing(3),
    filter: 'brightness(0) invert(1)', // convert to white
}));

const StyledHeaderLogout = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    textDecoration: 'none',
    height: NAV_HEIGHT,
    width: SIDEBAR_WIDTH,
    cursor: 'pointer',
    backgroundColor: theme.palette.common.black,
    '&:hover': {
        backgroundColor: `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`,
    },
}));

const StyledLogoutContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(2),
}));

const StyledIDContainer = styled('div')(({ theme }) => ({
    maxWidth: theme.spacing(15),
    display: 'flex',
    alignItems: 'center',
}));

export interface NavbarProps {
    children?: ReactNode;
}

export const Navbar = (props: NavbarProps) => {
    const { children } = props;

    const { configStore, monolithStore } = useRootStore();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        if (anchorEl) {
            setAnchorEl(null);
        } else {
            setAnchorEl(event.currentTarget);
        }
    };

    const logout = async () => {
        configStore.logout();
    };
    return (
        <StyledHeader>
            <StyledHeaderLogo to={'/'}>
                {THEME.logo ? <StyledHeaderLogoImg src={THEME.logo} /> : null}
                {THEME.name}
            </StyledHeaderLogo>
            <Stack flex={1}>{children}</Stack>
            <StyledHeaderLogout
                onClick={(event) => {
                    handlePopoverOpen(event);
                }}
            >
                <Icon>
                    <AccountCircle />
                </Icon>

                <Popover
                    id="logout-popover"
                    sx={{ mt: '45px' }}
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <List>
                        <List.Item>
                            <StyledLogoutContainer>
                                <StyledIDContainer>
                                    <Typography
                                        variant={'body1'}
                                        sx={{
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {configStore.store.user.id}
                                    </Typography>
                                </StyledIDContainer>
                                <Button
                                    variant={'contained'}
                                    onClick={() => {
                                        logout();
                                    }}
                                    sx={{ display: 'flex', gap: '8px' }}
                                >
                                    Logout
                                    <Logout />
                                </Button>
                            </StyledLogoutContainer>
                        </List.Item>
                    </List>
                </Popover>
            </StyledHeaderLogout>
        </StyledHeader>
    );
};
