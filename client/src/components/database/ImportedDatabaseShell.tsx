import React from 'react';
import { styled, Button, Icon } from '@semoss/components';
import { mdiPlus } from '@mdi/js';

import { theme } from '@/theme';
import { Image, Page, LoadingScreen } from '@/components/ui';
import { useDatabase, usePixel } from '@/hooks';

const StyledTitleGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: theme.space['4'],
});

const StyledTitle = styled('h1', {
    flex: '1',
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.semibold,
});

const StyledInfo = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.space['8'],
    overflow: 'hidden',
});

const StyledInfoLeft = styled('div', {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: theme.space['2'],
});

const StyledInfoDescription = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.lg,
    maxWidth: '50%',
    overflow: 'hidden',
});

const StyledInfoFooter = styled('div', {
    color: theme.colors['grey-2'],
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.semibold,
    textTransform: 'uppercase',
    overflow: 'hidden',
});

interface ImportedDatabaseShellProps {
    /** Children to wrap in the RootStore */
    children: React.ReactNode;
}

/**
 * Wrap the Database routes and provide styling/functionality
 */
export const ImportedDatabaseShell = (props: ImportedDatabaseShellProps) => {
    const { children } = props;

    return (
        <Page
            header={
                <StyledTitleGroup>
                    <StyledTitle>Data Catalog</StyledTitle>
                </StyledTitleGroup>
            }
        >
            {children}
        </Page>
    );
};
