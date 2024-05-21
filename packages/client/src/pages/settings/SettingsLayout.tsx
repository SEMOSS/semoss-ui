import { useEffect, useMemo, useState } from 'react';
import {
    Outlet,
    Link,
    useLocation,
    matchPath,
    useParams,
} from 'react-router-dom';
import {
    styled,
    Typography,
    Breadcrumbs,
    Stack,
    ToggleButton,
    Tooltip,
    Paper,
    IconButton,
    Chip,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { SettingsContext } from '@/contexts';
import { Page } from '@/components/ui/';
import { SETTINGS_ROUTES } from './settings.constants';
import { observer } from 'mobx-react-lite';
import {
    AdminPanelSettingsOutlined,
    ContentCopyOutlined,
} from '@mui/icons-material';

const StyledHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledAdminHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const StyledId = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.dark,
}));

const StyledChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'adminMode',
})<{ adminMode: boolean }>(({ theme, adminMode }) => ({
    backgroundColor: `${
        adminMode ? 'rgba(46, 125, 50, .15)' : theme.palette.success
    }`,
    '&&:hover': {
        backgroundColor: `${
            adminMode ? 'rgba(46, 125, 50, .25)' : theme.palette.grey[300]
        }`,
    },
}));

const IdContainer = styled('span')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
}));

const StyledAdminContainer = styled('div')(({ theme }) => ({
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 1,
}));

const StyledLink = styled(Link)(({ theme }) => ({
    textDecoration: 'none',
    color: 'inherit',
}));

export const SettingsLayout = observer(() => {
    const { configStore } = useRootStore();
    const { id } = useParams();
    const { pathname, state } = useLocation();

    // track the active breadcrumbs
    const [adminMode, setAdminMode] = useState(false);

    // if the user is not an admin turn it off
    useEffect(() => {
        if (!configStore.store.user.admin) {
            setAdminMode(false);
        }
    }, [configStore.store.user.admin]);

    const matchedRoute = useMemo(() => {
        for (const r of SETTINGS_ROUTES) {
            if (matchPath(`/settings/${r.path}`, pathname)) {
                return r;
            }
        }

        return null;
    }, [pathname]);

    if (!matchedRoute) {
        return null;
    }

    /**
     * Copy text and add it to the clipboard
     * @param text - text to copy
     */
    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <SettingsContext.Provider
            value={{
                adminMode: adminMode,
            }}
        >
            <Page
                header={
                    <Stack>
                        {matchedRoute.path && (
                            <StyledHeader>
                                <Breadcrumbs separator="/">
                                    <StyledLink to={'.'}>Settings</StyledLink>
                                    {matchedRoute.history.map((link, i) => {
                                        return (
                                            <StyledLink
                                                to={link.replace('<id>', id)}
                                                key={i + link}
                                                state={{ ...state }}
                                            >
                                                {link.includes('<id>')
                                                    ? id
                                                    : matchedRoute.title}
                                            </StyledLink>
                                        );
                                    })}
                                </Breadcrumbs>
                            </StyledHeader>
                        )}
                        <StyledAdminContainer>
                            <StyledAdminHeader>
                                <Typography variant="h4">
                                    {matchedRoute.history.length < 2
                                        ? matchedRoute.title
                                        : state
                                        ? state.name
                                        : matchedRoute.title}
                                </Typography>
                                {configStore.store.user.admin && (
                                    <StyledChip
                                        adminMode={adminMode}
                                        size="medium"
                                        clickable
                                        icon={
                                            <AdminPanelSettingsOutlined
                                                color={
                                                    adminMode
                                                        ? 'success'
                                                        : 'disabled'
                                                }
                                            />
                                        }
                                        label={
                                            adminMode ? 'Admin On' : 'Admin Off'
                                        }
                                        onClick={() => setAdminMode(!adminMode)}
                                    />
                                )}
                            </StyledAdminHeader>
                        </StyledAdminContainer>
                        {id ? (
                            <IdContainer>
                                <StyledId variant={'subtitle2'}>{id}</StyledId>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        copy(id);
                                    }}
                                >
                                    <Tooltip title={`Copy ID`}>
                                        <ContentCopyOutlined fontSize="inherit" />
                                    </Tooltip>
                                </IconButton>
                            </IdContainer>
                        ) : null}
                        <Typography variant="body1">
                            {!adminMode || matchedRoute.path !== ''
                                ? matchedRoute.description
                                : matchedRoute.adminDescription}
                        </Typography>
                    </Stack>
                }
            >
                <Outlet />
            </Page>
        </SettingsContext.Provider>
    );
});
