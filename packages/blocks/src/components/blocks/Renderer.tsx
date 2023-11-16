import { createElement } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlocks, useDesigner } from '@/hooks';

export interface RendererProps {
    /** Id of the block */
    id: string;
}

/**
 * Render a block
 */
export const Renderer = observer(({ id }: RendererProps): JSX.Element => {
    // get the store and mode
    const { state, registry } = useBlocks();
    const { active } = useDesigner();

    // get the block
    const block = state.getBlock(id);

    // get block
    if (!block) {
        throw Error(`Cannot find block ${id}`);
    }

    // get the widget
    const b = registry[block.widget];
    if (!b) {
        throw Error(`Widget ${b} for block ${id} is not registered`);
    }

    // render the view
    return createElement(b.render, {
        key: id,
        id: id,
    });
});
