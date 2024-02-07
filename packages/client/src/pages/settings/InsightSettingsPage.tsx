import React, { useEffect, useState, useRef, useReducer } from 'react';
import { useRootStore, useSettings, usePixel } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { useNavigate } from 'react-router-dom';

import {
    Grid,
    Search,
    Select,
    MenuItem,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    styled,
} from '@/component-library';

import {
    SpaceDashboardOutlined,
    FormatListBulletedOutlined,
} from '@mui/icons-material';

import { InsightLandscapeCard, InsightTileCard } from '@/components/insight';

export interface InsightInterface {
    app_id: string;
    app_insight_id: string;
    app_name: string;
    cacheMinutes: number;
    cacheable: boolean;
    cachedOn: string;
    created_on: string;
    description: string;
    last_modified_on: string;
    layout: string;
    low_name: string;
    name: string;
    permission: number;
    insight_global: boolean;
    insight_id: string;
    insight_insight_id: string;
    insight_name: string;
    insight_permission: number;
    tags: string[];
    view_count: number;
}

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: 'auto',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledSearchbarContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: '24px',
}));

const StyledSearchbar = styled(Search)({
    width: '80%',
});

const StyledSort = styled(Select)({
    width: '20%',
});

const initialState = {
    insights: [],
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

export const InsightSettingsPage = () => {
    const { adminMode } = useSettings();
    const navigate = useNavigate();

    const [state, dispatch] = useReducer(reducer, initialState);
    const { insights } = state;

    const [view, setView] = useState('tile');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('name');

    // To focus when getting new results
    const searchbarRef = useRef(null);

    const getInsights = usePixel(
        `GetInsights(filterWord=["${search}"], onlyFavorites=[false], sort=["${sort}"]);`,
    );

    useEffect(() => {
        // Pixel call to get all apps
        if (getInsights.status !== 'SUCCESS' || !getInsights.data) {
            return;
        }

        dispatch({
            type: 'field',
            field: 'insights',
            value: getInsights.data,
        });

        () => {
            console.warn('Cleaning up getInsights');
        };
    }, [getInsights.status, getInsights.data]);

    const formatInsightName = (str) => {
        let i;
        const frags = str.split('_');
        for (i = 0; i < frags.length; i++) {
            frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
        }
        return frags.join(' ');
    };

    // // Issue with focus on searchbar after
    // if (getInsights.status !== 'SUCCESS') {
    //     return <LoadingScreen.Trigger description="Retrieving insights" />;
    // } else {
    //     searchbarRef.current?.focus();
    // }

    return (
        <StyledContainer>
            <StyledSearchbarContainer>
                <StyledSearchbar
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                    }}
                    size="small"
                />

                <StyledSort
                    size={'small'}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                >
                    <MenuItem value="name">Name</MenuItem>
                </StyledSort>

                <ToggleButtonGroup size={'small'} value={view}>
                    <ToggleButton onClick={(e, v) => setView(v)} value={'tile'}>
                        <SpaceDashboardOutlined />
                    </ToggleButton>
                    <ToggleButton onClick={(e, v) => setView(v)} value={'list'}>
                        <FormatListBulletedOutlined />
                    </ToggleButton>
                </ToggleButtonGroup>
            </StyledSearchbarContainer>
            <Grid container spacing={3}>
                {insights.length
                    ? insights.map((insight, i) => {
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
                                      <InsightTileCard
                                          name={formatInsightName(insight.name)}
                                          description={insight.description}
                                          onClick={() => {
                                              console.log('navigating');
                                              navigate(
                                                  `${insight.project_insight_id}/${insight.project_id}`,
                                                  {
                                                      state: {
                                                          name: formatInsightName(
                                                              insight.name,
                                                          ),
                                                          global: false,
                                                          permission: 3,
                                                      },
                                                  },
                                              );
                                          }}
                                      />
                                  ) : (
                                      <InsightTileCard
                                          name={formatInsightName(insight.name)}
                                          description={insight.description}
                                          onClick={() => {
                                              console.log('navigate');
                                              navigate(
                                                  `${insight.project_insight_id}/${insight.project_id}`,
                                                  {
                                                      state: {
                                                          name: formatInsightName(
                                                              insight.name,
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
                    : 'No insights to choose from'}
            </Grid>
        </StyledContainer>
    );
};
