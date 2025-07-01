import React, { useState, useEffect, useMemo } from 'react';
import { Button, Table, styled, Typography } from '@semoss/ui';
import { useEngine, useRootStore } from '@/hooks';
import { FileTable } from '@/components/settings';
import StorageTest from './StorageTest';
import { FileExplorerPanel } from '@/components/workspace';
import { Layout, Model, TabNode } from 'flexlayout-react';
import { FileExplorer } from '@/components/common/File/FileExplorer';
import { DesignerStore, WorkspaceOptions, WorkspaceStore } from '@/stores';
import * as FlexLayout from 'flexlayout-react';
import { DesignerContext, WorkspaceContext } from '@/contexts';
import { StateStore } from '@semoss/renderer';
import { config } from 'process';


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

// test FileExplorePanel

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

// const createTestLayoutModel = () => {
//     const json = {
//         global: {
//             tabEnableClose: true,
//         },
//         layout: {
//             type: 'row',
//             weight: 100,
//             children: [
//                 {
//                     type: 'tabset',
//                     id: 'main-tabset',
//                     weight: 100,
//                     children: [],
//                 },
//             ],
//         },
//     };

//     return Model.fromJson(json);
// };

// const createTestLayout = () => {
//     const model = createTestLayoutModel();

//     // Define a simple factory function
//     const factory = (node) => {
//         const name = node.getName();
//         return <div>{name}</div>;
//     };

//     return new Layout({
//         model,
//         factory,
//     });
// };

// const [state, setState] = useState<StateStore>();

// const designer = useMemo(() => {
//     // return the store
//     if (state) {
//         return new DesignerStore(state, {
//             rendered: 'page-1',
//         });
//     }
// }, [state]);
// const layout = createTestLayout();

console.log("EngineFilePage");

export const EngineFilePage = () => {
    //Grabbing Engine Id for document creation
    const { id } = useEngine();
const { monolithStore, configStore } = useRootStore();
const insightID = configStore.store.insightID;
// const insightID = monolithStore.getInsightId(id);
console.log("at EngineFilePage insightID" ,insightID);
console.log("at EngineFilePage id" ,id);
console.log("at EngineFilePage monolithStore" ,monolithStore.config);
console.log("at EngineFilePage configStore" ,configStore.store);
const mockWorkspace = {
    workspace: {
        appId: '',
        insightId: insightID, // Use the insightID from the store
    } as WorkspaceStore, 
    options: {},
      factory: (node: TabNode, layout: Layout) => {
        const component = node.getComponent();
        if (component === 'file-explorer') {
          return <FileExplorerPanel layout={layout} />;
        }
        return <div>Unknown Component: {component}</div>;
      },
  };




    return (
        <StyledContainer>
            <StyledTopDiv>
                <Typography variant={'h6'}>File Explorer</Typography>
            </StyledTopDiv>

            <StyledTableContainer>
                {/* <FileTable id={id} mode='storage'/> */}
                {/* <StorageTest id={id}/> */}

                {/* <DesignerContext.Provider
                    value={{
                        designer: designer,
                    }}
                >
                    <FileExplorerPanel layout={layout} />
                </DesignerContext.Provider> */}


                <WorkspaceContext.Provider value={mockWorkspace}>
                    <FileExplorerPanel layout={layout} />
                </WorkspaceContext.Provider>

                {/* <FileExplorer
                    type="insight"
                    space="/"
                    onSelect={(path) => console.log('Selected:', path)}
                    onDragStart={(e, path) => console.log('Drag Start:', path)}
                    onDragEnd={(e, path) => console.log('Drag End:', path)}
                    onTrashClick={(e, path) => console.log('Trash Clicked:', path)}
                /> */}
 
            </StyledTableContainer>
        </StyledContainer>
    );
};
