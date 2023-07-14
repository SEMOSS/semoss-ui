import { makeAutoObservable } from 'mobx';
import { Node, Edge } from 'react-flow-renderer';

import { NodeData } from '@/components/pipeline';

const SAMPLE_NODES: Node<NodeData>[] = [
    {
        id: 'node--1',
        type: 'pipeline',
        data: {
            guid: 'import-node',
            name: 'Import',
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
        id: 'node--2',
        type: 'pipeline',
        data: {
            guid: 'import-node',
            name: 'Import',
            parameters: {
                FRAME: {
                    type: 'frame',
                    value: {
                        name: '',
                    },
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
        id: 'node--3',
        type: 'pipeline',
        data: {
            guid: 'merge-node',
            name: 'Merge',
            parameters: {
                SOURCE_1: {
                    type: 'frame',
                    value: {
                        name: '',
                    },
                },
                SOURCE_2: {
                    type: 'frame',
                    value: {
                        name: '',
                    },
                },
                TARGET: {
                    type: 'frame',
                    value: {
                        name: '',
                    },
                },
            },
            input: ['SOURCE_1', 'SOURCE_2'],
            output: ['TARGET'],
        },
        position: {
            x: 500,
            y: 125,
        },
    },

    {
        id: 'node--4',
        type: 'pipeline',
        data: {
            guid: 'agent-node',
            name: 'Agent',

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
        id: 'node--5',
        type: 'pipeline',
        data: {
            guid: 'prompt-node',
            name: 'Prompt',
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
        id: 'edge--1',
        type: 'pipeline',
        source: 'node--1',
        sourceHandle: 'FRAME',
        target: 'node--3',
        targetHandle: 'SOURCE_1',
    },
    {
        id: 'edge--2',
        type: 'pipeline',
        source: 'node--2',
        sourceHandle: 'FRAME',
        target: 'node--3',
        targetHandle: 'SOURCE_2',
    },
    {
        id: 'edge--3',
        type: 'pipeline',
        source: 'node--3',
        sourceHandle: 'FRAME',
        target: 'node--4',
        targetHandle: 'FRAME',
    },
    {
        id: 'edge--5',
        type: 'pipeline',
        source: 'node--5',
        sourceHandle: 'PROMPT',
        target: 'node--4',
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
        nodes: Record<string, Node<NodeData>>;
        edges: Edge[];
    };
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
            nodes: {},
            edges: [],
        },
    };

    constructor() {
        this._store.graph = {
            nodes: {},
            edges: SAMPLE_EDGES,
        };

        for (const n of SAMPLE_NODES) {
            this._store.graph.nodes[n.id] = n;
        }

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
     * @returns the graph information
     */
    get graph() {
        return this._store.graph;
    }

    /**
     * Get the graph information
     * @returns list of rendered nodes
     */
    get renderedNodes() {
        return Object.values(this._store.graph.nodes) as Node<NodeData>[];
    }

    /**
     * Get the graph information
     * @returns the graph information
     */
    get renderedEdges() {
        return this._store.graph.edges;
    }

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

    /**
     * Save the parameters for a node
     *
     * @param id - id of the node
     */
    saveParameters(id: string, parameters: Partial<NodeData['parameters']>) {
        const node = this._store.graph.nodes[id];

        if (!node) {
            throw `Node ${id} does not exist`;
        }

        // go through the parameters and only update if they exist
        for (const p in parameters) {
            if (p in node.data.parameters) {
                node.data.parameters[p] = parameters[p];
            }
        }
    }

    /**
     * Update the name of the node
     *
     * @param id - id of the node
     * @param name - name of the node
     */
    updateName(id: string, name: string) {
        const node = this._store.graph.nodes[id];

        if (!node) {
            throw `Node ${id} does not exist`;
        }

        node.data.name = name;
    }
}
