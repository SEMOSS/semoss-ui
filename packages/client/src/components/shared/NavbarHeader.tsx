import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { MenuRounded } from '@mui/icons-material';

import { IconButton, Stack, styled, Typography } from '@semoss/ui';

import { usePage, useRootStore } from '@/hooks';

const StyledNavbarHeader = styled(Stack)(({ theme }) => ({
    position: 'relative',
    background: 'transparent',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    zIndex: 0,
}));

const StyledNavbarHeaderLink = styled(Link)(({ theme }) => ({
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

interface NavbarHeaderProps {
    /**
     * Display custom branding
     */
    logo?: React.ReactNode | null;
}
export const NavbarHeader = observer((props: NavbarHeaderProps) => {
    const { logo } = props;
    const { page } = usePage();
    const { configStore } = useRootStore();

    return !page.sidebar.pinned ? (
        <StyledNavbarHeader
            direction={'row'}
            alignItems={'center'}
            justifyContent={'flex-start'}
            // onMouseOver={() => page.openSidebar()}
            spacing={2}
        >
            <IconButton size="small" onClick={() => page.openSidebar()}>
                <MenuRounded fontSize="medium" />
            </IconButton>

            {!logo ? (
                <StyledNavbarHeaderLink to={'/'} aria-label={'Go Home'}>
                    {configStore.theme.logo ? (
                        <img src={configStore.theme.logo} />
                    ) : null}
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {configStore.theme.name}
                    </Typography>
                </StyledNavbarHeaderLink>
            ) : (
                logo
            )}
        </StyledNavbarHeader>
    ) : (
        <></>
    );
});
