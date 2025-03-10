import { useContext } from "react";

import { BlocksContext } from "../contexts";
import { usePixel } from "@semoss/sdk";

/**
 * Run pixel within blocks context
 * @returns Pixel response
 */
export function useBlocksPixel<D>(
    pixel: string,
    config?,
): ReturnType<typeof usePixel<D>> {
    const context = useContext(BlocksContext);
    if (context === undefined) {
        throw new Error("useBlocksPixel must be used within Blocks");
    }

    return usePixel<D>(pixel, config, context.state.insightId);
}
