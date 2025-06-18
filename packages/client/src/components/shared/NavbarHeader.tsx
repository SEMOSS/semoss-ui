import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { IconButton, Stack, styled, Typography } from '@semoss/ui';

import { usePage, useRootStore } from '@/hooks';
import { MenuRounded } from '@mui/icons-material';
import { Logo } from '@/assets/img/Logo';
import { THEME } from '@/constants';

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
    gap: theme.spacing(2),
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
export const NavbarHeader = (props: NavbarHeaderProps) => {
    const { logo } = props;
    const { page } = usePage();
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
    return !page.sidebar.pinned ? (
        <StyledNavbarHeader
            direction={'row'}
            alignItems={'center'}
            justifyContent={'flex-start'}
            onMouseOver={() => page.openSidebar()}
        >
            <IconButton size="small" onClick={() => page.openSidebar()}>
                <MenuRounded fontSize="medium" />
            </IconButton>

            {!logo ? (
                <StyledNavbarHeaderLink to={'/'} aria-label={'Go Home'}>
                    <Logo />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {themeMap.name ? themeMap.name : THEME.name}
                    </Typography>
                </StyledNavbarHeaderLink>
            ) : (
                logo
            )}
        </StyledNavbarHeader>
    ) : (
        <></>
    );
};
