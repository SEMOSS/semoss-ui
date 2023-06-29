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

import { Permissions } from '@/components/database';
debugger;
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

const StyledTileCard = styled(Card)({
    display: 'flex',
    padding: '0px 0px 8px 0px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
});

const StyledTileCardContent = styled(Card.Content)({
    display: 'flex',
    padding: '0px 16px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
});

const StyledCardRows = styled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
});

const StyledCardRowsDiv = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 0 0',
});

const StyledCardContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    flex: '1 0 0',
    // display: 'flex',
    // padding: '0px 0px 8px 0px',
    // flexDirection: 'column',
    // alignItems: 'flex-start',
    // gap: '16px',
    // flex: '1 0 0',
});

const StyledCardHeader = styled('div')({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '4px',
    alignSelf: 'stretch',
});

const StyledDbName = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: '1 0 0',
    alignSelf: 'stretch',
});

const StyledCardCategory = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
});

const StyledCategoryIcon = styled(Icons.FolderOpen)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledCategoryLabel = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyledPublishedByContainer = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
});

const StyledAvatar = styled(Avatar)({
    display: 'flex',
    width: '20px',
    height: '20px',
    padding: '8px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledPersonIcon = styled(Icons.Person)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledPublishedByLabel = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyedCardDescription = styled(Typography)({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch',
});

const StyledTileCardActions = styled(Card.Actions)({
    display: 'flex',
    padding: '0px 8px 0px 16px',
    alignItems: 'center',
    gap: '4px',
    alignSelf: 'stretch',
});

const StyledLeftActions = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: '1 0 0',
});

const StyledViewsTrendingDiv = styled('div')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '4px',
});

const StyledEyeIcon = styled(Icons.Visibility)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledTrendingIcon = styled(Icons.ShowChart)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledLockButton = styled(IconButton)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
});

const StyledLandscapeCard = styled(Card)({
    width: '69.25rem',
});

export const DatabaseSettingsPage = () => {
    const { adminMode } = useSettings();

    const [view, setView] = useState('tile');
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
                        {/* <Search 
                        /> */}
                        {/* <StyledAutocomplete
                            label="Database"
                            id="combo-box-demo"
                            options={
                                getApps.status === 'SUCCESS' ? getApps.data : []
                            }
                            // value={selectedApp.app_id}
                            onChange={(
                                val: Awaited<
                                    ReturnType<MonolithStore['getDatabases']>
                                >[number],
                            ) => {
                                setSelectedApp(val.app_id);
                            }}
                            // inputValue={inputValue}
                            isOptionEqualToValue={(option, value) => {
                                return option.app_id === value;
                            }}
                            onInputChange={(event, newInputValue) => {
                                console.log();
                                // setInputValue(newInputValue);
                            }}
                        /> */}

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
                                          sm={12}
                                          md={6}
                                          lg={4}
                                          xl={3}
                                      >
                                          <StyledTileCard
                                              onClick={() => setSelectedApp(db)}
                                          >
                                              <Card.Media
                                                  src={
                                                      'http://www.example.com/image.gif'
                                                  }
                                                  sx={{ height: '100px' }}
                                              />
                                              <StyledTileCardContent>
                                                  <StyledCardRows>
                                                      <StyledCardRowsDiv>
                                                          <StyledCardContainer>
                                                              <StyledCardHeader>
                                                                  <StyledDbName
                                                                      variant={
                                                                          'body1'
                                                                      }
                                                                  >
                                                                      {formatDBName(
                                                                          db.app_name,
                                                                      )}
                                                                  </StyledDbName>
                                                                  <IconButton>
                                                                      <Icons.StarOutlineOutlined />
                                                                  </IconButton>
                                                              </StyledCardHeader>

                                                              <StyledCardCategory>
                                                                  <Icon color="disabled">
                                                                      <StyledCategoryIcon />
                                                                  </Icon>
                                                                  <StyledCategoryLabel
                                                                      color={
                                                                          'secondary'
                                                                      }
                                                                      variant={
                                                                          'caption'
                                                                      }
                                                                  >
                                                                      Category
                                                                  </StyledCategoryLabel>
                                                              </StyledCardCategory>

                                                              <StyledPublishedByContainer>
                                                                  <StyledAvatar>
                                                                      <StyledPersonIcon />
                                                                  </StyledAvatar>
                                                                  <StyledPublishedByLabel
                                                                      color={
                                                                          'secondary'
                                                                      }
                                                                      variant={
                                                                          'caption'
                                                                      }
                                                                  >
                                                                      Published
                                                                      by: jsmith
                                                                  </StyledPublishedByLabel>
                                                              </StyledPublishedByContainer>

                                                              <StyedCardDescription
                                                                  variant={
                                                                      'body2'
                                                                  }
                                                              >
                                                                  {/* {db.app_permission} */}
                                                                  Lorem Ipsum is
                                                                  simply dummy
                                                                  text of the
                                                                  printing and
                                                                  typesetting
                                                                  industry.
                                                                  Lorem Ipsum
                                                                  has been the
                                                                  industry's
                                                                  standard dummy
                                                                  text ever
                                                                  since the
                                                                  1500s, when an
                                                                  unknown
                                                                  printer took a
                                                                  galley of type
                                                                  and scrambled
                                                                  it to make a
                                                                  type specimen
                                                                  book.
                                                              </StyedCardDescription>
                                                              <Chip
                                                                  variant={
                                                                      'outlined'
                                                                  }
                                                                  label={'Tag'}
                                                              />
                                                          </StyledCardContainer>
                                                      </StyledCardRowsDiv>
                                                  </StyledCardRows>
                                              </StyledTileCardContent>
                                              <StyledTileCardActions>
                                                  <StyledLeftActions>
                                                      <ButtonGroup
                                                          size="sm"
                                                          color="secondary"
                                                      >
                                                          <Button>
                                                              <Icons.ArrowDropUp />
                                                          </Button>
                                                          <Button
                                                              disabled={true}
                                                          >
                                                              12
                                                          </Button>
                                                      </ButtonGroup>
                                                      <StyledViewsTrendingDiv>
                                                          <StyledEyeIcon color="secondary" />
                                                          <Typography
                                                              color="secondary"
                                                              variant="caption"
                                                          >
                                                              1.2k
                                                          </Typography>
                                                      </StyledViewsTrendingDiv>
                                                      <StyledViewsTrendingDiv>
                                                          <StyledTrendingIcon color="secondary" />
                                                          <Typography
                                                              color="secondary"
                                                              variant="caption"
                                                          >
                                                              1.2k
                                                          </Typography>
                                                      </StyledViewsTrendingDiv>
                                                  </StyledLeftActions>
                                                  <StyledLockButton>
                                                      <Icons.LockRounded />
                                                  </StyledLockButton>
                                              </StyledTileCardActions>
                                          </StyledTileCard>
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
