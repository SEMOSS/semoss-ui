import React, { useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
    Avatar,
    styled,
    Stack,
    Typography,
    useNotification,
    IconButton,
    Tooltip,
    Drawer,
} from '@semoss/ui';
// import { Drawer } from '@mui/material';
import { Menu, MenuOpen, RestartAlt } from '@mui/icons-material';
import { Layout, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import './flexlayout.css';

import { Env } from '@/env';
import { THEME } from '@/constants';
import { WorkspaceContext } from '@/contexts';
import { WorkspaceStore, WorkspaceOptions } from '@/stores';
import { usePixel, useRootStore } from '@/hooks';
import { LoginPopover } from '@/components/ui';

import { WorkspaceOverlay } from './WorkspaceOverlay';
import { WorkspaceLoading } from './WorkspaceLoading';
import { WorkspaceTabs } from './WorkspaceTabs';

const StyledViewport = styled('div')(() => ({
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
}));

const StyledMain = styled('div', {
    shouldForwardProp: (prop) => prop !== 'drawerOpen',
})<{
    drawerOpen: boolean;
}>(({ drawerOpen }) => ({
    position: 'relative',
    flex: '1',
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
    const notification = useNotification();

    const layoutRef = useRef<Layout>(null);

    // build the model from the layout
    const model = workspace.selectedLayout?.model;

    const validateDependencies = usePixel(
        'ValidateUserProjectDependencies(project="' + workspace.appId + '");',
    );

    useEffect(() => {
        // default options if not loaded from cache
        const defaultOptions = JSON.parse(JSON.stringify(options));

        // try to load from cache
        const isLoaded = workspace.loadFromCache();
        if (!isLoaded) {
            workspace.load(defaultOptions);
        }
    }, [options]);

    useEffect(() => {
        if (validateDependencies.status !== 'SUCCESS') {
            return;
        } else if (validateDependencies.data !== null) {
            const needsAccess = [];
            Object.entries(validateDependencies.data).forEach((kv) => {
                const hasAccess = kv[1];

                if (!hasAccess) {
                    needsAccess.push(kv[0]);
                }
            });
            if (needsAccess.length) {
                notification.add({
                    color: 'warning',
                    message:
                        needsAccess.join(', ') +
                        '- are dependencies you do not have access to',
                });
            }
        }
    }, [validateDependencies.status, validateDependencies.data]);

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
            // reset only the selected one
            const selected = workspace.selectedLayout.id;
            if (!selected) {
                return;
            }

            // copy the optoins
            const layout = JSON.parse(
                JSON.stringify(options.layout.available[selected]),
            );

            // update the layout
            workspace.updateLayout(selected, layout);
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
            <StyledViewport>
                <StyledMain drawerOpen={workspace.drawer.isOpen}>
                    <Stack
                        direction={'row'}
                        alignItems={'center'}
                        padding={1}
                        spacing={1}
                    >
                        <IconButton
                            edge="start"
                            color={'default'}
                            aria-label="menu"
                            size={'small'}
                            onClick={() => {
                                workspace.toggleDrawer();

                                // save the workspace
                                workspace.saveToCache();
                            }}
                        >
                            {workspace.drawer.isOpen ? (
                                <StyledMenuOpenIcon fontSize="inherit" />
                            ) : (
                                <StyledMenuIcon fontSize="inherit" />
                            )}
                        </IconButton>
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            spacing={1}
                        >
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
                        <LoginPopover />
                    </Stack>
                    <StyledContent>
                        <WorkspaceLoading />
                        <StyledSpacer>
                            {model ? (
                                <>
                                    <Layout
                                        ref={layoutRef}
                                        model={model}
                                        factory={(node) => {
                                            return factory(
                                                node,
                                                layoutRef.current,
                                            );
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
            </StyledViewport>
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
                <Stack direction="column" gap={1} height={'100%'} padding={2}>
                    <StyledHeaderLogo to={'/'}>
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            spacing={1}
                        >
                            {themeMap.isLogoUrl ? (
                                <StyledHeaderLogoImg src={themeMap.logo} />
                            ) : THEME.logo ? (
                                <StyledHeaderLogoImg src={THEME.logo} />
                            ) : null}
                            <Typography variant={'subtitle2'}>
                                {themeMap.name ? themeMap.name : THEME.name}
                            </Typography>
                        </Stack>
                    </StyledHeaderLogo>
                    <Stack flex={1} direction="column" overflow={'auto'}>
                        <WorkspaceTabs />
                    </Stack>
                    <Stack
                        direction="column"
                        justifyContent={'center'}
                        spacing={0.25}
                    >
                        <Typography
                            variant={'caption'}
                            sx={{ fontSize: '.625rem' }}
                        >
                            ID: {workspace.appId}
                        </Typography>
                    </Stack>
                </Stack>
            </Drawer>
        </WorkspaceContext.Provider>
    );
});
