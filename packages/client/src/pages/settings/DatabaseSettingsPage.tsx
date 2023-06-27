import { useEffect, useState } from 'react';
import { useRootStore, useAPI } from '@/hooks';
import { useSettings } from '@/hooks/useSettings';

import { LoadingScreen } from '@/components/ui';
import { Permissions } from '@/components/database';
import { MonolithStore } from '@/stores/monolith';

import {
    Autocomplete,
    Card,
    Grid,
    Select,
    IconButton,
    // Icons,
    styled,
} from '@semoss/ui';

export interface DBMember {
    ID: string;
    NAME: string;
    PERMISSION: string;
    EMAIL: string;
    SELECTED: boolean;
}

const StyledTileCard = styled(Card)({
    display: 'flex',
    padding: '0px 0px 8px 0px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
});

const StyledLandscapeCard = styled(Card)({
    width: '69.25rem',
});

export const DatabaseSettingsPage = () => {
    const { adminMode } = useSettings();

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

    return (
        <>
            <Grid container spacing={2}>
                {getApps.status === 'SUCCESS'
                    ? getApps.data.map((db, i) => {
                          return (
                              <Grid item key={i} sm={12} md={6} lg={4} xl={3}>
                                  <StyledTileCard>
                                      <Card.Media sx={{ height: '100px' }} />
                                      <Card.Header
                                          title={formatDBName(db.app_name)}
                                          //   subheader={<div>hello</div>}
                                          //   action={
                                          //     <IconButton>Hello</IconButton>
                                          //   }
                                      />
                                      <Card.Content>
                                          {db.app_permission}
                                      </Card.Content>
                                  </StyledTileCard>
                              </Grid>
                          );
                      })
                    : 'Retrieving datasets'}
            </Grid>
        </>
    );
};
