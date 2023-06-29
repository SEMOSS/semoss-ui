import { useEffect, useState } from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';

import { LoadingScreen } from '@/components/ui';
import { MonolithStore } from '@/stores/monolith';

import {
    Autocomplete,
    Card,
    Grid,
    Select,
    IconButton,
    Button,
    ButtonGroup,
    ToggleButton,
    ToggleButtonGroup,
    // Icons,
    styled,
} from '@semoss/ui';

import { Icons } from '@semoss/ui';

import { Permissions } from '@/components/database';

export interface DBMember {
    ID: string;
    NAME: string;
    PERMISSION: string;
    EMAIL: string;
    SELECTED: boolean;
}

const StyledSearchbar = styled('div')({
    display: 'flex',
    gap: '16px',
    marginTop: '16px',
    marginBottom: '16px',
    gap: '16px',
});

const StyledAutocomplete = styled(Autocomplete)({
    width: '70%',
});

const StyledTileCard = styled(Card)({
    display: 'flex',
    padding: '0px 0px 8px 0px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
});

const StyledTileCardActions = styled(Card.Actions)({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '1rem',
});

const StyledLandscapeCard = styled(Card)({
    width: '69.25rem',
});

export const DatabaseSettingsPage = () => {
    const { adminMode } = useSettings();

    const [view, setView] = useState('tile');
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

    console.log('i', Icons);
    return (
        <>
            {!selectedApp ? (
                <>
                    <div>Select a database to start</div>
                    <StyledSearchbar>
                        <StyledAutocomplete
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
                        />

                        <Select></Select>

                        <ToggleButtonGroup value={view}>
                            <ToggleButton
                                onClick={(e, v) => setView(v)}
                                value={'tile'}
                            >
                                Tile
                            </ToggleButton>
                            <ToggleButton
                                onClick={(e, v) => setView(v)}
                                value={'list'}
                            >
                                List
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </StyledSearchbar>
                    <Grid container spacing={2}>
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
                                              <Card.Header
                                                  title={formatDBName(
                                                      db.app_name,
                                                  )}
                                                  //   subheader={<div>hello</div>}
                                                  action={
                                                      <IconButton>
                                                          Star
                                                      </IconButton>
                                                  }
                                              />
                                              <Card.Content>
                                                  {/* {db.app_permission} */}
                                                  Lorem Ipsum is simply dummy
                                                  text of the printing and
                                                  typesetting industry. Lorem
                                                  Ipsum has been the industry's
                                                  standard dummy text ever since
                                                  the 1500s, when an unknown
                                                  printer took a galley of type
                                                  and scrambled it to make a
                                                  type specimen book.
                                              </Card.Content>
                                              <StyledTileCardActions>
                                                  <div>1</div>
                                                  <div>2</div>
                                                  <div>4</div>
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
        </>
    );
};
