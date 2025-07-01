import React, { useState } from 'react';
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
} from '@semoss/ui';

import { useRootStore } from '@/hooks';

const StyledTypography = styled(Typography)(({ theme }) => ({
    maxWidth: theme.spacing(15),
}));

interface LoginPopoverProps {
    /** Content to popover */
    children?: React.ReactNode;
}

export const LoginPopover: React.FC<LoginPopoverProps> = (props) => {
    const { children } = props;

    const { configStore } = useRootStore();
    const [popoverAnchorEle, setPopoverAnchorEl] = useState<HTMLElement | null>(
        null,
    );

    // track if the popover is open
    const isPopoverOpen = Boolean(popoverAnchorEle);
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        setPopoverAnchorEl(e.currentTarget);
    };

    return (
        <>
            {children ? (
                <span
                    onClick={handleClick}
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    {children}
                </span>
            ) : (
                <IconButton
                    size={'small'}
                    color={'default'}
                    onClick={(e) => {
                        setPopoverAnchorEl(e.currentTarget);
                    }}
                >
                    <AccountCircle fontSize="inherit" />
                </IconButton>
            )}

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
        </>
    );
};
