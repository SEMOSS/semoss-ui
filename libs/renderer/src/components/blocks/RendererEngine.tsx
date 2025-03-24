import { createElement } from "react";
import { observer } from "mobx-react-lite";

import { useBlocks } from "../../hooks";

export interface RendererEngineProps {
    /** Id of the block */
    id: string;
}

function stringToBoolean(string: string) {
    if (string === undefined) return false;
    switch (string.toLowerCase()) {
        case "true":
            return true;
        case "false":
            return false;
        default:
            return false;
    }
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
        if (
            block.data.hasOwnProperty("show") &&
            block.data.show !== undefined
        ) {
            let condition: unknown;
            //if a variable is assigned then parsed result is added to condition
            if (
                block.data.show.toString().startsWith("{{") &&
                block.data.show.toString().endsWith("}}")
            ) {
                condition = state.parseVariable(block.data.show?.toString());
            } else {
                condition = block.data.show; //direct value is passed if no variable is added
            }

            const toShowBlock = stringToBoolean(condition.toString())
                ? true
                : false;
            if (toShowBlock) {
                // render the view if this block can be shown
                return createElement(b.render, {
                    key: id,
                    id: id,
                });
            }
            // render the generic view of a block if hidden
            return createElement("div", {
                key: id,
                id: id,
                ["data-block"]: id,
            });
        } else {
            // render the view
            return createElement(b.render, {
                key: id,
                id: id,
            });
        }
    },
);
