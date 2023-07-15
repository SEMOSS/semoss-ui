import { makeAutoObservable } from 'mobx';
import { Node, Edge, NodeChange, applyNodeChanges } from 'react-flow-renderer';

import { NodeData } from '@/components/pipeline';

const SAMPLE_NODES: Node<NodeData>[] = [
    {
        id: 'node--old--1',
        type: 'pipeline',
        data: {
            guid: 'import-node',
            display: {
                name: 'Import',
                description: '',
                icon: '',
            },
            parameters: {
                FRAME: {
                    type: 'frame',
                    value: {
                        name: '',
                    },
                },
                DATABASE: {
                    type: 'string',
                    value: '',
                },
                QUERY: {
                    type: 'string',
                    value: '',
                },
            },
            input: [],
            output: ['FRAME'],
        },
        position: {
            x: 50,
            y: 50,
        },
    },
    {
        id: 'node--old--2',
        type: 'pipeline',
        data: {
            guid: 'import-node',
            display: {
                name: 'Import',
                description: '',
                icon: '',
            },
            parameters: {
                FRAME: {
                    type: 'frame',
                    value: {
                        name: '',
                    },
                },
                DATABASE: {
                    type: 'string',
                    value: '',
                },
                QUERY: {
                    type: 'string',
                    value: '',
                },
            },
            input: [],
            output: ['FRAME'],
        },
        position: {
            x: 50,
            y: 250,
        },
    },
    {
        id: 'node--old--3',
        type: 'pipeline',
        data: {
            guid: 'merge-node',
            display: {
                name: 'Merge',
                description: '',
                icon: '',
            },
            parameters: {
                SOURCE: {
                    type: 'frame',
                    value: {
                        name: '',
                    },
                },
                SOURCE_COLUMN: {
                    type: 'string',
                    value: '',
                },
                TARGET: {
                    type: 'frame',
                    value: {
                        name: '',
                    },
                },
                TARGET_COLUMN: {
                    type: 'string',
                    value: '',
                },
            },
            input: ['SOURCE', 'TARGET'],
            output: ['TARGET'],
        },
        position: {
            x: 500,
            y: 125,
        },
    },
    {
        id: 'node--old--4',
        type: 'pipeline',
        data: {
            guid: 'agent-node',
            display: {
                name: 'Agent',
                description: '',
                icon: '',
            },

            parameters: {
                PROMPT: {
                    type: 'string',
                    value: '',
                },
                FRAME: {
                    type: 'frame',
                    value: {
                        name: '',
                    },
                },
            },
            input: ['FRAME', 'PROMPT'],
            output: [],
        },
        position: {
            x: 950,
            y: 225,
        },
    },
    {
        id: 'node--old--5',
        type: 'pipeline',
        data: {
            guid: 'prompt-node',
            display: {
                name: 'Prompt',
                description: '',
                icon: '',
            },
            parameters: {
                PROMPT: {
                    type: 'string',
                    value: '',
                },
            },
            input: [],
            output: ['PROMPT'],
        },
        position: {
            x: 500,
            y: 425,
        },
    },
];

const SAMPLE_EDGES: Edge[] = [
    {
        id: 'edge--old--1',
        type: 'pipeline',
        source: 'node--old--1',
        sourceHandle: 'FRAME',
        target: 'node--old--3',
        targetHandle: 'SOURCE',
    },
    {
        id: 'edge--old--2',
        type: 'pipeline',
        source: 'node--old--2',
        sourceHandle: 'FRAME',
        target: 'node--old--3',
        targetHandle: 'TARGET',
    },
    {
        id: 'edge--old--3',
        type: 'pipeline',
        source: 'node--old--3',
        sourceHandle: 'FRAME',
        target: 'node--old--4',
        targetHandle: 'FRAME',
    },
    {
        id: 'edge--old--5',
        type: 'pipeline',
        source: 'node--old--5',
        sourceHandle: 'PROMPT',
        target: 'node--old--4',
        targetHandle: 'PROMPT',
    },
];

export interface PipelineStoreInterface {
    /** Overlay information */
    overlay: {
        /** track if the overlay is open or closed */
        open: boolean;

        /** Id of the active node */
        activeNode: string;
    };

    /** Rendered graph information */
    graph: {
        nodes: Node<NodeData>[];
        edges: Edge[];
    };

    /** Recipie information */
    recipe: {
        pixel: string;
        nodeId: string;
    }[];
}

/**
 * Internal state management of the builder object
 */
