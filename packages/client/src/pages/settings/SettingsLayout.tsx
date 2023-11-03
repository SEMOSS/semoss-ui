import { useEffect, useMemo, useState } from 'react';
import { ContentCopyOutlined } from '@mui/icons-material';
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
    useNotification,
    IconButton,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { SettingsContext } from '@/contexts';
import { Page } from '@/components/ui/';
import { SETTINGS_ROUTES } from './settings.constants';
import { observer } from 'mobx-react-lite';
import { AdminPanelSettingsOutlined } from '@mui/icons-material';
import { spawnSync } from 'child_process';

const IdSpan = styled('span')(({ theme }) => ({
    marginRight: '3px',
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

const StyledLink = {
    textDecoration: 'none',
    color: 'inherit',
};
export const SettingsLayout = observer(() => {
    const { configStore } = useRootStore();
    const { id } = useParams();
    const { pathname, state } = useLocation();
    const notification = useNotification();

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

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied id',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy id',
            });
        }
    };

    if (!matchedRoute) {
        return null;
    }

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
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Breadcrumbs separator="/">
                                    <Link to={'.'} style={StyledLink}>
                                        Settings
                                    </Link>
                                    {matchedRoute.history.map((link, i) => {
                                        return (
                                            <Link
                                                style={StyledLink}
                                                to={link.replace('<id>', id)}
                                                key={i + link}
                                                state={...state}
                                            >
                                                {link.includes('<id>') ? (
                                                    <IdContainer>
                                                        <IdSpan>{id}</IdSpan>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                copy(id);
                                                            }}
                                                        >
                                                            <Tooltip
                                                                title={`Copy ID`}
                                                            >
                                                                <ContentCopyOutlined fontSize="inherit" />
                                                            </Tooltip>
                                                        </IconButton>
                                                    </IdContainer>
                                                ) : (
                                                    matchedRoute.title
                                                )}
                                            </Link>
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
                            </div>
                        ) : (
                            <div
                                style={{
                                    height: '24px',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                }}
                            >
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
                            </div>
                        )}
                        <Typography variant="h4">
                            {matchedRoute.history.length < 2
                                ? matchedRoute.title
                                : state
                                ? state.name
                                : matchedRoute.title}
                        </Typography>
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
