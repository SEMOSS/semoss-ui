import { observer } from 'mobx-react-lite';
import { styled } from '@/component-library';

import { Navbar } from '@/components/ui';

import { WorkspaceOverlay } from './WorkspaceOverlay';
import { WorkspaceLoading } from './WorkspaceLoading';
import { WorkspaceContext } from '@/contexts';
import { WorkspaceStore } from '@/stores';

const NAV_HEIGHT = '48px';

const StyledMain = styled('div')(() => ({
    display: 'flex',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledContent = styled('div')(() => ({
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    paddingTop: NAV_HEIGHT,
}));

interface WorkspaceProps {
    /** Actions to render in the top bar */
    actions: React.ReactNode;

    /** Content to render  */
    children: React.ReactNode;

    /** Workspace to render */
    workspace: WorkspaceStore;
}

export const Workspace = observer((props: WorkspaceProps) => {
    const { actions = () => null, workspace, children } = props;

    return (
        <WorkspaceContext.Provider
            value={{
                workspace: workspace,
            }}
        >
            <WorkspaceOverlay />
            <StyledMain>
                <Navbar>{actions}</Navbar>
                <StyledContent>
                    <WorkspaceLoading />
                    {children}
                </StyledContent>
            </StyledMain>
        </WorkspaceContext.Provider>
    );
});
