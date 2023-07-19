import { useCallback } from 'react';
import {
    useParams,
    useLocation,
    useResolvedPath,
    Outlet,
    Navigate,
    Link,
    matchPath,
} from 'react-router-dom';
import { styled, Stack } from '@semoss/ui';
import { useAPI } from '@/hooks';

import {
    DatabaseContext,
    DatabaseContextType,
} from '@/contexts/DatabaseContext';

import { LoadingScreen } from '@/components/ui';
import { DatabaseShell } from '@/components/database';

const StyledTab = styled(Link, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if the tab is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    ...theme.typography.button,
    display: 'inline-flex',
    alignItems: 'center',
    height: theme.spacing(4),
    padding: theme.spacing(1),
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: selected ? theme.palette.primary.main : 'transparent',
    cursor: 'pointer',
    textDecoration: 'none',
    color: theme.palette.text.primary,
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const StyledDocument = styled('div')(({ theme }) => ({
    width: '100%',
    padding: theme.spacing(4),
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
}));

/**
 * Wrap the database routes and add additional funcitonality
 */
export const DatabaseLayout = () => {
    const { id } = useParams();
    const resolvedPath = useResolvedPath('');
    const location = useLocation();

    // get the user's role
    const getUserAppPermission = useAPI(['getUserAppPermission', id]);

    /**
     * Check if a path is active
     * @param path - path to check against
     * @returns true if the path is active
     */
    const isActive = useCallback(
        (path: string) => {
            return !!matchPath(
                `${resolvedPath.pathname}/${path}`,
                location.pathname,
            );
        },
        [resolvedPath, location],
    );

    // if the database isn't found, navigate to the Home Page
    if (!id || getUserAppPermission.status === 'ERROR') {
        return <Navigate to="/catalog" replace />;
    }

    // show a loading screen when it is pending
    if (getUserAppPermission.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Checking Access" />;
    }

    const databaseContextType: DatabaseContextType = {
        id: id,
        role: getUserAppPermission.data.permission,
    };

    return (
        <DatabaseContext.Provider value={databaseContextType}>
            <DatabaseShell>
                <Stack direction={'row'} alignItems={'center'}>
                    <StyledTab to="" selected={isActive('')}>
                        Home
                    </StyledTab>
                    <StyledTab to="metadata" selected={isActive('metadata')}>
                        Metadata
                    </StyledTab>
                    {(databaseContextType.role === 'EDITOR' ||
                        databaseContextType.role === 'OWNER') && (
                        <StyledTab
                            to="settings"
                            selected={isActive('settings')}
                        >
                            Settings
                        </StyledTab>
                    )}
                    {(databaseContextType.role === 'EDITOR' ||
                        databaseContextType.role === 'OWNER') && (
                        <StyledTab to="replace" selected={isActive('replace')}>
                            Replace Data
                        </StyledTab>
                    )}
                    {(databaseContextType.role === 'EDITOR' ||
                        databaseContextType.role === 'OWNER') && (
                        <StyledTab to="query" selected={isActive('query')}>
                            Query Data
                        </StyledTab>
                    )}
                    {(databaseContextType.role === 'EDITOR' ||
                        databaseContextType.role === 'OWNER') && (
                        <StyledTab to="update" selected={isActive('update')}>
                            Update SMSS
                        </StyledTab>
                    )}
                </Stack>
                <StyledDocument>
                    <Outlet />
                </StyledDocument>
            </DatabaseShell>
        </DatabaseContext.Provider>
    );
};
