import { useMemo } from 'react';

import {
    DesignerStore,
    Block,
    Query,
    StateStoreImplementation,
    Registry,
} from '@/stores';
import { Designer } from '@/components/designer';
import { Blocks, Renderer } from '@/components/blocks';
import { DefaultBlocks } from '@/components/block-defaults';
import { RunPixel } from '@/types';

interface BlocksBuilderProps {
    /** Injected callback to execute pixel */
    run: RunPixel;

    /** Queries rendered in the insight */
    queries: Record<string, Query>;

    /** Blocks rendered in the insight */
    blocks: Record<string, Block>;

    /** Blocks rendered in the insight */
    customBlocks: Registry;

    /** Editor mode */
    editMode: boolean;
}

export const BlocksBuilder = ({
    run,
    blocks,
    queries,
    customBlocks,
    editMode,
}: BlocksBuilderProps) => {
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
    const rootId = useMemo<string>(() => {
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
        d.setRendered(rootId);

        // return the store
        return d;
    }, [state, rootId]);

    /**
     * Add external blocks to the registry
     */
    const defaultBlocks = useMemo(() => {
        if (customBlocks) {
            return { ...DefaultBlocks, ...customBlocks };
        }
        return DefaultBlocks;
    }, [customBlocks]);

    return (
        <Blocks state={state} registry={defaultBlocks}>
            {editMode ? (
                <Designer designer={designer}>
                    <Renderer id={rootId} />
                </Designer>
            ) : (
                <Renderer id={rootId} />
            )}
        </Blocks>
    );
};
