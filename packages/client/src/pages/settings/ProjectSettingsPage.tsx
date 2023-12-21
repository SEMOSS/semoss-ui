import { useEffect, useState, useRef, useReducer } from 'react';

import { useSettings, useAPI } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import { ProjectTileCard } from '@/components/app';

import {
    Grid,
    Search,
    Select,
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
    styled,
    Backdrop,
    CircularProgress,
    Stack,
    Typography,
} from '@semoss/ui';

import {
    SpaceDashboardOutlined,
    FormatListBulletedOutlined,
} from '@mui/icons-material';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: 'auto',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledSearch = styled(Search)({
    width: '80%',
});

const StyledSearchbarContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledSort = styled(Select)({
    width: '20%',
});

const StyledBackdrop = styled(Backdrop)({
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 1501,
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

export const ProjectSettingsPage = () => {
    const { adminMode } = useSettings();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { projects } = state;

    const [view, setView] = useState('tile');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('Name');
    const [canCollect, setCanCollect] = useState(true);
    const [offset, setOffset] = useState(0);

    //** amount of items to be loaded */
    const limit = 15;

    // To focus when getting new results
    const searchbarRef = useRef(null);

    const getProjects = useAPI([
        'getProjects',
        adminMode,
        search,
        offset,
        limit,
    ]);

    const formatProjectName = (str) => {
        let i;
        const frags = str.split('_');
        for (i = 0; i < frags.length; i++) {
            frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
        }
        return frags.join(' ');
    };

    //** reset dataMode if adminMode is toggled */
    useEffect(() => {
        setOffset(0);
        dispatch({
            type: 'field',
            field: 'projects',
            value: [],
        });
    }, [adminMode, search]);

    //** append data through infinite scroll */
    useEffect(() => {
        if (getProjects.status !== 'SUCCESS') {
            return;
        }

        if (getProjects.data.length < limit) {
            setCanCollect(false);
        } else {
            if (!canCollectRef.current) {
                setCanCollect(true);
            }
        }

        const mutateListWithVotes = projects;

        getProjects.data.forEach((proj) => {
            mutateListWithVotes.push({
                ...proj,
                project_global: proj.project_global,
                project_id: proj.project_id,
                project_name: proj.project_name,
                project_permission: proj.project_permission,
                project_visibility: proj.project_visibility,
            });
        });

        dispatch({
            type: 'field',
            field: 'projects',
            value: mutateListWithVotes,
        });

        searchbarRef.current?.focus();
    }, [getProjects.status, getProjects.data]);

    //** infinite sroll variables */
    let scrollEle, scrollTimeout, currentScroll, previousScroll;
    const offsetRef = useRef(0);
    offsetRef.current = offset;
    const canCollectRef = useRef(true);
    canCollectRef.current = canCollect;

    const scrollAll = () => {
        currentScroll = scrollEle.scrollTop + scrollEle.offsetHeight;
        if (
            currentScroll > scrollEle.scrollHeight * 0.75 &&
            currentScroll > previousScroll
        ) {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }

            scrollTimeout = setTimeout(() => {
                if (!canCollectRef.current) {
                    return;
                }

                setOffset(offsetRef.current + limit);
            }, 500);
        }

        previousScroll = currentScroll;
    };

    /**
     * @desc infinite scroll
     */
    useEffect(() => {
        scrollEle = document.querySelector('#home__content');

        scrollEle.addEventListener('scroll', scrollAll);
        return () => {
            scrollEle.removeEventListener('scroll', scrollAll);
        };
    }, [scrollEle]);

    return (
        <>
            <StyledBackdrop open={getProjects.status !== 'SUCCESS'}>
                <Stack
                    direction={'column'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    spacing={1}
                >
                    <CircularProgress />
                    <Typography variant="body2">Loading</Typography>
                    <Typography variant="caption">Projects</Typography>
                </Stack>
            </StyledBackdrop>
            <StyledContainer>
                <StyledSearchbarContainer>
                    <StyledSearch
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        label="Project"
                        size="small"
                        clearable
                        onClear={() => setSearch('')}
                        ref={searchbarRef}
                    />
                    <StyledSort
                        size={'small'}
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <MenuItem value="Name">Name</MenuItem>
                        <MenuItem value="Date Created">Date Created</MenuItem>
                        <MenuItem value="Views">Views</MenuItem>
                        <MenuItem value="Trending">Trending</MenuItem>
                        <MenuItem value="Upvotes">Upvotes</MenuItem>
                    </StyledSort>

                    <ToggleButtonGroup size={'small'} value={view}>
                        <ToggleButton<string>
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
                                              description={project.description}
                                              onClick={() => {
                                                  navigate(
                                                      `${project.project_id}`,
                                                      {
                                                          state: {
                                                              name: formatProjectName(
                                                                  project.project_name,
                                                              ),
                                                              global: false,
                                                              permission: 3,
                                                          },
                                                      },
                                                  );
                                              }}
                                          />
                                      ) : (
                                          <ProjectTileCard
                                              name={formatProjectName(
                                                  project.project_name,
                                              )}
                                              id={project.project_id}
                                              description={project.description}
                                              onClick={() => {
                                                  navigate(
                                                      `${project.project_id}`,
                                                      {
                                                          state: {
                                                              name: formatProjectName(
                                                                  project.project_name,
                                                              ),
                                                              global: false,
                                                              permission: 3,
                                                          },
                                                      },
                                                  );
                                              }}
                                          />
                                      )}
                                  </Grid>
                              );
                          })
                        : 'No apps to choose from'}
                </Grid>
            </StyledContainer>
        </>
    );
};
