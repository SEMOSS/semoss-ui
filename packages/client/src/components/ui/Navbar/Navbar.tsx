import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { AccountCircle, Logout } from '@mui/icons-material';
import {
    Avatar,
    Button,
    styled,
    Stack,
    List,
    Popover,
    Typography,
    IconButton,
} from '@/component-library';

import { useRootStore } from '@/hooks';
import { THEME } from '@/constants';

const NAV_HEIGHT = '48px';

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

const StyledTypography = styled(Typography)(({ theme }) => ({
    maxWidth: theme.spacing(15),
}));

export interface NavbarProps {
    /** Content to add to the Navbar */
    children?: ReactNode;
}

export const Navbar = (props: NavbarProps) => {
    const { children } = props;

    const { configStore } = useRootStore();
    const [popoverAnchorEle, setPopoverAnchorEl] = useState<HTMLElement | null>(
        null,
    );

    // track if the popover is open
    const isPopoverOpen = Boolean(popoverAnchorEle);

    return (
        <StyledHeader>
            <StyledHeaderLogo to={'/'}>
                {THEME.logo ? <StyledHeaderLogoImg src={THEME.logo} /> : null}
                {THEME.name}
            </StyledHeaderLogo>
            <Stack flex={1}>{children}</Stack>
            <IconButton
                size="large"
                color="inherit"
                onClick={(e) => {
                    setPopoverAnchorEl(e.currentTarget);
                }}
            >
                <AccountCircle />
            </IconButton>

            <Popover
                id="logout-popover"
                anchorEl={popoverAnchorEle}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                open={isPopoverOpen}
                onClose={() => setPopoverAnchorEl(null)}
            >
                <List>
                    <List.Item>
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            spacing={1}
                        >
                            {configStore.store.user.name ? (
                                <Avatar>
                                    {configStore.store.user.name[0]}
                                </Avatar>
                            ) : null}

                            <StyledTypography variant={'body1'} noWrap={true}>
                                {configStore.store.user.name}
                            </StyledTypography>
                        </Stack>
                    </List.Item>
                    <List.Item>
                        <Stack alignItems={'center'} width={'100%'}>
                            <Button
                                variant={'contained'}
                                onClick={() => {
                                    configStore.logout();
                                }}
                                endIcon={<Logout />}
                            >
                                Logout
                            </Button>
                        </Stack>
                    </List.Item>
                    <List.Item>
                        <Stack alignItems={'center'} width={'100%'}>
                            <Typography variant={'caption'} noWrap={true}>
                                {configStore.store.config.version.version}
                            </Typography>

                            <Typography variant={'caption'} noWrap={true}>
                                {configStore.store.config.version.datetime}
                            </Typography>
                        </Stack>
                    </List.Item>
                </List>
            </Popover>
        </StyledHeader>
    );
};
