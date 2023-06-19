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
import { styled, Button, Loading } from '@semoss/components';

import { theme } from '@/theme';
import { usePixel } from '@/hooks';
import {
    ImportedDatabaseContext,
    ImportedDatabaseContextType,
} from '@/contexts/ImportedDatabaseContext';
import { LoadingScreen } from '@/components/ui';
import { ImportedDatabaseShell } from '@/components/database/ImportedDatabaseShell';

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
    width: theme.space['full'],
    padding: theme.space['8'],
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
    borderRadius: theme.radii.default,
    backgroundColor: theme.colors.base,
});

const Header = styled('div', {
    height: '100px',
    width: theme.space['full'],
    borderBottom: `1px solid ${theme.colors['grey-5']}`,
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
});

const DatabaseInfo = styled('div', {
    display: 'flex',
    alignItems: 'center',
    width: '75%',
});

const DataBaseInfoContent = styled('div', {
    flex: 1,
    overflow: 'hidden',
});

const DataBaseInfoTop = styled('div', {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: '2rem',
});

const DataBaseInfoTopHeader = styled('h3', {
    marginRight: '1rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.colors['grey-2'],
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: '1.5rem',
    letterSpacing: '0.00937rem',
});

const DatabaseInfoTopButtonWrapper = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    width: '66.66667%',
});

const DatabaseImage = styled('div', {
    height: '3.75rem',
    width: '3.75rem',
    flexShrink: 0,
    overflow: 'hidden',
    marginRight: '1rem',
    borderRadius: '4px',
});
/**
 * Wrap the database routes and add additional funcitonality
 */
export const ImportedDatabaseLayout = () => {
    const { id } = useParams();
    const resolvedPath = useResolvedPath('');
    const location: {
        hash: string;
        key: string;
        pathname: string;
        search: string;
        state: any;
    } = useLocation();

    const getDatabase = usePixel(
        resolvedPath.pathname === location.pathname || !location.state
            ? `OpenDatabase ( database = [ ${JSON.stringify(id)} ] ) ;`
            : '',
    );

    const ImportedDatabaseContextType: ImportedDatabaseContextType = {
        id: id,
        databaseName:
            location.state && location.state.dbName
                ? location.state.dbName
                : getDatabase.status === 'SUCCESS'
                ? getDatabase.data.database_name
                : '',
    };

    // if (getDatabase && getDatabase.status === 'ERROR') {
    //     return <Navigate to="/" state={{ from: location }} replace />;
    // }

    // if (getDatabase.status === 'SUCCESS') {

    // }
    // // get the user's role
    // const getUserAppPermission = useAPI(['getUserAppPermission', id]);

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
    if (getDatabase.status === 'ERROR') {
        return <Navigate to="/catalog" state={{ from: location }} replace />;
    }

    // // show a loading screen when it is pending
    if (
        getDatabase.status !== 'SUCCESS' &&
        resolvedPath.pathname === location.pathname
    ) {
        return (
            <Loading open={true} description="Retrieving Database Details" />
        );
    }

    return (
        <ImportedDatabaseContext.Provider value={ImportedDatabaseContextType}>
            <ImportedDatabaseShell>
                <StyledPage>
                    <Header>
                        <DatabaseInfo>
                            <DatabaseImage></DatabaseImage>
                            <DataBaseInfoContent>
                                <DataBaseInfoTop>
                                    <DataBaseInfoTopHeader>
                                        {
                                            ImportedDatabaseContextType.databaseName
                                        }
                                    </DataBaseInfoTopHeader>
                                </DataBaseInfoTop>
                            </DataBaseInfoContent>
                        </DatabaseInfo>
                        <DatabaseInfoTopButtonWrapper>
                            <Button>Print MetaData</Button>
                            <Button>Export</Button>
                            <Button>Edit Settting</Button>
                        </DatabaseInfoTopButtonWrapper>
                    </Header>
                    <StyledTabContainer>
                        <StyledTab to="" selected={isActive('')}>
                            Details
                        </StyledTab>
                        <StyledTab to="access" selected={isActive('access')}>
                            Access
                        </StyledTab>
                        <StyledTab
                            to="metamodel"
                            selected={isActive('metamodel')}
                        >
                            Metamodel
                        </StyledTab>
                        <StyledTab
                            to="replaceData"
                            selected={isActive('replaceData')}
                        >
                            Replace Data
                        </StyledTab>
                        <StyledTab
                            to="queryData"
                            selected={isActive('queryData')}
                        >
                            Query Data
                        </StyledTab>
                    </StyledTabContainer>
                    <Outlet />
                </StyledPage>
            </ImportedDatabaseShell>
        </ImportedDatabaseContext.Provider>
    );
};
