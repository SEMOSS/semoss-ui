import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import {
    styled,
    Stack,
    Typography,
    Grid,
    Search,
    Card,
    IconButton,
} from '@semoss/ui';
import { OpenInBrowser } from '@mui/icons-material';

import { Page } from '@/components/ui';
import { useRootStore } from '@/hooks';

type MarketplaceAppTypes = 'policy' | 'custom';

type MarketplaceApp = PolicyMarketplaceApp | CustomMarketplaceApp;

interface AbstractMarketplaceApp {
    /** Name of the app */
    name: string;

    /** Description describing the app */
    description: string;

    /** Logo describing the app */
    logo: string;

    /** Tags associated with the app */
    tags: string[];

    /** Type of the app */
    type: MarketplaceAppTypes;

    /** Url of the associated app */
    url: string;

    /** Environment information loaded into the app */
    config: Record<string, unknown>;
}

interface PolicyMarketplaceApp extends AbstractMarketplaceApp {
    type: 'policy';
    config: {
        theme: {
            name: string;
            border: string;
        };
    };
}

interface CustomMarketplaceApp extends AbstractMarketplaceApp {
    type: 'custom';
    config: {
        /**
         * Any key
         */
        [key: string]: unknown;
    };
}

const APPS: MarketplaceApp[] = [
    {
        name: 'Policy Bot 1',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        logo: '',
        tags: ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4'],
        type: 'policy',
        url: `../../../apps/policy/client/dist/`,
        config: {
            theme: {
                name: 'Policy Bot 1',
                border: '5px solid green',
            },
        },
    },
    {
        name: 'Policy Bot 2',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        logo: '',
        tags: ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4'],
        type: 'policy',
        url: `../../../apps/policy/client/dist/`,
        config: {
            theme: {
                name: 'Policy Bot 2',
                border: '5px solid blue',
            },
        },
    },
];

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

const StyledFitler = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledFilterSearch = styled(Search)(({ theme }) => ({
    width: '100%',
}));

/**
 * Library page that allows a user to see all the currently installed apps
 */
export const HomePage = observer((): JSX.Element => {
    const { workspaceStore } = useRootStore();

    // navigation
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const searchedApps = useMemo(() => {
        if (!search) {
            return APPS;
        }

        const cleaned = search.toLowerCase();

        return APPS.filter(
            (a) =>
                a.name.toLowerCase().indexOf(cleaned) > -1 ||
                a.description.toLowerCase().indexOf(cleaned) > -1,
        );
    }, [search]);

    /**
     * Open a new app
     *
     * @param app - Marketplace app that will be open
     */
    const openNewApp = async (a: MarketplaceApp) => {
        // open the app
        const app = await workspaceStore.openNewApp(
            a.url,
            {
                name: a.name,
            },
            a.config,
        );

        // navigate to it
        if (app) {
            navigate(`app`);
        }
    };

    return (
        <Page
            header={
                <Stack
                    direction="row"
                    alignItems={'center'}
                    justifyContent={'space-between'}
                    spacing={4}
                >
                    <Typography variant={'h4'}>App Library</Typography>
                </Stack>
            }
        >
            <StyledContainer>
                <StyledFitler>
                    <StyledFilterSearch
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        label="Apps"
                        size="small"
                    />
                </StyledFitler>
                {searchedApps.length ? (
                    <Grid container spacing={3}>
                        {searchedApps.map((app, appIdx) => {
                            return (
                                <Grid
                                    key={appIdx}
                                    item
                                    sm={12}
                                    md={6}
                                    lg={4}
                                    xl={4}
                                >
                                    <Card>
                                        <Card.Header title={app.name} />
                                        <Card.Content>
                                            {app.description}
                                        </Card.Content>
                                        <Card.Actions>
                                            <IconButton
                                                aria-label="Open App"
                                                onClick={() => openNewApp(app)}
                                            >
                                                <OpenInBrowser />
                                            </IconButton>
                                        </Card.Actions>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                ) : null}
            </StyledContainer>
        </Page>
    );
});
