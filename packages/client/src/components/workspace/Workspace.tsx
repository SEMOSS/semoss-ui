import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Public, RestartAlt } from '@mui/icons-material';
import { Layout, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import './flexlayout.css';

import {
    Avatar,
    styled,
    Stack,
    Typography,
    IconButton,
    Tooltip,
    Button,
} from '@semoss/ui';
import { Env } from '@semoss/sdk/react';

import { WorkspaceContext } from '@/contexts';
import { WorkspaceStore, WorkspaceOptions } from '@/stores';
import { WorkspaceOverlay } from './WorkspaceOverlay';
import { WorkspaceLoading } from './WorkspaceLoading';
import { NavbarLeft, NavbarRight } from '@/components/shared';
import { useNavbar } from '@/hooks/useNavbar';

const StyledMain = styled('div')(() => ({
    position: 'relative',
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
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
    // overflow: 'hidden',
    height: '100%',
}));

const StyledActions = styled(Stack)(({ theme }) => ({
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: '32px', // from flexlayout
    zIndex: 1,
}));

type WorkspaceProps = {
    /** Actions to render in the navbar */
    navbarActions?: React.ReactNode;

    /** Workspace to render */
    workspace: WorkspaceStore;

    /** Options to load into the workspace */
    options: WorkspaceOptions;

    /** Factor method */
    factory: (node: TabNode, layout: Layout) => React.ReactNode;
};

export const Workspace = observer((props: WorkspaceProps) => {
    const { navbarActions, workspace, options, factory = () => null } = props;

    const layoutRef = useRef<Layout>(null);

    useEffect(() => {
        // default options if not loaded from cache
        const defaultOptions = JSON.parse(JSON.stringify(options));

        // try to load from cache
        const isLoaded = workspace.loadFromCache();
        if (!isLoaded) {
            workspace.load(defaultOptions);
        }
    }, [options]);

    /**
     * reset the selected layout
     */
    const resetWorkspace = () => {
        try {
            // copy the optoins
            const layout = JSON.parse(JSON.stringify(options.layout));

            // update the layout
            workspace.updateLayout(layout);
        } catch (e) {
            //noop
        }
    };

    /**
     *  What to display at top nav
     */
    useNavbar({
        left: (
            <Stack direction="row" alignItems={'center'} spacing={1}>
                <Avatar
                    variant="rounded"
                    src={`${Env.MODULE}/api/project-${workspace.appId}/projectImage/download`}
                />
                <Typography variant={'subtitle1'}>
                    {workspace.metadata.project_name}
                </Typography>
            </Stack>
        ),
        middle: <>Search</>,
        right: (
            <Stack>
                {navbarActions}
                <Button
                    variant="contained"
                    size={'small'}
                    color="primary"
                    disabled={
                        !(
                            workspace.role === 'OWNER' ||
                            workspace.role === 'EDIT'
                        )
                    }
                    endIcon={<Public fontSize="inherit" />}
                    component={Link}
                    //@ts-expect-error this is expected. props are forwarded
                    to={`../../../app/${workspace.appId}/view`}
                >
                    Show
                </Button>
            </Stack>
        ),
    });

    return (
        <WorkspaceContext.Provider
            value={{
                workspace: workspace,
            }}
        >
            {/* <NavbarLeft>
                <Stack direction="row" alignItems={'center'} spacing={1}>
                    <Avatar
                        variant="rounded"
                        src={`${Env.MODULE}/api/project-${workspace.appId}/projectImage/download`}
                    />
                    <Typography variant={'subtitle1'}>
                        {workspace.metadata.project_name}
                    </Typography>
                </Stack>
            </NavbarLeft> */}
            {/* <NavbarRight>
                {navbarActions}
                <Button
                    variant="contained"
                    size={'small'}
                    color="primary"
                    disabled={
                        !(
                            workspace.role === 'OWNER' ||
                            workspace.role === 'EDIT'
                        )
                    }
                    endIcon={<Public fontSize="inherit" />}
                    component={Link}
                    //@ts-expect-error this is expected. props are forwarded
                    to={`../../../app/${workspace.appId}/view`}
                >
                    Show
                </Button>
            </NavbarRight> */}

            <WorkspaceOverlay />
            <StyledMain>
                <StyledContent>
                    <WorkspaceLoading />
                    <StyledSpacer>
                        {workspace.model ? (
                            <>
                                <Layout
                                    ref={layoutRef}
                                    model={workspace.model}
                                    factory={(node) => {
                                        return factory(node, layoutRef.current);
                                    }}
                                    onModelChange={() => {
                                        workspace.saveToCache();
                                    }}
                                />
                                <StyledActions
                                    direction="column"
                                    justifyContent={'center'}
                                >
                                    <Tooltip title={'Reset workspace'}>
                                        <IconButton
                                            size={'small'}
                                            color="default"
                                            onClick={() => {
                                                resetWorkspace();
                                            }}
                                        >
                                            <RestartAlt fontSize="inherit" />
                                        </IconButton>
                                    </Tooltip>
                                </StyledActions>
                            </>
                        ) : null}
                    </StyledSpacer>
                </StyledContent>
            </StyledMain>
        </WorkspaceContext.Provider>
    );
});
