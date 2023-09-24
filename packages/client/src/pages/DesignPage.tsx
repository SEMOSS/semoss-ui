import { useMemo } from 'react';

import { DesignerStore, StateStore, Block } from '@/stores';
import { runPixel } from '@/api';
import { Designer } from '@/components/designer';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/default-blocks';

const BLOCKS: Record<string, Block> = {
    'page-1': {
        id: 'page-1',
        widget: 'page',
        parent: null,
        data: {
            style: {
                background: 'lightblue',
                padding: '16px 0',
            },
        },
        listeners: {},
        slots: {
            content: {
                name: 'content',
                children: ['text-1', 'text-2', 'page-2', 'text-3'],
            },
        },
    },
    'page-2': {
        id: 'page-2',
        widget: 'page',
        parent: {
            id: 'page-1',
            slot: 'content',
        },
        data: {
            style: {
                background: 'lightgreen',
                padding: '16px 0',
            },
        },
        listeners: {},
        slots: {
            content: {
                name: 'content',
                children: [],
            },
        },
    },
    'text-1': {
        id: 'text-1',
        widget: 'text',
        parent: {
            id: 'page-1',
            slot: 'content',
        },
        data: {
            style: {
                display: 'block',
            },
            text: 'Text 1',
        },
        listeners: {},
        slots: {},
    },
    'text-2': {
        id: 'text-2',
        widget: 'text',
        parent: {
            id: 'page-1',
            slot: 'content',
        },
        data: {
            style: {
                display: 'block',
            },
            text: 'Text 2',
        },
        listeners: {},
        slots: {},
    },
    'text-3': {
        id: 'text-3',
        widget: 'text',
        parent: {
            id: 'page-1',
            slot: 'content',
        },
        data: {
            style: {
                marginTop: '200px',
                display: 'block',
            },
            text: 'Text 3',
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
