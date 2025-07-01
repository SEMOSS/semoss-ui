import React, { useState, useEffect, useMemo } from 'react';
import { Button, Table, styled, Typography } from '@semoss/ui';
import { useEngine, useRootStore } from '@/hooks';
import { FileTable } from '@/components/settings';
import { FileExplorerPanel } from '@/components/workspace';
import { Layout, Model, TabNode } from 'flexlayout-react';
import { FileExplorer } from '@/components/common/File/FileExplorer';
import { DesignerStore, WorkspaceOptions } from '@/stores';
import * as FlexLayout from 'flexlayout-react';
import { DesignerContext, WorkspaceContext } from '@/contexts';
import { StateStore } from '@semoss/renderer';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledTableContainer = styled(Table.Container)({
    borderRadius: '12px',
    // background: #FFF;
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledTopDiv = styled('div')(() => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
}));

const emptyModel = Model.fromJson({
    global: {},
    layout: {
        type: 'row',
        children: [],
    },
});

const json = {
    global: {
        tabEnableClose: true,
    },
    layout: {
        type: 'row',
        weight: 100,
        children: [
            {
                type: 'tabset',
                weight: 100,
                id: 'main-tabset',
                children: [],
            },
        ],
    },
};

const model = Model.fromJson(json);

const layout = new Layout({
    model,
    factory: (node) => <div>{node.getName()}</div>,
});

const { monolithStore, configStore } = useRootStore();
const insightId = configStore.store.insightID;
console.log('insightId', insightId);

const mockWorkspace = {
    workspace: {
        appId: '',
        insightId: insightId, // Using the insightId from configStore
    } as any,

    options: {},

    overlay: {
        open: false,
        options: {
            maxWidth: 'sm',
        },
        content: () => null,
    },
};

export const EngineFilePage = () => {
    // Grabbing Engine Id for document creation
    const { id } = useEngine();

    return (
        <StyledContainer>
            <StyledTopDiv>
                <Typography variant={'h6'}>File Explorer</Typography>
            </StyledTopDiv>

            <StyledTableContainer>
                {/* <FileTable id={id} /> */}
                <WorkspaceContext.Provider value={mockWorkspace}>
                    <FileExplorerPanel layout={layout} />
                </WorkspaceContext.Provider>
            </StyledTableContainer>
        </StyledContainer>
    );
};
