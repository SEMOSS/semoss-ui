import { useContext } from 'react';

import { BlocksContext } from '@/contexts';
import { usePixel } from './usePixel';

/**
 * Run pixel within blocks context
 * @returns Pixel response
 */
export function useBlocksPixel<D>(pixel: string) {
    const context = useContext(BlocksContext);
    if (context === undefined) {
        throw new Error('useBlocksPixel must be used within Blocks');
    }

    return usePixel<D>(pixel, undefined, context.state.insightId);
}
