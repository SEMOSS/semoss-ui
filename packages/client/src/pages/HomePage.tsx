import { useEffect, useState, useReducer } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Avatar,
    Collapse,
    List,
    Stack,
    Typography,
    Button,
    Grid,
    styled,
    Divider,
    IconButton,
    ToggleButtonGroup,
    ToggleButton,
    ToggleTabsGroup,
    TextField,
} from '@semoss/ui';

import { useNavigate } from 'react-router-dom';

import { usePixel, useRootStore } from '@/hooks';
import { Page } from '@/components/ui';
import { AppMetadata, AppTileCard, AddAppModal } from '@/components/app';
import { WelcomeModal } from '@/components/welcome';
import {
    ExpandLess,
    ExpandMore,
    FormatListBulletedOutlined,
    SpaceDashboardOutlined,
    Search,
    SearchOff,
} from '@mui/icons-material';

import { Filterbox } from '@/components/ui';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

const StyledContentContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
}));

type MODE = 'Mine' | 'Discoverable';
type VIEW = 'list' | 'tile';

// http://localhost:9090/vha-supply/api/project-83ce0cc4-7c48-4db7-b26b-88ef723026d7/projectImage/download

/**
 * Landing page
 */
export const HomePage = observer((): JSX.Element => {
    const { configStore } = useRootStore();
    const navigate = useNavigate();

    const [search, setSearch] = useState<string>('');
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>({});
    const [mode, setMode] = useState<MODE>('Mine');
    const [view, setView] = useState<VIEW>('tile');
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
                k.display_options === 'multi-typeahead'
            );
        },
    );

    // get metakeys to the ones we want
    const metaKeys = projectMetaKeys.map((k) => {
        return k.metakey;
    });

    // get the projects
    const myApps = usePixel<AppMetadata[]>(
        `MyProjects(metaKeys = ${JSON.stringify(
            metaKeys,
        )}, metaFilters=[${JSON.stringify(
            metaFilters,
        )}], filterWord=["${search}"], onlyPortals=[true]);`,
    );

    // MyEngines(
    // metaKeys = ["tag","domain","description"] ,
    // metaFilters = [ {"tag":["GPT"],"domain":["chat.openai","generic"]} ] ,
    // filterWord=[""],
    // userT = [true],
    // engineTypes=['MODEL'],
    // offset=[0],
    // limit=[15]) ;

    /**
     * Close the add app modeal
     *
     * appId - app id if it is set
     */
    const closeAddAppModal = (appId?: string) => {
        // close the modal
        setAddAppModal(false);

        // refresh the list or navigate to the app
        if (!appId) {
            myApps.refresh();
        } else {
            navigate(`app/${appId}`);
        }
    };

    return (
        <Page
            header={
                <Stack>
                    <div style={{ height: '24px' }}></div>
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        spacing={4}
                    >
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            spacing={2}
                        >
                            <Typography
                                data-tour="app-library-title"
                                variant={'h4'}
                            >
                                Apps
                            </Typography>
                        </Stack>
                        <Button
                            size={'large'}
                            variant={'contained'}
                            onClick={() => {
                                if (process.env.NODE_ENV == 'development') {
                                    navigate('/app/new');
                                } else {
                                    setAddAppModal(true);
                                }
                            }}
                            aria-label={`Open the App Model`}
                        >
                            Add App
                        </Button>
                    </Stack>
                </Stack>
            }
        >
            <StyledContainer>
                <div>
                    <Filterbox
                        type={'APP'}
                        onChange={(filters: Record<string, unknown>) => {
                            setMetaFilters(filters);
                        }}
                    />
                </div>
                <StyledContentContainer>
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'space-between'}
                    >
                        <ToggleTabsGroup
                            value={mode}
                            onChange={(e, v) => setMode(v as MODE)}
                            aria-label="basic tabs example"
                        >
                            <ToggleTabsGroup.Item
                                label="My apps"
                                value={'Mine'}
                            />
                            <ToggleTabsGroup.Item
                                label="Discoverable apps"
                                disabled={true}
                                value={'Discoverable'}
                            />
                        </ToggleTabsGroup>
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            justifyContent={'flex-end'}
                        >
                            <Collapse orientation="horizontal" in={showSearch}>
                                <TextField
                                    placeholder="Search"
                                    size="small"
                                    sx={{
                                        width: '200px',
                                    }}
                                    value={search}
                                    variant="outlined"
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </Collapse>
                            <IconButton
                                color="default"
                                size="small"
                                onClick={() => {
                                    setShowSearch(!showSearch);
                                    setSearch('');
                                }}
                            >
                                {showSearch ? (
                                    <SearchOff fontSize="medium" />
                                ) : (
                                    <Search fontSize="medium" />
                                )}
                            </IconButton>
                            <ToggleButtonGroup
                                size={'small'}
                                value={view}
                                color="primary"
                            >
                                <ToggleButton
                                    color="primary"
                                    onClick={(e, v) => setView(v as VIEW)}
                                    value={'tile'}
                                    aria-label={'Tile View'}
                                >
                                    <SpaceDashboardOutlined />
                                </ToggleButton>

                                <ToggleButton
                                    color="primary"
                                    onClick={(e, v) => setView(v)}
                                    value={'list'}
                                    aria-label={'List View'}
                                >
                                    <FormatListBulletedOutlined />
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Stack>
                    </Stack>
                    <Grid container columnSpacing={3} rowSpacing={3}>
                        <Grid item sm={12} md={4} lg={3} xl={2}>
                            <AppTileCard
                                app={{
                                    project_id: '',
                                    project_name: 'BI',
                                    project_type: '',
                                    project_cost: '',
                                    project_global: '',
                                    project_catalog_name: '',
                                    project_created_by: 'SYSTEM',
                                    project_created_by_type: '',
                                    project_date_created: '',
                                    project_has_portal: false,
                                    project_portal_name: '',
                                    project_portal_published_date: '',
                                    project_published_user: '',
                                    project_published_user_type: '',
                                    project_reactors_compiled_date: '',
                                    project_reactors_compiled_user: '',
                                    project_reactors_compiled_user_type: '',
                                    project_favorite: '',
                                    user_permission: '',
                                    group_permission: '',
                                    tag: [],
                                    description:
                                        'Develop dashboards and visualizations to view data',
                                }}
                                background="#BADEFF"
                                href="../../../"
                            />
                        </Grid>
                        <Grid item sm={12} md={4} lg={3} xl={2}>
                            <AppTileCard
                                app={{
                                    project_id: '',
                                    project_name: 'Terminal',
                                    project_type: '',
                                    project_cost: '',
                                    project_global: '',
                                    project_catalog_name: '',
                                    project_created_by: 'SYSTEM',
                                    project_created_by_type: '',
                                    project_date_created: '',
                                    project_has_portal: false,
                                    project_portal_name: '',
                                    project_portal_published_date: '',
                                    project_published_user: '',
                                    project_published_user_type: '',
                                    project_reactors_compiled_date: '',
                                    project_reactors_compiled_user: '',
                                    project_reactors_compiled_user_type: '',
                                    project_favorite: '',
                                    user_permission: '',
                                    group_permission: '',
                                    tag: [],
                                    description:
                                        'Execute commands and see a response',
                                }}
                                background="#BADEFF"
                                href="../../../#!/embed-terminal"
                            />
                        </Grid>
                    </Grid>

                    {myApps.status === 'SUCCESS' && myApps.data.length > 0 ? (
                        <Grid container columnSpacing={3} rowSpacing={3}>
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
                                            href={`#/app/${app.project_id}`}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    ) : null}
                </StyledContentContainer>
            </StyledContainer>
            <AddAppModal
                open={addAppModal}
                handleClose={(appId) => closeAddAppModal(appId)}
            />
            <WelcomeModal />
        </Page>
    );
});
