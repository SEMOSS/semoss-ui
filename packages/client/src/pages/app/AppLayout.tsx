import { observer } from 'mobx-react-lite';
import { Outlet, Link } from 'react-router-dom';
import { styled, Stack, Icon, Chip } from '@semoss/ui';
import { AccountCircle } from '@mui/icons-material';

import { THEME } from '@/constants';
import { useRootStore } from '@/hooks';

const NAV_HEIGHT = '48px';
const NAV_ICON_WIDTH = '56px';

// background: var(--light-text-primary, rgba(0, 0, 0, 0.87));

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
    gap: theme.spacing(1),
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

const StyledHeaderLogout = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'inherit',
    textDecoration: 'none',
    height: NAV_HEIGHT,
    width: NAV_ICON_WIDTH,
    cursor: 'pointer',
    backgroundColor: theme.palette.common.black,
    '&:hover': {
        backgroundColor: `rgba(255, 255, 255, ${theme.palette.action.hoverOpacity})`,
    },
}));

const StyledContent = styled('div')(() => ({
    position: 'absolute',
    paddingTop: NAV_HEIGHT,
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

/**
 * Layout for the app
 */
export const AppLayout = observer(() => {
    const { workspaceStore } = useRootStore();

    /**
     * Select an app
     */
    const selectApp = (id: string) => {
        // open the app
        workspaceStore.selectApp(id);
    };

    return (
        <>
            <StyledHeader>
                <StyledHeaderLogo to={'/'}>
                    {THEME.logo ? <img src={THEME.logo} /> : null}
                    {THEME.name}
                </StyledHeaderLogo>
                <Stack
                    flex={1}
                    direction={'row'}
                    alignItems={'center'}
                    gap={1}
                    flexWrap={'wrap'}
                >
                    {workspaceStore.appList.map((a) => {
                        return (
                            <Chip
                                key={a.insightId}
                                variant="filled"
                                label={a.options.name}
                                clickable={true}
                                onClick={() => selectApp(a.insightId)}
                            />
                        );
                    })}
                </Stack>
                <StyledHeaderLogout>
                    <Icon>
                        <AccountCircle />
                    </Icon>
                </StyledHeaderLogout>
            </StyledHeader>
            <StyledContent>
                <Outlet />
            </StyledContent>
        </>
    );
});
