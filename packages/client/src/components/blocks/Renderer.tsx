import { createElement } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlocks } from '@/hooks';

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

    // get the block
    const block = state.getBlock(id);

    // get block
    if (!block) {
        throw Error(`Cannot find block ${id}`);
    }

    // get the widget
    const component = registry[block.widget];
    if (!component) {
        throw Error(`Widget ${component} for block ${id} is not registered`);
    }

    // return the element
    return createElement(observer(component), {
        key: id,
        id: id,
    });
});
