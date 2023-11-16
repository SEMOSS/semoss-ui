import { useMemo } from 'react';

import {
    DesignerStore,
    Block,
    ActionMessages,
    Query,
    StateStoreImplementation,
} from '@/stores';
import { Designer } from '@/components/designer';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';
import { RunPixel } from '@/types';

const ACTIVE = 'page-1';

const QUERIES: Record<string, Query> = {
    'query-1': {
        id: 'query-1',
        isInitialized: false,
        isLoading: false,
        error: null,
        query: `LLM(engine=["f5f7fd76-a3e5-4dba-8cbb-ededf0f612b4"], command=["<encode>{{input-3.value}}</encode>"]);`,
        data: undefined,
        mode: 'manual',
    },
};
const BLOCKS: Record<string, Block> = {
    'page-1': {
        id: 'page-1',
        widget: 'page',
        parent: null,
        data: {
            style: {
                fontFamily: 'serif',
            },
        },
        listeners: {},
        slots: {
            content: {
                name: 'content',
                children: ['container-1'],
            },
        },
    },
    'container-1': {
        id: 'container-1',
        widget: 'container',
        parent: {
            id: 'page-1',
            slot: 'content',
        },
        data: {
            style: {
                background: 'white',
                boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
                flexDirection: 'column',
                gap: '16px',
                padding: '32px',
                width: '100%',
                maxWidth: '900px',
                margin: '0 auto',
            },
        },
        listeners: {},
        slots: {
            children: {
                name: 'children',
                children: [
                    'text-1',
                    'text-2',
                    'input-3',
                    'text-4',
                    'text-5',
                    'button-6',
                    'text-8',
                ],
            },
        },
    },
    'text-1': {
        id: 'text-1',
        widget: 'text',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
                fontSize: '2.125rem',
            },
            text: 'Title',
        },
        listeners: {},
        slots: {},
    },
    'text-2': {
        id: 'text-2',
        widget: 'text',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
                fontSize: '1.25rem',
            },
            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        },
        listeners: {},
        slots: {},
    },
    'input-3': {
        id: 'input-3',
        widget: 'input',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
            },
            value: '',
        },
        listeners: {
            onChange: [],
        },
        slots: {},
    },
    'text-4': {
        id: 'text-4',
        widget: 'text',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
                fontWeight: 'bold',
            },
            text: 'Answer:',
        },
        listeners: {},
        slots: {},
    },
    'text-5': {
        id: 'text-5',
        widget: 'text',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
            },
            text: '{{input-3.value}}',
        },
        listeners: {},
        slots: {},
    },
    'button-6': {
        id: 'button-6',
        widget: 'button',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
                padding: '16px',
                background: 'lightblue',
            },
        },
        listeners: {
            onClick: [
                {
                    message: ActionMessages.RUN_QUERY,
                    payload: {
                        id: 'query-1',
                    },
                },
            ],
        },
        slots: {
            text: {
                name: 'text',
                children: ['text-7'],
            },
        },
    },
    'text-7': {
        id: 'text-7',
        widget: 'text',
        parent: {
            id: 'button-6',
            slot: 'text',
        },
        data: {
            style: {
                display: 'block',
            },
            text: 'Submit',
        },
        listeners: {},
        slots: {},
    },
    'text-8': {
        id: 'text-8',
        widget: 'text',
        parent: {
            id: 'container-1',
            slot: 'children',
        },
        data: {
            style: {
                display: 'block',
                fontSize: '1.125rem',
            },
            text: '{{query-1.data.response}}',
        },
        listeners: {},
        slots: {},
    },
};

interface DesignPageProps {
    /** Injected callback to execute pixel */
    run: RunPixel;

    /** Queries rendered in the insight */
    queries: Record<string, Query>;

    /** Blocks rendered in the insight */
    blocks: Record<string, Block>;

    /** Editor mode */
    editMode: boolean;
}

export const DesignPage = ({
    run,
    blocks,
    queries,
    editMode,
}: DesignPageProps) => {
    console.log('blocks', blocks);
    console.log('queries', queries);
    // create a new blocks store
    const state = useMemo(() => {
        return new StateStoreImplementation(
            { blocks: blocks, queries: queries, run: run },
            {
                onQuery: async ({ query }) => {
                    console.log('running', query);
                    const response = await run(query);
                    console.log(response);

                    if (response.errors.length) {
                        throw new Error(response.errors.join(''));
                    }

                    return {
                        data: response.pixelReturn[0].output,
                    };
                },
            },
        );
    }, [blocks, queries, run]);

    /** Find the root */
    const rootId = useMemo(() => {
        for (const key in blocks) {
            if (
                Object.prototype.hasOwnProperty.call(blocks, key) &&
                blocks[key]?.parent === null
            ) {
                return key;
            }
        }

        return '';
    }, [blocks]);

    /**
     * Have the designer control the blocks
     */
    const designer = useMemo(() => {
        const d = new DesignerStore(state);

        // set the rendered one
        d.setRendered(ACTIVE);

        // return the store
        return d;
    }, [state]);

    return (
        // TODO: Fix
        <div style={{ height: '100vh', width: '100vw' }}>
            <Blocks state={state} registry={DefaultBlocks}>
                <Designer designer={designer}>
                    <Renderer id={rootId} />
                </Designer>
            </Blocks>
        </div>
    );
};
