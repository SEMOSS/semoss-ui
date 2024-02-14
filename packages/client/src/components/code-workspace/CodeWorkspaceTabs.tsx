import { observer } from 'mobx-react-lite';
import { styled, Tabs } from '@semoss/ui';

import { useWorkspace } from '@/hooks';

const StyledTabItem = styled(Tabs.Item)(() => ({
    minHeight: 'auto',
    minWidth: 'auto',
    paddingTop: '11px',
    paddingRight: '8px',
    paddingBottom: '11px',
    paddingLeft: '8px',
}));

export const CodeWorkspaceTabs = observer(() => {
    const { workspace } = useWorkspace();

    return (
        <Tabs
            value={workspace.view}
            onChange={(e, v) => workspace.setView(v as string)}
            //TODO: Fix inline style
            sx={{
                minHeight: '40px',
                height: '40px',
            }}
        >
            <StyledTabItem label="Code" value={'code'} />
            <StyledTabItem label="Settings" value={'settings'} />
        </Tabs>
    );
});
