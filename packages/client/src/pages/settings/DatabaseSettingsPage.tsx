import { useEffect, useState } from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';

import { LoadingScreen } from '@/components/ui';
import { MonolithStore } from '@/stores/monolith';

import {
    Avatar,
    Autocomplete,
    ButtonGroup,
    Button,
    Card,
    Chip,
    Grid,
    Searchbar,
    Select,
    MenuItem,
    Icon,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    // Icons,
    styled,
} from '@semoss/ui';

import * as Icons from '@semoss/ui';
import defaultDBImage from '../../assets/img/placeholder.png';

import { DatabaseLandscapeCard, DatabaseTileCard } from '@/components/database';

import { Permissions } from '@/components/database';

export interface DBMember {
    ID: string;
    NAME: string;
    PERMISSION: string;
    EMAIL: string;
    SELECTED: boolean;
}

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

const StyledSearchbar = styled(Searchbar)({
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

export const DatabaseSettingsPage = () => {
    const { adminMode } = useSettings();

    const [view, setView] = useState('list');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('Name');

    const [selectedApp, setSelectedApp] =
        useState<Awaited<ReturnType<MonolithStore['getDatabases']>>[number]>(
            null,
        );

    const getApps = useAPI(['getDatabases', adminMode]);

    // reset the selected app when apps change
    useEffect(() => {
        if (getApps.status !== 'SUCCESS') {
            return;
        }

        // reset it
        setSelectedApp(null);
    }, [getApps.status, getApps.data]);

    // show a loading screen when getApps is pending
    if (getApps.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Retrieving databases" />;
    }

    /**
     * @name getDisplay
     * @desc gets display options for the DB dropdown
     * @param option - the object that is specified for the option
     */
    const getDisplay = (option) => {
        return `${formatDBName(option.database_name)} - ${option.database_id}`;
    };

    const formatDBName = (str) => {
        let i;
        const frags = str.split('_');
        for (i = 0; i < frags.length; i++) {
            frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
        }
        return frags.join(' ');
    };

    // console.log('i', Icons);
    return (
        <StyledContainer>
            {!selectedApp ? (
                <>
                    <Typography variant={'body1'}>
                        Select a database to start
                    </Typography>

                    <StyledSearchbarContainer>
                        <StyledSearchbar
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                            label="Database"
                            size="small"
                        />
                        <StyledSort
                            size={'small'}
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <MenuItem value={'Name'}>Name</MenuItem>
                            <MenuItem value={'Date Created'}>
                                Date Created
                            </MenuItem>
                            <MenuItem value={'Views'}>Views</MenuItem>
                            <MenuItem value={'Trending'}>Trending</MenuItem>
                            <MenuItem value={'Upvotes'}>Upvotes</MenuItem>
                        </StyledSort>

                        <ToggleButtonGroup size={'small'} value={view}>
                            <ToggleButton
                                onClick={(e, v) => setView(v)}
                                value={'tile'}
                            >
                                <Icons.SpaceDashboardOutlined />
                            </ToggleButton>
                            <ToggleButton
                                onClick={(e, v) => setView(v)}
                                value={'list'}
                            >
                                <Icons.FormatListBulletedOutlined />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </StyledSearchbarContainer>
                    <Grid container spacing={3}>
                        {getApps.status === 'SUCCESS'
                            ? getApps.data.map((db, i) => {
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
                                              <DatabaseLandscapeCard
                                                  name={formatDBName(
                                                      db.app_name,
                                                  )}
                                                  id={db.app_id}
                                                  image={defaultDBImage}
                                                  tag={'Tag1'}
                                                  owner={'jsmith123'}
                                                  description={
                                                      'Lorem Ipsum is simply dummy text of the printing and typesetting industry.Lorem'
                                                  }
                                                  votes={'12'}
                                                  views={'1.2k'}
                                                  trending={'1.2k'}
                                                  isGlobal={true}
                                                  isUpvoted={false}
                                                  onClick={(id) =>
                                                      setSelectedApp(id)
                                                  }
                                                  favorite={(val) => {
                                                      console.log(
                                                          'make favorite',
                                                          val,
                                                      );
                                                  }}
                                                  upvote={(val) => {
                                                      console.log(
                                                          'upvote',
                                                          val,
                                                      );
                                                  }}
                                                  global={(val) => {
                                                      console.log(
                                                          'make global',
                                                          val,
                                                      );
                                                  }}
                                              />
                                          ) : (
                                              <DatabaseTileCard
                                                  name={formatDBName(
                                                      db.app_name,
                                                  )}
                                                  id={db.app_id}
                                                  image={defaultDBImage}
                                                  tag={'Tag1'}
                                                  owner={'jsmith123'}
                                                  description={
                                                      'no description for tile card,'
                                                  }
                                                  votes={'12'}
                                                  views={'1.2k'}
                                                  trending={'1.2k'}
                                                  isGlobal={true}
                                                  onClick={(id) =>
                                                      setSelectedApp(id)
                                                  }
                                                  favorite={(val) => {
                                                      console.log(
                                                          'favorite',
                                                          val,
                                                      );
                                                  }}
                                                  upvote={(val) => {
                                                      console.log(
                                                          'upvote',
                                                          val,
                                                      );
                                                  }}
                                                  global={(val) => {
                                                      console.log(
                                                          'make global',
                                                          val,
                                                      );
                                                  }}
                                              />
                                          )}
                                      </Grid>
                                  );
                              })
                            : 'Retrieving datasets'}
                    </Grid>
                </>
            ) : (
                <Permissions
                    config={{
                        id: selectedApp.database_id,
                        name: selectedApp.database_name,
                        global: selectedApp.database_global,
                        visibility: selectedApp.database_visibility,
                    }}
                ></Permissions>
            )}
        </StyledContainer>
    );
};
