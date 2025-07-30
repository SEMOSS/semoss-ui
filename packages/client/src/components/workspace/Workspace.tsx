import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { InfoOutlined, Menu, Public, RestartAlt } from '@mui/icons-material';

import { Actions, DockLocation, Layout, TabNode } from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import './flexlayout.css';
import {
    styled,
    Stack,
    Typography,
    IconButton,
    Tooltip,
    Breadcrumbs,
    useNotification,
    Button,
    Avatar,
} from '@semoss/ui';
import { useBlocks, ActionMessages } from '@semoss/renderer';

import { WorkspaceContext } from '@/contexts';
import { WorkspaceStore, WorkspaceOptions, getBlockElement } from '@/stores';
import { useDesigner, usePage, useRootStore } from '@/hooks';
import { WorkspaceOverlay } from './WorkspaceOverlay';
import { WorkspaceLoading } from './WorkspaceLoading';

import { SIDEBAR_MENU } from '@/pages/import/import.constants';
import SEMOSS_BLACK_LOGO from '@/assets/img/SEMOSS_BLACK_LOGO.png';
import { PAGE_BLOCK } from '../blocks-workspace/panels/LayersPanel';
import { AddPage } from '@/assets/img/AddPage';
import { ClosePage } from '@/assets/img/ClosePage';
import { NavbarHeader, NavbarLeft, NavbarRight } from '../shared';

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
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(1.5),
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

const StyledAppTypography = styled(Typography)(() => ({
    color: 'rgb(0, 0, 0)',
}));

const StyledSemossImage = styled('img')(() => ({}));

const StyledLetTabImage = styled('img')(() => ({
    width: 50,
    height: 40,
    display: 'block',
    margin: 'auto',
    transition: 'all 0.2s ease',
}));

const StyledRenderTabSet = styled('div')(() => ({
    padding: '0 8px',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '1.2rem',
    alignItems: 'center',
}));

const StyledHeaderLogo = styled(Link)(({ theme }) => ({
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    ':hover': {
        bacakground: theme.palette.action.hover,
    },
}));

