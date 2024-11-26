import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Drawer } from '@semoss/ui';

import { WorkspaceContext } from '@/contexts';
import { WorkspaceStore, WorkspaceOptions, WorkspaceApp } from '@/stores';
import { LoadingScreen } from '@/components/ui';

import { WorkspaceOverlay } from './WorkspaceOverlay';

const StyledWorkspace = styled('div')(() => ({
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledMain = styled('div', {
    shouldForwardProp: (prop) => prop !== 'drawerOpen',
})<{
    drawerOpen: boolean;
}>(({ drawerOpen }) => ({
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    width: drawerOpen ? 'calc(100% - 240px)' : '100%',
    marginLeft: drawerOpen ? '240px' : '0',
    transition: 'margin 0.3s ease, width 0.3s ease',
    overflow: 'hidden',
}));

const StyledContent = styled('div')(({ theme }) => ({
    position: 'relative',
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
}));

const StyledSpacer = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: theme.spacing(1.5),
    right: theme.spacing(1.5),
    bottom: theme.spacing(1.5),
    overflow: 'hidden',
}));

type WorkspaceProps = {
    /** Name of the workspace. This will be used to set the cache */
    name: string;

    /** Connected App */
    app: WorkspaceApp | null;

    /** Options to load into the workspace */
    options: WorkspaceOptions;

    /** Content to show in the workspace */
    children: React.ReactNode;

    /** Content to show in the header */
    header?: React.ReactNode;

    /** Content to show in the drawer */
    drawer?: React.ReactNode;
};

export const Workspace = observer((props: WorkspaceProps) => {
    const {
        name,
        app = null,
        options,
        children,
        header = null,
        drawer = true,
    } = props;

    // create the workspace
    const workspace = useMemo(() => {
        // default options if not loaded from cache
        const defaultOptions = JSON.parse(JSON.stringify(options));

        return new WorkspaceStore(name, defaultOptions);
    }, [name, options]);

    return (
        <WorkspaceContext.Provider
            value={{
                workspace: workspace,
                app: app,
            }}
        >
            <StyledWorkspace>
                <WorkspaceOverlay />
                <StyledMain drawerOpen={!!drawer && workspace.drawer.isOpen}>
                    {header}
                    <StyledContent>
                        {workspace.isLoading ? <LoadingScreen.Trigger /> : null}
                        <StyledSpacer>{children}</StyledSpacer>
                    </StyledContent>
                </StyledMain>
                {drawer ? (
                    <Drawer
                        anchor="left"
                        open={workspace.drawer.isOpen}
                        ModalProps={{
                            hideBackdrop: true, // Hide the backdrop
                        }}
                        PaperProps={{
                            sx: {
                                position: 'absolute',
                                height: '100%',
                                width: '240px',
                                borderRadius: 0,
                            },
                        }}
                        variant="persistent"
                    >
                        {drawer}
                    </Drawer>
                ) : null}
            </StyledWorkspace>
        </WorkspaceContext.Provider>
    );
});
