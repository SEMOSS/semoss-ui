import React from 'react';
import { BlocksWorkspaceActions } from './BlocksWorkspaceActions';
import { render, screen } from '@testing-library/react';
import { DefaultBlocks } from '@/components/block-defaults';
import { Notification } from '@semoss/ui';
import { Blocks } from '@/components/blocks';
import { RootStoreContext, WorkspaceContext } from '@/contexts';
import configureMockStore from 'redux-mock-store';
import { WorkspaceStore } from '@/stores';
import { Role, Type } from '@/types';

const ACTIVE = 'page-1';

const mockStore = configureMockStore();
const store = mockStore({});

// jest.mock('../../hooks/useBlocks', () =>{
//     return ({
//         state: {
//             insightId: 'test',
//             queries: {},
//             blocks: {},
//             cellRegistry: {},
//         }
//     })
// })

// jest.mock("../../hooks/useRootStore", () =>{
//     return jest.fn(() => ({
//         monolithStore: {
//             insightId: '',
//             queries: {},
//             blocks: {},
//             cellRegistry: {},
//         }
//     }))
// })

// jest.mock('../../hooks/useWorkspace', () =>{
//     return jest.fn(()=> ({
const workspace = {
    appId: '',
    isLoading: false,
    isEditMode: true,
    view: 'data',
    role: 'OWNER' as Role,
    type: 'BLOCKS' as Type,
    metadata: {
        project_id: '',
        project_name: '',
        project_type: '' as const,
        project_cost: '',
        project_global: '',
        project_catalog_name: '',
        project_created_by: '',
        project_created_by_type: '',
        project_date_created: '',
    },
    overlay: {
        open: false,
        content: () => null,
    },
};
const WORKSPACE = new WorkspaceStore(store, workspace);

test('renders the App', () => {
    render(
        <RootStoreContext.Provider value={store}>
            <Blocks state={store} registry={DefaultBlocks}>
                <Notification>
                    <WorkspaceContext.Provider value={{ workspace: WORKSPACE }}>
                        <BlocksWorkspaceActions />
                    </WorkspaceContext.Provider>
                </Notification>
            </Blocks>
        </RootStoreContext.Provider>,
    );

    const initialRender = screen.getByText(/Design/i);

    expect(initialRender).toBeVisible();
});
