import React, { useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Menu, MenuOpen, Public, RestartAlt } from '@mui/icons-material';
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
import { useRootStore } from '@/hooks';
import { WorkspaceOverlay } from './WorkspaceOverlay';
import { WorkspaceLoading } from './WorkspaceLoading';

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
    overflow: 'hidden',
}));

const StyledMenuOpenIcon = styled(MenuOpen)(() => ({
    color: 'rgba(0, 0, 0, 0.54)',
}));

const StyledMenuIcon = styled(Menu)(() => ({
    color: 'rgba(0, 0, 0, 0.54)',
}));

const StyledHeaderLogo = styled(Link)(({ theme }) => ({
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    ':hover': {
        bacakground: theme.palette.action.hover,
    },
}));

const StyledHeaderLogoImg = styled('img')(({ theme }) => ({
    width: theme.spacing(3),
}));

const StyledActions = styled(Stack)(({ theme }) => ({
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: '32px', // from flexlayout
    zIndex: 1,
}));

type WorkspaceProps = {
    /** End items to render in the top bar */
    endTopbar?: React.ReactNode;

    /** Alert to display in topbar */
    alert?: React.ReactNode;

    /** Footer to render */
    footer?: React.ReactNode;

    /** Workspace to render */
    workspace: WorkspaceStore;

    /** Options to load into the workspace */
    options: WorkspaceOptions;

    /** Factor method */
    factory: (node: TabNode, layout: Layout) => React.ReactNode;
};

export const Workspace = observer((props: WorkspaceProps) => {
    const {
        endTopbar = null,
        alert,
        footer = null,
        workspace,
        options,
        factory = () => null,
    } = props;
    const { configStore } = useRootStore();

    const layoutRef = useRef<Layout>(null);

    // build the model from the layout
    // const model = workspace.model;

    useEffect(() => {
        // default options if not loaded from cache
        const defaultOptions = JSON.parse(JSON.stringify(options));

        // try to load from cache
        const isLoaded = workspace.loadFromCache();
        if (!isLoaded) {
            workspace.load(defaultOptions);
        }
    }, [options]);

    const themeMap = useMemo(() => {
        const theme = configStore.store.config['theme'];

        if (theme && theme['THEME_MAP']) {
            try {
                return JSON.parse(theme['THEME_MAP'] as string);
            } catch {
                return {};
            }
        }

        return {};
    }, [Object.keys(configStore.store.config).length]);

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

    return (
        <WorkspaceContext.Provider
            value={{
                workspace: workspace,
            }}
        >
            <WorkspaceOverlay />
            <StyledMain>
                <Stack
                    direction={'row'}
                    alignItems={'center'}
                    padding={1}
                    spacing={1}
                >
                    <Stack direction="row" alignItems={'center'} spacing={1}>
                        <Avatar
                            variant="rounded"
                            src={`${Env.MODULE}/api/project-${workspace.appId}/projectImage/download`}
                        />
                        <Typography variant={'subtitle1'}>
                            {workspace.metadata.project_name}
                        </Typography>
                    </Stack>

                    <Stack
                        flex={1}
                        alignItems={'center'}
                        justifyContent={'center'}
                        overflow={'hidden'}
                    >
                        <div>{alert || <>&nbsp;</>}</div>
                    </Stack>
                    {endTopbar}
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
                        to={`../../../app/${workspace.appId}`}
                    >
                        Show
                    </Button>
                </Stack>
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
                {footer}
            </StyledMain>
        </WorkspaceContext.Provider>
    );
});
