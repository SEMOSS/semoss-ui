import { ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { styled, Stack } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { THEME } from '@/constants';
import { LoginPopover } from '../LoginPopover';

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

export interface NavbarProps {
    /** Content to add to the Navbar */
    children?: ReactNode;
}

export const Navbar = (props: NavbarProps) => {
    const { children } = props;

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
        <StyledHeader>
            <StyledHeaderLogo to={'/'}>
                {themeMap.isLogoUrl ? (
                    <StyledHeaderLogoImg src={themeMap.logo} />
                ) : THEME.logo ? (
                    <StyledHeaderLogoImg src={THEME.logo} />
                ) : null}
                {themeMap.name ? themeMap.name : THEME.name}
            </StyledHeaderLogo>
            <Stack flex={1}>{children}</Stack>
            <LoginPopover color="inherit" />
        </StyledHeader>
    );
};
