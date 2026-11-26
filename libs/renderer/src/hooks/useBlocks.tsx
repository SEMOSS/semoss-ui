import { useContext } from "react";
import {
	BlocksContext,
	type BlocksContextProps,
} from "../contexts/Blocks.context";

/**
 * Access the current InsightStore
 * @returns the InsightStore
 */
export const useBlocks = (): BlocksContextProps => {
	const context = useContext(BlocksContext);
	if (context === undefined) {
		throw new Error("useBlocks must be used within Blocks");
	}

	return context;
};
