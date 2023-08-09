import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import {
    Button,
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
import { AddApp } from '@/components/app';
import { useRootStore, usePixel } from '@/hooks';

type MarketplaceApp = {
    project_id: string;
    project_name: string;
    project_type: string;
    project_cost: string;
    project_global: string;
    project_catalog_name: string;
    project_created_by: string;
    project_created_by_type: string;
    project_date_created: string;
    project_has_portal?: boolean;
    project_portal_name?: string;
    project_portal_published_date?: string;
    project_published_user?: string;
    project_published_user_type?: string;
    project_reactors_compiled_date?: string;
    project_reactors_compiled_user?: string;
    project_reactors_compiled_user_type?: string;
    project_favorite?: string;
    user_permission?: string;
    group_permission?: string;
};

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
    const { workspaceStore, configStore } = useRootStore();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [addAppModal, setAddAppModal] = useState<boolean>(false);

    // get a list of the keys
    const projectMetaKeys = configStore.store.config.projectMetaKeys.filter(
        (k) => {
            return (
                k.display_options === 'single-checklist' ||
                k.display_options === 'multi-checklist' ||
                k.display_options === 'single-select' ||
                k.display_options === 'multi-select' ||
                k.display_options === 'single-typeahead' ||
                k.display_options === 'multi-typeahead' ||
                k.display_options === 'textarea'
            );
        },
    );

    // get metakeys to the ones we want
    const metaKeys = projectMetaKeys.map((k) => {
        return k.metakey;
    });

    // get the projects
    const myApps = usePixel<MarketplaceApp[]>(
        `MyProjects(metaKeys = ${JSON.stringify(
            metaKeys,
        )}, filterWord=["${search}"], onlyPortals=[true]);`,
    );

    /**
     * Open a new app
     *
     * @param app - Marketplace app that will be open
     */
    const openNewApp = async (a: MarketplaceApp) => {
        // open the app
        const app = await workspaceStore.openNewApp(a.project_id, {
            name: a.project_name,
        });

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
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            setAddAppModal(true);
                        }}
                    >
                        Add
                    </Button>
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
                {myApps.status === 'SUCCESS' && myApps.data.length > 0 ? (
                    <Grid container spacing={3}>
                        {myApps.data.map((app) => {
                            // ignore ones wihtout a portal
                            if (!app.project_has_portal) {
                                return null;
                            }

                            return (
                                <Grid
                                    key={app.project_id}
                                    item
                                    sm={12}
                                    md={6}
                                    lg={4}
                                    xl={4}
                                >
                                    <Card>
                                        <Card.Header title={app.project_name} />
                                        <Card.Content>&nbsp;</Card.Content>
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
            <AddApp open={addAppModal} />
        </Page>
    );
});
