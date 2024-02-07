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
} from '@/component-library';

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
    height: '24px',
    display: 'flex',
    justifyContent: 'flex-end',
}));

const StyledId = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.dark,
}));

const IdContainer = styled('span')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
}));

const StyledAdminContainer = styled(Paper)(({ theme }) => ({
    position: 'absolute',
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
                        {matchedRoute.path ? (
                            <StyledHeader>
                                <Breadcrumbs separator="/">
                                    <StyledLink to={'.'}>Settings</StyledLink>
                                    {matchedRoute.history.map((link, i) => {
                                        return (
                                            <StyledLink
                                                to={link.replace('<id>', id)}
                                                key={i + link}
                                                state={...state}
                                            >
                                                {link.includes('<id>')
                                                    ? id
                                                    : matchedRoute.title}
                                            </StyledLink>
                                        );
                                    })}
                                </Breadcrumbs>
                                {configStore.store.user.admin ? (
                                    <StyledAdminContainer>
                                        <Tooltip
                                            title={
                                                !adminMode
                                                    ? 'Enable Admin Mode'
                                                    : 'Disable Admin Mode'
                                            }
                                        >
                                            <div>
                                                <ToggleButton
                                                    size="small"
                                                    color={'primary'}
                                                    value={'adminMode'}
                                                    selected={adminMode}
                                                    onClick={() =>
                                                        setAdminMode(!adminMode)
                                                    }
                                                >
                                                    <AdminPanelSettingsOutlined />
                                                </ToggleButton>
                                            </div>
                                        </Tooltip>
                                    </StyledAdminContainer>
                                ) : null}
                            </StyledHeader>
                        ) : configStore.store.user.admin ? (
                            <StyledAdminHeader>
                                <StyledAdminContainer>
                                    <Tooltip
                                        title={
                                            !adminMode
                                                ? 'Enable Admin Mode'
                                                : 'Disable Admin Mode'
                                        }
                                    >
                                        <div>
                                            <ToggleButton
                                                size="small"
                                                color={'primary'}
                                                value={'adminMode'}
                                                selected={adminMode}
                                                onClick={() =>
                                                    setAdminMode(!adminMode)
                                                }
                                            >
                                                <AdminPanelSettingsOutlined />
                                            </ToggleButton>
                                        </div>
                                    </Tooltip>
                                </StyledAdminContainer>
                            </StyledAdminHeader>
                        ) : null}
                        <Typography variant="h4">
                            {matchedRoute.history.length < 2
                                ? matchedRoute.title
                                : state
                                ? state.name
                                : matchedRoute.title}
                        </Typography>
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
