import React, { useEffect, useState, useRef } from 'react';
import { styled, theme, Select, Icon } from '@semoss/components';
import { mdiTextBoxMultipleOutline } from '@mdi/js';

import { useRootStore, useAPI, useSettings, usePixel } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { Permissions } from '@/components/database';

const StyledContainer = styled('div', {
    margin: '0 auto',
    paddingLeft: theme.space[8],
    paddingRight: theme.space[8],
    paddingBottom: theme.space[8],
    '@sm': {
        maxWidth: '640px',
    },
    '@md': {
        maxWidth: '768px',
    },
    '@lg': {
        maxWidth: '1024px',
    },
    '@xl': {
        maxWidth: '1280px',
    },
    '@xxl': {
        maxWidth: '1536px',
    },
});

const StyledDescription = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.sm,
    width: '100%',
    maxWidth: '50%',
    marginBottom: theme.space['6'],
});

const StyledLoadWorkflowContainer = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.colors['grey-2'],
    backgroundColor: theme.colors.base,
    marginTop: theme.space[4],
    border: `${theme.borderWidths.default} solid ${theme.colors['grey-4']}`,
    '@sm': {
        minHeight: '5rem',
    },
    '@md': {
        minHeight: '8rem',
    },
    '@lg': {
        minHeight: '10rem',
    },
    '@xl': {
        minHeight: '15rem',
    },
    '@xxl': {
        minHeight: '30rem',
    },
});

const StyledIcon = styled(Icon, {
    fontSize: '4rem',
});

const StyledDiv = styled('div', {
    display: 'flex',
    // border: 'solid',
});

const StyledChangeInsight = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.md,
    width: '100%',
    maxWidth: '50%',
    marginBottom: theme.space['6'],
    // border: 'solid',
});

export interface InsightInterface {
    app_id: string;
    app_insight_id: string;
    app_name: string;
    cacheMinutes: number;
    cacheable: boolean;
    cachedOn: string;
    created_on: string;
    description: string;
    insight_global: boolean;
    insight_permission: number;
    last_modified_on: string;
    layout: string;
    low_name: string;
    name: string;
    permission: number;
    project_global: boolean;
    project_id: string;
    project_insight_id: string;
    project_name: string;
    project_permission: number;
    tags: string[];
    view_count: number;
}

export const InsightPermissionsPage = () => {
    const { adminMode } = useSettings();

    const [insights, setInsights] = useState<InsightInterface[]>([]);
    const [selectedInsight, setSelectedInsight] =
        useState<InsightInterface>(null);

    // const getInsights = useAPI(['getInsights', adminMode]);

    // useEffect(() => {
    //     // REST call to get all apps
    //     if (getInsights.status !== 'SUCCESS' || !getInsights.data) {
    //         return;
    //     }

    //     setInsights(getInsights.data);

    //     () => {
    //         console.warn('Cleaning up getInsights');
    //         setInsights([]);
    //     };
    // }, [getInsights.status, getInsights.data]);

    // // // show a loading screen when getApps is pending
    // if (getInsights.status !== 'SUCCESS') {
    //     return (
    //         <LoadingScreen.Trigger description="Retrieving insights and projects" />
    //     );
    // }

    /**
     * @name getDisplay
     * @desc gets display options for the Insight dropdown
     * @param option - the object that is specified for the option
     */
    const getDisplay = (option) => {
        return `${option.name} - ${option.project_name}`;
    };

    const formatInsightName = (str) => {
        let i;
        const frags = str.split('_');
        for (i = 0; i < frags.length; i++) {
            frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
        }
        return frags.join(' ');
    };

    return (
        <StyledContainer>
            <>
                <StyledDescription>
                    View and edit settings for project insights
                </StyledDescription>
                <div>
                    <Select
                        value={selectedInsight}
                        options={insights}
                        getDisplay={getDisplay}
                        onChange={(opt: InsightInterface) => {
                            // Set selected Insight
                            setSelectedInsight(opt);
                        }}
                        placeholder="Select an option to view insight specific settings"
                    ></Select>
                    {selectedInsight ? (
                        <Permissions
                            config={{
                                id: selectedInsight.app_insight_id,
                                name: selectedInsight.name,
                                global: selectedInsight.insight_global,
                                visibility: undefined,
                                projectid: selectedInsight.project_id,
                            }}
                        ></Permissions>
                    ) : (
                        <StyledLoadWorkflowContainer>
                            <StyledIcon
                                size="xl"
                                path={mdiTextBoxMultipleOutline}
                            ></StyledIcon>
                            <p>SEMOSS is waiting on your selection</p>
                        </StyledLoadWorkflowContainer>
                    )}
                </div>
            </>
        </StyledContainer>
    );
};
