import { useMemo } from 'react';

import { DesignerStore, StateStore, Block } from '@/stores';
import { runPixel } from '@/api';
import { Designer } from '@/components/designer';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';

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
                children: ['text-1', 'text-2', 'input-3', 'text-4', 'text-5'],
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
};

export const DesignPage = () => {
    // create a new blocks store
    const state = useMemo(() => {
        return new StateStore(
            { blocks: BLOCKS },
            {
                onQuery: async ({ query }) => {
                    const response = await runPixel('', query);

                    if (response.errors.length) {
                        throw new Error(response.errors.join(''));
                    }

                    return {
                        data: response.pixelReturn[0].output,
                    };
                },
            },
        );
    }, []);

    /**
     * Have the designer control the blocks
     */
    const designer = useMemo(() => {
        return new DesignerStore(state);
    }, [state]);

    return (
        // TODO: Fix
        <div style={{ height: '100vh', width: '100vw' }}>
            <Blocks state={state} registry={DefaultBlocks}>
                <Designer designer={designer}>
                    <Renderer id="page-1" />
                </Designer>
            </Blocks>
        </div>
    );
};