const StyledActions = styled(Stack)(({ theme }) => ({
    position: 'absolute',
    bottom: '8px',
    left: '8px',
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
    const { page } = usePage();
    const { configStore } = useRootStore();
    const accordionRefs = useRef({});
    const { state } = useBlocks();
    const { designer } = useDesigner();
    const notification = useNotification();
    const [layoutRefeshKey, setLayoutRefeshKey] = useState(0);
    const layoutRef = useRef<Layout | null>(null);
    const model = workspace.model;

    // build the model from the layout
    useEffect(() => {
        page.navbar.search = false;
        const handler = (e: CustomEvent) => {
            const { destinationType, destination } = e.detail;
            if (destinationType === 'App Page') {
                const model = workspace.model;

                // get the model
                if (!model) {
                    throw new Error('Missing model');
                }

                let selectedNode: TabNode | null = null;

                // visit the notes, and see if it exists
                model.visitNodes((node) => {
                    // check if it is a tabNode
                    if (node instanceof TabNode) {
                        // it needs to be a notebook-viewer
                        const component = node.getComponent();
                        if (component !== 'designer') {
                            return;
                        }

                        // path and space need to match
                        const config = node.getConfig();
                        if (config.id !== destination) {
                            return;
                        }

                        selectedNode = node;
                    }
                });

                // create a new panel if there is no node
                if (!selectedNode) {
                    // get the name
                    const name = destination;

                    // where to add the node
                    const addId =
                        model.getActiveTabset()?.getId() ||
                        model.getRoot().getChildren()[0]?.getId() ||
                        '';

                    // create and select the panel
                    model.doAction(
                        Actions.addNode(
                            {
                                type: 'tab',
                                name: name,
                                component: 'designer',
                                config: {
                                    id: destination,
                                },
                                enableClose: true,
                            },
                            addId,
                            DockLocation.CENTER,
                            -1,
                            true,
                        ),
                    );
                }

                const selectedNodeId = selectedNode.getId();
                model.doAction(Actions.selectTab(selectedNodeId));
            }
        };
        window.addEventListener('OPEN_EVENT', handler as EventListener);
        return () => {
            window.removeEventListener('OPEN_EVENT', handler as EventListener);
        };
    }, []);

    useEffect(() => {
        // default options if not loaded from cache
        const defaultOptions = JSON.parse(JSON.stringify(options));
        // set the workspace options
        // try to load from cache
        const isLoaded = workspace.loadFromCache();
        if (!isLoaded) {
            workspace.load(defaultOptions);
        }
    }, [options]);

    useEffect(() => {
        openTab();
    }, [designer.selected]);

    function getIdByName(iMap, targetName: string): string | null {
        for (const [key, value] of iMap.entries()) {
            if (value?.attributes?.name === targetName) {
                if (!value?.visible) {
                    return key;
                }
            }
        }
        return null;
    }

    const openTab = () => {
        const layout = layoutRef.current;
        if (!layout) return;
        const model = workspace.model;
        const tabId = getIdByName(model['idMap'], 'Block Settings');
        model.doAction(Actions.selectTab(tabId));
    };

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

    const handleRenderTabSet = (tabSetNode, renderValues) => {
        if (
            tabSetNode.getId() === 'border_left' ||
            tabSetNode.getId() === 'border_right'
        ) {
            return;
        }
        renderValues.buttons.unshift(
            <StyledRenderTabSet
                key="custom-add-button"
                title="Add Tab"
                onClick={() => handlePageAdd()}
            >
                <AddPage />
            </StyledRenderTabSet>,
        );
    };

    const handlePageAdd = async () => {
        try{
        const newPageId = await state.dispatch({
            message: ActionMessages.ADD_BLOCK,
            payload: {
                json: PAGE_BLOCK,
            },
        });
        if (typeof newPageId === 'string') {
            const block = state.blocks[newPageId];
            handlePageSelection(block);
        } else {
            console.error('Invalid newPageId:', newPageId);
        }
    } catch (error) {
        console.error('Error adding new page:', error);
        notification.add({
            color: 'error',
            message: 'Failed to add new page',
        });
    };
    };

    const handlePageSelection = (block) => {
        accordionRefs.current = {};
        designer.setSelected(block.id);
        handleOnSelect(block);
    };

    const scrollIntoView = (
        element: Element | null,
        {
            behavior = 'smooth' as ScrollBehavior,
            block = 'center' as ScrollLogicalPosition,
            inline = 'start' as ScrollLogicalPosition,
        } = {},
    ) => {
        (element as HTMLElement)?.scrollIntoView({
            behavior,
            block,
            inline,
        });
    };

    const getNodeInfo = (id, model) => {
        let returnedNode: TabNode | null = null;
        // visit the notes, and see if it exists
        model.visitNodes((node) => {
            // check if it is a tabNode
            if (node instanceof TabNode) {
                // it needs to be a notebook-viewer
                const component = node.getComponent();
                if (component !== 'designer') {
                    return;
                }

                // path and space need to match
                const config = node.getConfig();
                if (config.id !== id) {
                    return;
                }

                returnedNode = node;
            }
        });

        return returnedNode;
    };

    const selectPanel = (id: string): boolean => {
        try {
            if (!id) {
                return false;
            }

            let selectedNode: TabNode | null = null;

            // get the model
            const model = workspace.model;
            if (!model) {
                throw new Error('Missing model');
            }

            selectedNode = getNodeInfo(id, model);

            // create a new panel if there is no node
            if (!selectedNode) {
                return false;
            }
            const selectedNodeId = selectedNode.getId();
            model.doAction(Actions.selectTab(selectedNodeId));
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });

            return false;
        }

        return true;
    };

    const createPanel = (id: string): boolean => {
        try {
            if (!id) {
                return false;
            }

            // get the model
            const model = workspace.model;
            if (!model) {
                throw new Error('Missing model');
            }

            // get the name
            const name = id;

            // where to add the node
            const addId =
                model.getActiveTabset()?.getId() ||
                model.getRoot().getChildren()[0]?.getId() ||
                '';

            // create and select the panel
            model.doAction(
                Actions.addNode(
                    {
                        type: 'tab',
                        name: name,
                        component: 'designer',
                        config: {
                            id: id,
                        },
                        enableClose: true,
                    },
                    addId,
                    DockLocation.CENTER,
                    -1,
                    true,
                ),
            );
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });

            return false;
        }

        return true;
    };

    const handleOnSelect = (blockData) => {
        const id = blockData.id;
        if (blockData.widget !== 'page') {
            scrollIntoView(getBlockElement(id));
            return;
        }
        // try to select a panel, if it doesn't exist create it. Save the path
        const IsSelected = selectPanel(id);
        if (!IsSelected) {
            createPanel(id);
        }
    };

    const updateModel = (action) => {
        if (!model) return;

        const isSettingsTab = action.data.tabNode === 'settings';
        const mainTabsetWeight = model?.getNodeById('main-tabset')?.getAttr('weight');
        
        model.getBorderSet().getBorders().forEach((border) => {
            border.setSelected(isSettingsTab ? -1 : border.getSelected());
        });

        if (isSettingsTab || mainTabsetWeight === 0) {
            model.visitNodes((node) => {
                if (node.getType() === 'tabset') {
                    const newWeight = (isSettingsTab && node.getId() === 'settings-tabset') || (!isSettingsTab && mainTabsetWeight === 0 && node.getId() !== 'settings-tabset') ? 100 : 0;
                    model.doAction(
                        Actions.updateNodeAttributes(node.getId(), { weight: newWeight }),
                    );
                }
            });
        }
    };
    
    return (
        <WorkspaceContext.Provider
            value={{
                workspace: workspace,
            }}
        >
            <NavbarLeft>
                <NavbarHeader
                    logo={
                        <StyledSemossImage
                            src={SEMOSS_BLACK_LOGO}
                            alt="SEMOSS"
                        ></StyledSemossImage>
                    }
                />
                <Breadcrumbs separator=" /">
                    <StyledHeaderLogo to={'/'}>
                        <Stack direction={'row'} alignItems={'center'}>
                            <StyledAppTypography variant={'subtitle1'}>
                                App Library
                            </StyledAppTypography>
                        </Stack>
                    </StyledHeaderLogo>
                    <StyledHeaderLogo
                        to={`/app/${workspace.metadata.project_id}/view`}
                    >
                        <StyledAppTypography variant={'subtitle1'}>
                            {workspace.metadata.project_name}
                        </StyledAppTypography>
                    </StyledHeaderLogo>
                    <StyledHeaderLogo to={''}>
                        <Typography
                            variant={'subtitle1'}
                            sx={{ display: 'inline', mr: 0.5 }}
                        >
                            {workspace.metadata.project_name} - Editor
                        </Typography>
                        {/* TODO : Info icon requires the text */}
                        {/* <IconButton size={'small'}>
                                    <InfoOutlined
                                        sx={{ color: '#666', fontSize: 16 }}
                                    />
                                </IconButton>  */}
                    </StyledHeaderLogo>
                </Breadcrumbs>
            </NavbarLeft>
            <NavbarRight>{navbarActions}</NavbarRight>
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
                                    icons={{
                                        close: <ClosePage />,
                                    }}
                                    onRenderTabSet={handleRenderTabSet}
                                    onModelChange={() => {
                                        workspace.saveToCache();
                                    }}
                                    onAction={(action) => {
                                        updateModel(action);
                                        return action;
                                    }}
                                    onRenderTab={(tabNode, renderValues) => {
                                        const item = SIDEBAR_MENU.MENU.find(
                                            (menuItem) =>
                                                menuItem.name ===
                                                tabNode.getName(),
                                        );
                                        const isSelected = tabNode.isSelected();
                                        if (item && item.icon) {
                                            const iconSrc = isSelected
                                                ? item.icon.active
                                                : item.icon.default;
                                            renderValues.content = (
                                                <StyledLetTabImage
                                                    src={iconSrc}
                                                    alt={tabNode.getName()}
                                                />
                                            );
                                        }
                                        return renderValues;
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
            <WorkspaceOverlay />
        </WorkspaceContext.Provider>
    );
});
