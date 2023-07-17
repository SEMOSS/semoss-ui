import { useEffect, useState, useRef, useReducer } from 'react';

import { useRootStore, usePixel, useSettings } from '../../hooks';
import { LoadingScreen } from '@/components/ui';
import { ProjectLandscapeCard, ProjectTileCard } from '@/components/project';
import { Permissions } from '@/components/database';

import {
    Grid,
    Search,
    Select,
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    styled,
} from '@semoss/ui';

import {
    SpaceDashboardOutlined,
    FormatListBulletedOutlined,
} from '@mui/icons-material';

const StyledContainer = styled('div')({
    display: 'flex',
    width: 'auto',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '24px',
});

const StyledSearchbarContainer = styled('div')({
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: '24px',
});

const StyledSearchbar = styled(Search)({
    width: '80%',
});

const StyledSort = styled(Select)({
    display: 'flex',
    width: '220px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '3px',
    flexShrink: '0',
});

const initialState = {
    projects: [],
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'field': {
            return {
                ...state,
                [action.field]: action.value,
            };
        }
    }
    return state;
};

export interface ProjectInterface {
    project_global: boolean;
    project_id: string;
    project_name: string;
    permission: number;
}

export const ProjectPermissionsPage = () => {
    const { configStore, monolithStore } = useRootStore();
    const { adminMode } = useSettings();

    const [state, dispatch] = useReducer(reducer, initialState);
    const { projects } = state;

    const [view, setView] = useState('tile');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('Name');

    const [selectedProject, setSelectedProject] =
        useState<ProjectInterface>(null);

    // To focus when getting new results
    const searchbarRef = useRef(null);

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
    // const getProjects = useAPI(['getProjects', adminMode]);
    const getProjects = usePixel(`
        MyProjects(metaKeys = ${JSON.stringify(metaKeys)});
    `);

    useEffect(() => {
        // REST call to get all apps
        if (getProjects.status !== 'SUCCESS' || !getProjects.data) {
            return;
        }

        dispatch({
            type: 'field',
            field: 'projects',
            value: getProjects.data,
        });

        setSelectedProject(null);
        searchbarRef.current?.focus();

        () => {
            console.warn('Cleaning up getProjects');
            // setProjects([]);
        };
    }, [getProjects.status, getProjects.data]);

    const formatProjectName = (str) => {
        let i;
        const frags = str.split('_');
        for (i = 0; i < frags.length; i++) {
            frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
        }
        return frags.join(' ');
    };

    // show a loading screen when getProjects is pending
    if (getProjects.status !== 'SUCCESS') {
        return (
            <LoadingScreen.Trigger description="Retrieving project folders" />
        );
    }

    return (
        <StyledContainer>
            {!selectedProject ? (
                <>
                    <Typography variant={'body1'}>
                        Select a project to start
                    </Typography>
                    <StyledSearchbarContainer>
                        <StyledSearchbar
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                            label="Project"
                            size="small"
                            enableEndAdornment={true}
                            ref={searchbarRef}
                        />
                        <StyledSort
                            size={'small'}
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <MenuItem value="Name">Name</MenuItem>
                            <MenuItem value="Date Created">
                                Date Created
                            </MenuItem>
                            <MenuItem value="Views">Views</MenuItem>
                            <MenuItem value="Trending">Trending</MenuItem>
                            <MenuItem value="Upvotes">Upvotes</MenuItem>
                        </StyledSort>

                        <ToggleButtonGroup size={'small'} value={view}>
                            <ToggleButton
                                onClick={(e, v) => setView(v)}
                                value={'tile'}
                            >
                                <SpaceDashboardOutlined />
                            </ToggleButton>
                            <ToggleButton
                                onClick={(e, v) => setView(v)}
                                value={'list'}
                            >
                                <FormatListBulletedOutlined />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </StyledSearchbarContainer>
                    <Grid container spacing={3}>
                        {projects.length
                            ? projects.map((project, i) => {
                                  return (
                                      <Grid
                                          item
                                          key={i}
                                          sm={view === 'list' ? 12 : 12}
                                          md={view === 'list' ? 12 : 6}
                                          lg={view === 'list' ? 12 : 4}
                                          xl={view === 'list' ? 12 : 3}
                                      >
                                          {view === 'list' ? (
                                              <ProjectTileCard
                                                  name={formatProjectName(
                                                      project.project_name,
                                                  )}
                                                  id={project.project_id}
                                                  onClick={(id) =>
                                                      setSelectedProject(
                                                          project,
                                                      )
                                                  }
                                                  description={'description'}
                                              />
                                          ) : (
                                              <ProjectTileCard
                                                  name={formatProjectName(
                                                      project.project_name,
                                                  )}
                                                  id={project.project_id}
                                                  onClick={(id) =>
                                                      setSelectedProject(
                                                          project,
                                                      )
                                                  }
                                                  description={'description'}
                                              />
                                          )}
                                      </Grid>
                                  );
                              })
                            : 'No projects to choose from'}
                    </Grid>
                </>
            ) : (
                <Permissions
                    config={{
                        id: selectedProject.project_id,
                        name: formatProjectName(selectedProject.project_name),
                        global: selectedProject.project_global,
                        permission: selectedProject.permission,
                        // visibility: selectedProject.project_visibility,
                    }}
                ></Permissions>
            )}
        </StyledContainer>
    );
};
