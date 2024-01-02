import { createElement } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlocks } from '@/hooks';

export interface RendererProps {
    /** Id of the block */
    id: string;

    /** Id of selected block (if exists) */
    selectedId?: string;

    /** Whether or not workspace is in edit mode */
    isEditMode?: boolean;
}

/**
 * Render a block
 */
export const Renderer = observer(
    ({
        id,
        selectedId = null,
        isEditMode = false,
    }: RendererProps): JSX.Element => {
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
            throw Error(`Widget ${b} for block ${id} is not registered`);
        }

        // render the view
        return createElement(b.render, {
            key: id,
            id: id,
            selectedId: selectedId,
            isEditMode: isEditMode,
        });
    },
);
