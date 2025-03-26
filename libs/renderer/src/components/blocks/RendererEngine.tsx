import { createElement } from "react";
import { observer } from "mobx-react-lite";

import { useBlocks } from "../../hooks";

export interface RendererEngineProps {
    /** Id of the block */
    id: string;
}

function showBlock(block, state): boolean {
    if (block.data.hasOwnProperty("show") && block.data.show !== undefined) {
        let condition: unknown;
        let trimmedBlockData = block.data.show?.toString()?.trim();
        try {
            //if a variable is assigned then parsed result is added to condition
            if (
                trimmedBlockData.startsWith("{{") &&
                trimmedBlockData.endsWith("}}")
            ) {
                condition = state.parseVariable(block.data.show?.toString());
            } else {
                condition = block.data.show; //direct value is passed if no variable is added
            }
            if (
                condition !== undefined &&
                condition !== null &&
                condition !== ""
            ) {
                if (condition.toString() === undefined) {
                    return false;
                }
                switch (condition.toString().toLowerCase()) {
                    case "true":
                    case "1":
                        return true;
                    case "false":
                    case "0":
                        return false;
                    default:
                        return false;
                }
            }
            // render the generic view of a block if data.show is undefined or false
            return false;
        } catch (e) {
            return true;
        }
    }
    //render the block directly if there is no show property for a block
    return true;
}
/**
 * Render a block
 */

/**
 * TODO: Rename possibly BlockElement
 */
export const RendererEngine = observer(
    ({ id }: RendererEngineProps): JSX.Element => {
        // get the store and mode
        const { state, registry } = useBlocks();

        // get the block
        const block = state.getBlock(id);

        // get block
        if (!block) {
            return null;
        }

        // get the widget
        const b = registry[block.widget];
        if (!b) {
            throw Error(
                `Widget ${block.widget} for block ${id} is not registered`,
            );
        }
        if (showBlock(block, state)) {
            return createElement(b.render, {
                key: id,
                id: id,
            });
        }
        return createElement("div", {
            key: id,
            id: id,
            ["data-block"]: id,
        });
    },
);
