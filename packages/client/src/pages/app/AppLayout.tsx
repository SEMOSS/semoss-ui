import { observer } from 'mobx-react-lite';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { styled, Stack, Icon, Chip } from '@semoss/ui';

import { AccountCircle } from '@mui/icons-material';
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
    position: 'relative',
    paddingTop: NAV_HEIGHT,
    height: '100%',
    width: '100%',
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
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="28"
                        viewBox="0 0 24 28"
                        fill="none"
                    >
                        <path
                            d="M3.97336 10.9854V15.5672H6.53422V10.9854C8.81394 10.4185 10.5076 8.37632 10.5076 5.94985C10.5076 3.08761 8.15077 0.758606 5.25322 0.758606C2.35568 0.758606 0 3.08761 0 5.94985C0 8.37632 1.69364 10.4185 3.97336 10.9854Z"
                            fill="white"
                        />
                        <path
                            d="M12.4517 16.3816L9.15403 18.5739C8.19158 17.5209 6.80062 16.8577 5.25436 16.8577C2.35681 16.8577 0 19.1867 0 22.0501C0 24.9123 2.35681 27.2413 5.25322 27.2413C8.14964 27.2413 10.5064 24.9123 10.5064 22.0501C10.5064 21.6277 10.4543 21.2177 10.3568 20.8234L13.8892 18.4753L12.4517 16.3816Z"
                            fill="white"
                        />
                        <path
                            d="M18.7469 8.72565C17.3401 8.72565 16.0614 9.27681 15.1171 10.1697L11.4917 8.01093L10.1699 10.1786L13.7522 12.3116C13.5855 12.8179 13.4937 13.3568 13.4937 13.9169C13.4937 16.7791 15.8505 19.1081 18.7469 19.1081C21.6434 19.1081 24.0002 16.7791 24.0002 13.9169C24.0002 11.0546 21.6434 8.72565 18.7469 8.72565Z"
                            fill="white"
                        />
                    </svg>
                    SEMOSS
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
                                key={a.id}
                                variant="filled"
                                label={a.display.name}
                                clickable={true}
                                color="primary"
                                onClick={() => selectApp(a.id)}
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
