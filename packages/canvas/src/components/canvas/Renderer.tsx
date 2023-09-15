import { createElement } from 'react';
import { observer } from 'mobx-react-lite';

import { useCanvas } from '@/hooks';

export interface RendererProps {
    /** Id of the block */
    id: string;
}

/**
 * Render a block
 */
export const Renderer = observer(({ id }: RendererProps): JSX.Element => {
    // get the store and mode
    const { canvas: store, widgets } = useCanvas();

    // get the block
    const block = store.getBlock(id);

    // get block
    if (!block) {
        throw Error(`Cannot find block ${id}`);
    }

    // get the widget
    const widget = widgets[block.widget];
    if (!widget) {
        throw Error(`Widget ${widget} for block ${id} is not registered`);
    }

    // return the element
    return createElement(observer(widget), {
        key: id,
        id: id,
    });
});