export class PipelineStore {
    private _store: PipelineStoreInterface = {
        overlay: {
            open: false,
            activeNode: '',
        },
        graph: {
            nodes: [],
            edges: [],
        },
        recipe: [],
    };

    private _counter = {
        node: 0,
        edge: 0,
    };

    constructor() {
        this._store.graph = {
            nodes: SAMPLE_NODES,
            edges: SAMPLE_EDGES,
        };

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    /**
     * Get the overlay information
     * @returns the overlay information
     */
    get overlay() {
        return this._store.overlay;
    }

    /**
     * Get the graph information
     * @returns the graph
     */
    get graph() {
        return this._store.graph;
    }

    /**
     * Get node information
     *
     * @param id - id of the node
     *
     * @returns the node information
     */
    getNode(id: string): Node<NodeData> | null {
        for (const n of this._store.graph.nodes) {
            if (n.id === id) {
                return n;
            }
        }

        return null;
    }

    /** Utility */
    /**
     * Open the overlay
     *
     * activeNode - current activeNode
     */
    private generateId(name: 'node' | 'edge') {
        return `${name}--${++this._counter[name]}`;
    }

    /** Overlay */
    /**
     * Open the overlay
     *
     * activeNode - current activeNode
     */
    openOverlay(activeNode: string) {
        // open the overlay
        this.overlay.open = true;

        // set the content
        this.overlay.activeNode = activeNode;
    }

    /**
     * Close the overlay
     */
    closeOverlay() {
        // close the overlay
        this.overlay.open = false;

        // clear the content
        this.overlay.activeNode = null;
    }

    /** Node */
    /**
     * Save information into the node
     *
     * @param id - id of the node
     * @param options - options to save in the node
     */
    addNode(
        data: NodeData,
        position: {
            x: number;
            y: number;
        } = {
            x: 0,
            y: 0,
        },
    ) {
        // generate an id
        const id = this.generateId('node');

        // add the node
        this._store.graph.nodes.push({
            id: id,
            type: 'pipeline',
            data: data,
            position: position,
        });
    }

    /**
     * Update the node
     *
     * @param id - id of the node
     * @param options - options to save in the node
     */
    updateNode(changes: NodeChange[]) {
        // get a map of id to idx
        const map = this._store.graph.nodes.reduce((acc, val, idx) => {
            acc[val.id] = idx;
            return acc;
        }, {});

        console.log(map);

        for (const c of changes) {
            if (c.type === 'position') {
                // check if it exists
                if (!map[c.id]) {
                    continue;
                }

                // update the node
                const node = this._store.graph.nodes[map[c.id]];

                console.log(node, c);
                if (c.position) {
                    console.log('applying');
                    node.position = c.position;
                }

                if (c.positionAbsolute) {
                    node.positionAbsolute = c.positionAbsolute;
                }

                if (c.dragging) {
                    node.dragging = c.dragging;
                }
            }
        }
    }

    /**
     * Save information into the node
     *
     * @param id - id of the node
     * @param options - options to save in the node
     */
    saveNode(
        id: string,
        options: Partial<{
            display: Partial<NodeData['display']>;
            parameters: Partial<NodeData['parameters']>;
        }>,
    ) {
        // get the node
        const node = this.getNode(id);
        if (!node) {
            throw `Node ${id} does not exist`;
        }

        // go through the parameters and only update if they exist
        if (options.parameters) {
            for (const p in options.parameters) {
                if (p in node.data.parameters) {
                    node.data.parameters[p] = options.parameters[p];
                }
            }
        }

        // go through the display and only update if they exist
        if (options.display) {
            for (const d in options.display) {
                if (d in node.data.display) {
                    node.data.display[d] = options.display[d];
                }
            }
        }
    }

    /** Pixel */
    /**
     * Query the backend
     *
     * @param id - id of the node
     * @param pixel - pixel to query the backend with
     */
    async queryPixel(id: string, pixel: string) {
        console.log('TODO ::: Query', id, pixel);
    }

    /**
     * Run a pixel and add to the recipe
     *
     * @param id - id of the node
     * @param options - options to save in the node
     */
    async runPixel(id: string, pixel: string) {
        // get the node
        const node = this.getNode(id);
        if (!node) {
            throw `Node ${id} does not exist`;
        }

        // add to the recipie
        this._store.recipe.push({
            nodeId: id,
            pixel: pixel,
        });

        console.log('TODO ::: Run', id, pixel);
    }
}
