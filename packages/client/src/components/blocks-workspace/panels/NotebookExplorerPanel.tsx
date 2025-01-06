import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Actions, DockLocation, Layout, TabNode } from 'flexlayout-react';
import { useNotification, IconButton, Stack } from '@semoss/ui';
import { NoteAddOutlined, Refresh } from '@mui/icons-material';

import { useBlocks, useWorkspace } from '@/hooks';
import { ActionMessages } from '@/stores';
import { NewQueryOverlay, DeleteNotebookOverlay } from '@/components/notebook';
import { NotebookExplorerItem } from './NotebookExplorerPanelItem';
import { Panel } from '@/components/workspace';

interface NotebookExplorerPanelProps {
    /** Current layoutobject */
    layout: Layout;
}

export const NotebookExplorerPanel: React.FC<NotebookExplorerPanelProps> =
    observer((props) => {
        const { layout } = props;

        const { workspace } = useWorkspace();
        const { state, notebook } = useBlocks();

        const notification = useNotification();

        // files to add
        const [selected, setSelected] = useState<string>('');

        // temporary fix for dead refresh button should be removed
        const [counter, setCounter] = useState(0);

        /**
         * Refresh the notebooks
         */
        const refreshNotebooks = () => {
            // increment the counter
            setCounter(counter + 1);
        };

        /**
         * Open the add modal
         */
        const handleOpenCreateNotebook = () => {
            workspace.openOverlay(() => (
                <NewQueryOverlay
                    onClose={(newQueryId?: string) => {
                        if (newQueryId) {
                            // create the panel
                            createPanel(newQueryId);

                            // refresh the content
                            refreshNotebooks();
                        }

                        // close the overlay
                        workspace.closeOverlay();
                    }}
                />
            ));
        };

        /**
         * Select a panel and create one if it doesn't exist
         *
         * id - id of the notebook
         */
        const handleOnSelect = (id: string) => {
            // try to select a panel, if it doesn't exist create it. Save the path
            const IsSelected = selectPanel(id);
            if (!IsSelected) {
                createPanel(id);
            }

            // set the path
            setSelected(id);
        };

        /**
         * Open the delete modal
         */
        const handleOnTrashClick = (deletedNotebookId: string) => {
            workspace.openOverlay(() => (
                <DeleteNotebookOverlay
                    deletedNotebookId={deletedNotebookId}
                    onClose={(success) => {
                        if (success) {
                            // trigger the delete file callback if successful
                            removePanel(deletedNotebookId);

                            // refresh the content
                            refreshNotebooks();
                        }

                        workspace.closeOverlay();
                    }}
                />
            ));
        };

        /**
         * Open the delete modal
         */
        const handleOnCopyClick = (id: string) => {
            try {
                // get the notebook
                const notebook = state.getQuery(id);
                if (!notebook) {
                    notification.add({
                        color: 'error',
                        message: `Cannot find notebook ${id}`,
                    });
                }

                // get the json
                const json = notebook.toJSON();

                // get a new id
                let newQueryId = id;
                let newQueryCount = 1;
                while (state.getQuery(newQueryId)) {
                    newQueryId = `${id} (${newQueryCount})`;
                    newQueryCount++;
                }

                // dispatch it
                state.dispatch({
                    message: ActionMessages.NEW_QUERY,
                    payload: {
                        queryId: newQueryId,
                        config: {
                            cells: json.cells,
                        },
                    },
                });

                // select the panel in the layout
                selectPanel(newQueryId);
            } catch (e) {
                // log it
                console.error(e);

                // notify the user
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            }
        };

        /**
         * Handle dragging of an item
         *
         * event - drag event
         * path - id of the notebook
         */
        const handleOnDragStart = (event: React.MouseEvent, id: string) => {
            try {
                // get the model
                const model = workspace.selectedLayout?.model;
                if (!model) {
                    throw new Error('Missing model');
                }

                // TODO: altKey key needs to be down for now. event.altKey=false is reserved for panel-to-panel interactions
                if (!event.altKey) {
                    return;
                }

                // get the name
                const name = id.split('/').pop();

                // add to layout
                layout.addTabWithDragAndDrop(event as unknown as DragEvent, {
                    type: 'tab',
                    name: name,
                    component: 'notebook-viewer',
                    config: {
                        id: id,
                    },
                    enableClose: true,
                });
            } catch (e) {
                notification.add({
                    color: 'error',
                    message: e,
                });
            }
        };

        /** Helpers */
        /**
         * Create a new panel and highlight it
         *
         * id - id of the notebook
         */
        const createPanel = (id: string): boolean => {
            try {
                if (!id) {
                    return false;
                }

                // get the model
                const model = workspace.selectedLayout?.model;
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
                            component: 'notebook-viewer',
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

        /**
         * Select a panel if it is there. Return false if not selected.
         *
         * id - id of the notebook
         */
        const selectPanel = (id: string): boolean => {
            try {
                if (!id) {
                    return false;
                }

                let selectedNode: TabNode | null = null;

                // get the model
                const model = workspace.selectedLayout?.model;
                if (!model) {
                    throw new Error('Missing model');
                }

                // visit the notes, and see if it exists
                model.visitNodes((node) => {
                    // check if it is a tabNode
                    if (node instanceof TabNode) {
                        // it needs to be a notebook-viewer
                        const component = node.getComponent();
                        if (component !== 'notebook-viewer') {
                            return;
                        }

                        // path and space need to match
                        const config = node.getConfig();
                        if (config.id !== id) {
                            return;
                        }

                        selectedNode = node;
                    }
                });

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

        /**
         * Remove a panel
         *
         * id - id of the notebook
         */
        const removePanel = (id: string): boolean => {
            try {
                if (!id) {
                    return false;
                }

                const nodesToBeRemoved: TabNode[] = [];

                // get the model
                const model = workspace.selectedLayout?.model;
                if (!model) {
                    throw new Error('Missing model');
                }

                // visit the notes, and see if it exists
                model.visitNodes((node) => {
                    // check if it is a tabNode
                    if (node instanceof TabNode) {
                        // it needs to be a notebook-viewer
                        const component = node.getComponent();
                        if (component !== 'notebook-viewer') {
                            return;
                        }

                        // path and space need to match
                        const config = node.getConfig();
                        if (config.id !== id) {
                            return;
                        }

                        nodesToBeRemoved.push(node);
                    }
                });

                // delete the tabs
                for (const n of nodesToBeRemoved) {
                    const id = n.getId();
                    model.doAction(Actions.deleteTab(id));
                }
            } catch (e) {
                notification.add({
                    color: 'error',
                    message: e,
                });

                return false;
            }

            return true;
        };

        return (
            <Panel
                actions={
                    <>
                        <IconButton
                            size={'small'}
                            color={'default'}
                            title={'Refresh'}
                            onClick={() => {
                                refreshNotebooks();
                            }}
                        >
                            <Refresh fontSize="inherit" />
                        </IconButton>
                        <Stack flex={1}>&nbsp;</Stack>
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            spacing={0}
                        >
                            <IconButton
                                title={`Create new notebook`}
                                size={'small'}
                                color={'default'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenCreateNotebook();
                                }}
                            >
                                <NoteAddOutlined fontSize="inherit" />
                            </IconButton>
                        </Stack>
                    </>
                }
            >
                <Stack
                    key={counter}
                    direction="column"
                    height={'100%'}
                    overflow={'auto'}
                >
                    {notebook.queriesList.map((q) => {
                        return (
                            <NotebookExplorerItem
                                key={q.id}
                                id={q.id}
                                isSelected={selected === q.id}
                                onClick={() => handleOnSelect(q.id)}
                                onTrashClick={() => {
                                    handleOnTrashClick(q.id);
                                }}
                                onCopyClick={() => {
                                    handleOnCopyClick(q.id);
                                }}
                                onDragStart={(e) => handleOnDragStart(e, q.id)}
                            />
                        );
                    })}
                </Stack>
            </Panel>
        );
    });
