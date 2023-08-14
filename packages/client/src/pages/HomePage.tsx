import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Stack, Typography, Search, Button, Grid } from '@semoss/ui';

import { useNavigate } from 'react-router-dom';

import { usePixel, useRootStore } from '@/hooks';
import { Page } from '@/components/ui';
import { App, AppTileCard, AddApp } from '@/components/app';

/**
 * Landing page
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
    const myApps = usePixel<App[]>(
        `MyProjects(metaKeys = ${JSON.stringify(
            metaKeys,
        )}, filterWord=["${search}"], onlyPortals=[true]);`,
    );

    /**
     * Open a new app
     *
     * @param app - Marketplace app that will be open
     */
    const openNewApp = async (a: App) => {
        // open the app
        const app = await workspaceStore.openNewApp(a.project_id, {
            name: a.project_name,
        });

        // navigate to it
        if (app) {
            navigate(`app`);
        }
    };

    /**
     * Close the  app modeal
     */
    const closeAppModal = () => {
        // close the modal
        setAddAppModal(false);

        // refresh the list
        myApps.refresh();
    };

    return (
        <Page
            header={
                <Stack
                    direction="row"
                    alignItems={'center'}
                    justifyContent={'space-between'}
                    spacing={4}
                    sx={{
                        paddingLeft: '24px',
                        paddingRight: '24px',
                    }}
                >
                    <Stack direction="row" alignItems={'center'} spacing={2}>
                        <Typography variant={'h4'}>App Library</Typography>
                        <Search
                            size={'small'}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                        />
                    </Stack>
                    <Button
                        size={'large'}
                        variant={'contained'}
                        onClick={() => {
                            setAddAppModal(true);
                        }}
                        aria-label={`Open the App Model`}
                    >
                        Add App
                    </Button>
                </Stack>
            }
        >
            <Stack direction={'column'} height={'100%'}>
                {myApps.status === 'SUCCESS' && myApps.data.length > 0 ? (
                    <Grid container spacing={3}>
                        {myApps.data.map((app) => {
                            return (
                                <Grid
                                    item
                                    key={app.project_id}
                                    sm={12}
                                    md={4}
                                    lg={3}
                                    xl={2}
                                >
                                    <AppTileCard
                                        app={app}
                                        onAction={(app) => openNewApp(app)}
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                ) : null}
            </Stack>
            <AddApp open={addAppModal} onClose={() => closeAppModal()} />
        </Page>
    );
});
