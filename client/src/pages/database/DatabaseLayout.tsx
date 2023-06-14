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
import { styled } from '@semoss/components';
import { theme } from '@/theme';
import { useAPI } from '@/hooks';
import {
    DatabaseContext,
    DatabaseContextType,
} from '@/contexts/DatabaseContext';
import { LoadingScreen } from '@/components/ui';
import { DatabaseShell } from '@/components/database';

const StyledTabContainer = styled('div', {
    display: 'flex',
    alignItems: 'center',
});

const StyledTab = styled(Link, {
    display: 'inline-flex',
    alignItems: 'center',
    height: theme.space['8'],
    padding: theme.space['2'],
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    borderBottomWidth: theme.borderWidths.thick,
    borderBottomColor: 'transparent',
    '&:hover': {
        backgroundColor: theme.colors['primary-5'],
    },
    variants: {
        selected: {
            true: {
                borderBottomColor: theme.colors['primary-1'],
            },
        },
    },
});

const StyledPage = styled('div', {
    width: '100%',
    padding: theme.space['8'],
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
    borderRadius: theme.radii.default,
    backgroundColor: theme.colors.base,
});

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
                <StyledTabContainer>
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
                </StyledTabContainer>
                <StyledPage>
                    <Outlet />
                </StyledPage>
            </DatabaseShell>
        </DatabaseContext.Provider>
    );
};
