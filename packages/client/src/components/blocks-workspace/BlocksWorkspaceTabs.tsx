import { observer } from 'mobx-react-lite';
import { styled, Tabs } from '@semoss/ui';

import { useBlocks, useWorkspace } from '@/hooks';
import { ActionMessages } from '@/stores';

const StyledTabItem = styled(Tabs.Item)(() => ({
    minHeight: 'auto',
    minWidth: 'auto',
    paddingTop: '11px',
    paddingRight: '8px',
    paddingBottom: '11px',
    paddingLeft: '8px',
}));

export const BlocksWorkspaceTabs = observer(() => {
    const { workspace } = useWorkspace();
    const { state, notebook } = useBlocks();

    return (
        <Tabs
            value={workspace.view}
            onChange={(e, v) => {
                workspace.setView(v as string);

                if (v === 'data') {
                    if (!notebook.selectedQuery) {
                        if (notebook.queriesList.length) {
                            console.log('here');
                        } else {
                            const createQuery = () => {
                                // Create a query for user
                                state.dispatch({
                                    message: ActionMessages.NEW_QUERY,
                                    payload: {
                                        queryId: 'default',
                                        config: {
                                            cells: [
                                                {
                                                    id: `${Math.floor(
                                                        Math.random() * 100000,
                                                    )}`,
                                                    widget: 'code',
                                                    parameters: {
                                                        code: '',
                                                        type: 'py',
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                });

                                // notebook.selectQuery(id);
                            };

                            createQuery();
                        }
                    }
                }
            }}
            //TODO: Fix inline style
            sx={{
                minHeight: '40px',
                height: '40px',
            }}
        >
            <StyledTabItem label="Data" value={'data'} />
            <StyledTabItem label="Design" value={'design'} />
            <StyledTabItem label="Settings" value={'settings'} />
        </Tabs>
    );
});
