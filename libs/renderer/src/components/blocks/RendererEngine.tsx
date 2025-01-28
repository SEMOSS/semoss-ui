import { createElement } from "react";
import { observer } from "mobx-react-lite";

import { useBlocks } from "../../hooks";

export interface RendererEngineProps {
    /** Id of the block */
    id: string;
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

        // render the view
        return createElement(b.render, {
            key: id,
            id: id,
        });
    },
);
